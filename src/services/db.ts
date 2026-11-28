// Secure local database service for Chevvy
// Simulates a production-ready secure API server with strict data isolation, WebCrypto hashing, and audit logging.

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'user' | 'admin';
  spotifyConnected: boolean;
  spotifyUser?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: 'important' | 'normal' | 'low';
  color: string; // hex or color name
  colorType: 'pastel' | 'metallic' | 'standard';
  dueDate: string; // ISO date string
  reminderBefore: number[]; // minutes before task to trigger notifications
  hasAlarm: boolean;
  alarmMusic?: string; // song name / Spotify track uri
  completed: boolean;
  completedAt?: string;
  snoozedCount: number;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // html or markdown representation
  folder: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  event: string;
  details: string;
  timestamp: string;
  device: string;
}

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  createdAt: string;
  lastActive: string;
}

// All identifiers (including session tokens and password salts) come from the
// CSPRNG. Math.random is predictable and must never be used for either.
export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_PREFIX = 'pbkdf2$';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');
}

// Compare fixed-length hex strings without short-circuiting on the first
// difference, so verification time does not reveal a matching prefix.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Passwords are stretched with PBKDF2-SHA256. The stored value is versioned so
// legacy single-round SHA-256 hashes can still log in and be upgraded on the
// next successful authentication.
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return `${PBKDF2_PREFIX}${PBKDF2_ITERATIONS}$${toHex(bits)}`;
}

async function legacySha256(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(password + salt);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

/** Verify a password and return an upgraded hash when a legacy one matched. */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string,
): Promise<{ ok: boolean; upgrade?: string }> {
  if (storedHash.startsWith(PBKDF2_PREFIX)) {
    // Re-derive with the stored parameters rather than trusting a client value.
    const [, storedIterations, storedDigest] = storedHash.split('$');
    if (!storedDigest || Number(storedIterations) !== PBKDF2_ITERATIONS) return { ok: false };
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      key,
      256,
    );
    return { ok: constantTimeEqual(toHex(bits), storedDigest) };
  }

  const legacy = await legacySha256(password, salt);
  if (!constantTimeEqual(legacy, storedHash)) return { ok: false };
  return { ok: true, upgrade: await hashPassword(password, salt) };
}

// Initialize tables in LocalStorage if they don't exist
const TABLES = {
  USERS: 'chevvy_users',
  TASKS: 'chevvy_tasks',
  NOTES: 'chevvy_notes',
  AUDIT_LOGS: 'chevvy_audit_logs',
  SESSIONS: 'chevvy_sessions',
  SETTINGS: 'chevvy_settings',
};

// Initialise storage. No accounts are seeded with a password baked into the
// bundle: a universal "admin123" would grant every visitor admin rights. An
// operator can create the first admin by setting VITE_ADMIN_BOOTSTRAP_PASSWORD
// before the first load (see .env.example); the password is never committed.
export async function initDatabase() {
  if (localStorage.getItem(TABLES.USERS)) return;

  const users: User[] = [];
  const bootstrapPassword = import.meta.env.VITE_ADMIN_BOOTSTRAP_PASSWORD;
  if (typeof bootstrapPassword === 'string' && bootstrapPassword.length > 0) {
    const salt = generateId();
    users.push({
      id: generateId(),
      name: 'System Admin',
      email: import.meta.env.VITE_ADMIN_BOOTSTRAP_EMAIL || 'admin@chevvy.app',
      passwordHash: await hashPassword(bootstrapPassword, salt),
      salt,
      role: 'admin',
      spotifyConnected: false,
      createdAt: new Date().toISOString(),
    });
    logAudit('SYSTEM', 'ADMIN_BOOTSTRAP', 'Admin account created from operator-provided password.');
  }

  localStorage.setItem(TABLES.USERS, JSON.stringify(users));
  if (!localStorage.getItem(TABLES.TASKS)) localStorage.setItem(TABLES.TASKS, '[]');
  if (!localStorage.getItem(TABLES.NOTES)) localStorage.setItem(TABLES.NOTES, '[]');
}

// Audit logging helper
export function logAudit(userId: string, event: string, details: string) {
  const logs: AuditLog[] = JSON.parse(localStorage.getItem(TABLES.AUDIT_LOGS) || '[]');
  const log: AuditLog = {
    id: generateId(),
    userId,
    event,
    details,
    timestamp: new Date().toISOString(),
    device: navigator.userAgent.substring(0, 100),
  };
  logs.push(log);
  localStorage.setItem(TABLES.AUDIT_LOGS, JSON.stringify(logs.slice(-1000))); // Keep last 1000 logs
}

// Get Audit Logs (Admin only)
export function getAuditLogs(adminToken: string): AuditLog[] {
  const session = verifySession(adminToken);
  if (!session) throw new Error('Unauthorized');
  
  const users = JSON.parse(localStorage.getItem(TABLES.USERS) || '[]');
  const admin = users.find((u: User) => u.id === session.userId);
  if (!admin || admin.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  logAudit(admin.id, 'ADMIN_ACCESS', 'Viewed system audit logs');
  return JSON.parse(localStorage.getItem(TABLES.AUDIT_LOGS) || '[]');
}

// User registration
export async function registerUser(name: string, email: string, password: string): Promise<{ token: string; user: Omit<User, 'passwordHash' | 'salt'> }> {
  const users: User[] = JSON.parse(localStorage.getItem(TABLES.USERS) || '[]');
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already registered');
  }

  const salt = generateId();
  const hash = await hashPassword(password, salt);
  const newUser: User = {
    id: generateId(),
    name,
    email,
    passwordHash: hash,
    salt,
    role: 'user',
    spotifyConnected: false,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(TABLES.USERS, JSON.stringify(users));

  logAudit(newUser.id, 'AUTH_REGISTER', `New user registered with email: ${email}`);

  return loginUser(email, password);
}

// User login
export async function loginUser(email: string, password: string): Promise<{ token: string; user: Omit<User, 'passwordHash' | 'salt'> }> {
  const users: User[] = JSON.parse(localStorage.getItem(TABLES.USERS) || '[]');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const verification = await verifyPassword(password, user.passwordHash, user.salt);
  if (!verification.ok) {
    throw new Error('Invalid email or password');
  }
  // Transparently move legacy SHA-256 accounts to PBKDF2 on successful login.
  if (verification.upgrade) {
    users[users.indexOf(user)].passwordHash = verification.upgrade;
    localStorage.setItem(TABLES.USERS, JSON.stringify(users));
  }

  // Create a new session token
  const token = generateId();
  const sessions: UserSession[] = JSON.parse(localStorage.getItem(TABLES.SESSIONS) || '[]');
  
  const newSession: UserSession = {
    id: token,
    userId: user.id,
    device: navigator.userAgent.substring(0, 100),
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  sessions.push(newSession);
  localStorage.setItem(TABLES.SESSIONS, JSON.stringify(sessions));

  logAudit(user.id, 'AUTH_LOGIN', `Successful login from device: ${newSession.device}`);

  const { passwordHash, salt, ...safeUser } = user;
  return { token, user: safeUser };
}

// Verify active session token
export function verifySession(token: string): UserSession | null {
  if (!token) return null;
  const sessions: UserSession[] = JSON.parse(localStorage.getItem(TABLES.SESSIONS) || '[]');
  const sessionIndex = sessions.findIndex(s => s.id === token);
  if (sessionIndex === -1) return null;

  const session = sessions[sessionIndex];
  
  // Update last active
  session.lastActive = new Date().toISOString();
  sessions[sessionIndex] = session;
  localStorage.setItem(TABLES.SESSIONS, JSON.stringify(sessions));

  return session;
}

// Get user profile
export function getUserProfile(token: string): Omit<User, 'passwordHash' | 'salt'> {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const users: User[] = JSON.parse(localStorage.getItem(TABLES.USERS) || '[]');
  const user = users.find(u => u.id === session.userId);
  if (!user) throw new Error('User not found');

  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

// Connect Spotify profile mock
export function connectSpotify(token: string, spotifyUsername: string): Omit<User, 'passwordHash' | 'salt'> {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const users: User[] = JSON.parse(localStorage.getItem(TABLES.USERS) || '[]');
  const index = users.findIndex(u => u.id === session.userId);
  if (index === -1) throw new Error('User not found');

  users[index].spotifyConnected = true;
  users[index].spotifyUser = spotifyUsername;
  localStorage.setItem(TABLES.USERS, JSON.stringify(users));

  logAudit(session.userId, 'SPOTIFY_CONNECT', `Connected Spotify account: ${spotifyUsername}`);

  const { passwordHash, salt, ...safeUser } = users[index];
  return safeUser;
}

// Disconnect Spotify
export function disconnectSpotify(token: string): Omit<User, 'passwordHash' | 'salt'> {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const users: User[] = JSON.parse(localStorage.getItem(TABLES.USERS) || '[]');
  const index = users.findIndex(u => u.id === session.userId);
  if (index === -1) throw new Error('User not found');

  users[index].spotifyConnected = false;
  users[index].spotifyUser = undefined;
  localStorage.setItem(TABLES.USERS, JSON.stringify(users));

  logAudit(session.userId, 'SPOTIFY_DISCONNECT', 'Disconnected Spotify account');

  const { passwordHash, salt, ...safeUser } = users[index];
  return safeUser;
}

// Session management
export function getActiveSessions(token: string): UserSession[] {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const sessions: UserSession[] = JSON.parse(localStorage.getItem(TABLES.SESSIONS) || '[]');
  return sessions.filter(s => s.userId === session.userId);
}

export function revokeSession(token: string, sessionIdToRevoke: string) {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  let sessions: UserSession[] = JSON.parse(localStorage.getItem(TABLES.SESSIONS) || '[]');
  
  // Make sure they own the session or they are admin
  const targetSession = sessions.find(s => s.id === sessionIdToRevoke);
  if (!targetSession) return;

  if (targetSession.userId !== session.userId) {
    // Check if admin
    const users = JSON.parse(localStorage.getItem(TABLES.USERS) || '[]');
    const admin = users.find((u: User) => u.id === session.userId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Forbidden');
    }
  }

  sessions = sessions.filter(s => s.id !== sessionIdToRevoke);
  localStorage.setItem(TABLES.SESSIONS, JSON.stringify(sessions));

  logAudit(session.userId, 'SESSION_REVOKE', `Revoked session ID: ${sessionIdToRevoke}`);
}

// Logout
export function logoutUser(token: string) {
  const session = verifySession(token);
  if (session) {
    revokeSession(token, token);
    logAudit(session.userId, 'AUTH_LOGOUT', 'Logged out successfully');
  }
}

// --- Scheduler CRUD Operations ---

export function getTasks(token: string): Task[] {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const tasks: Task[] = JSON.parse(localStorage.getItem(TABLES.TASKS) || '[]');
  return tasks.filter(t => t.userId === session.userId);
}

export function createTask(token: string, taskData: Omit<Task, 'id' | 'userId' | 'snoozedCount'>): Task {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const tasks: Task[] = JSON.parse(localStorage.getItem(TABLES.TASKS) || '[]');
  
  // Enforce priority color selection constraint
  // "Tier 1: Important (User-selectable color). Tier 2: Normal (Different color). Tier 3: Low (Different color. No duplicate colors across priorities)"
  // We can let UI validate this, but we'll record task color.
  
  const newTask: Task = {
    ...taskData,
    id: generateId(),
    userId: session.userId,
    snoozedCount: 0,
  };

  tasks.push(newTask);
  localStorage.setItem(TABLES.TASKS, JSON.stringify(tasks));

  logAudit(session.userId, 'TASK_CREATE', `Created task: "${newTask.title}"`);
  return newTask;
}

export function updateTask(token: string, taskId: string, taskUpdates: Partial<Omit<Task, 'id' | 'userId'>>): Task {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const tasks: Task[] = JSON.parse(localStorage.getItem(TABLES.TASKS) || '[]');
  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) throw new Error('Task not found');

  // Verify ownership
  if (tasks[index].userId !== session.userId) throw new Error('Forbidden: Unauthorized data access');

  const prevCompleted = tasks[index].completed;

  tasks[index] = {
    ...tasks[index],
    ...taskUpdates,
  };

  // Set completed timestamp
  if (taskUpdates.completed !== undefined && taskUpdates.completed !== prevCompleted) {
    if (taskUpdates.completed) {
      tasks[index].completedAt = new Date().toISOString();
      logAudit(session.userId, 'TASK_COMPLETE', `Completed task: "${tasks[index].title}"`);
    } else {
      tasks[index].completedAt = undefined;
      logAudit(session.userId, 'TASK_UNCOMPLETE', `Uncompleted task: "${tasks[index].title}"`);
    }
  } else {
    logAudit(session.userId, 'TASK_UPDATE', `Updated task: "${tasks[index].title}"`);
  }

  localStorage.setItem(TABLES.TASKS, JSON.stringify(tasks));
  return tasks[index];
}

export function deleteTask(token: string, taskId: string) {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  let tasks: Task[] = JSON.parse(localStorage.getItem(TABLES.TASKS) || '[]');
  const task = tasks.find(t => t.id === taskId);
  if (!task) throw new Error('Task not found');

  if (task.userId !== session.userId) throw new Error('Forbidden: Unauthorized data access');

  tasks = tasks.filter(t => t.id !== taskId);
  localStorage.setItem(TABLES.TASKS, JSON.stringify(tasks));

  logAudit(session.userId, 'TASK_DELETE', `Deleted task: "${task.title}"`);
}

// --- Notes CRUD Operations ---

export function getNotes(token: string): Note[] {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const notes: Note[] = JSON.parse(localStorage.getItem(TABLES.NOTES) || '[]');
  return notes.filter(n => n.userId === session.userId);
}

export function createNote(token: string, noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Note {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const notes: Note[] = JSON.parse(localStorage.getItem(TABLES.NOTES) || '[]');
  const newNote: Note = {
    ...noteData,
    id: generateId(),
    userId: session.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.push(newNote);
  localStorage.setItem(TABLES.NOTES, JSON.stringify(notes));

  logAudit(session.userId, 'NOTE_CREATE', `Created note: "${newNote.title}"`);
  return newNote;
}

export function updateNote(token: string, noteId: string, noteUpdates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt'>>): Note {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  const notes: Note[] = JSON.parse(localStorage.getItem(TABLES.NOTES) || '[]');
  const index = notes.findIndex(n => n.id === noteId);
  if (index === -1) throw new Error('Note not found');

  if (notes[index].userId !== session.userId) throw new Error('Forbidden: Unauthorized data access');

  notes[index] = {
    ...notes[index],
    ...noteUpdates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(TABLES.NOTES, JSON.stringify(notes));
  logAudit(session.userId, 'NOTE_UPDATE', `Updated note: "${notes[index].title}"`);
  return notes[index];
}

export function deleteNote(token: string, noteId: string) {
  const session = verifySession(token);
  if (!session) throw new Error('Unauthorized');

  let notes: Note[] = JSON.parse(localStorage.getItem(TABLES.NOTES) || '[]');
  const note = notes.find(n => n.id === noteId);
  if (!note) throw new Error('Note not found');

  if (note.userId !== session.userId) throw new Error('Forbidden: Unauthorized data access');

  notes = notes.filter(n => n.id !== noteId);
  localStorage.setItem(TABLES.NOTES, JSON.stringify(notes));

  logAudit(session.userId, 'NOTE_DELETE', `Deleted note: "${note.title}"`);
}
