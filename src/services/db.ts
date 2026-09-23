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

// Generate a random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper to hash password using SHA-256 via WebCrypto API
export async function hashPassword(password: string, salt: string): Promise<string> {
  if (!crypto?.subtle) {
    throw new Error('This browser does not support WebCrypto (secure context required, e.g. HTTPS or localhost).');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

// Seed default users if empty (includes an admin)
export async function initDatabase() {
  if (!localStorage.getItem(TABLES.USERS)) {
    const salt1 = generateId();
    const hash1 = await hashPassword('admin123', salt1);
    const adminUser: User = {
      id: 'admin-user',
      name: 'System Admin',
      email: 'admin@chevvy.app',
      passwordHash: hash1,
      salt: salt1,
      role: 'admin',
      spotifyConnected: false,
      createdAt: new Date().toISOString(),
    };

    const salt2 = generateId();
    const hash2 = await hashPassword('password123', salt2);
    const regularUser: User = {
      id: 'demo-user',
      name: 'Jane Doe',
      email: 'jane@example.com',
      passwordHash: hash2,
      salt: salt2,
      role: 'user',
      spotifyConnected: true,
      spotifyUser: 'spotify_jane_doe',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(TABLES.USERS, JSON.stringify([adminUser, regularUser]));
    logAudit('SYSTEM', 'Database initialized', 'Database seeded with default admin and user profiles.');

    // Seed mock tasks for Jane
    const janeTasks: Task[] = [
      {
        id: 'task-1',
        userId: 'demo-user',
        title: 'Morning Yoga and Meditation',
        description: 'Focus on breathing exercises.',
        priority: 'normal',
        color: '#ffc0cb',
        colorType: 'pastel',
        dueDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins from now
        reminderBefore: [10, 5],
        hasAlarm: true,
        alarmMusic: 'Cherry Blossom Chillout',
        completed: false,
        snoozedCount: 0,
        recurrence: 'daily',
      },
      {
        id: 'task-2',
        userId: 'demo-user',
        title: 'Project Presentation Draft',
        description: 'Prepare the summary slides for the team.',
        priority: 'important',
        color: '#ffdf00',
        colorType: 'standard',
        dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        reminderBefore: [60, 30],
        hasAlarm: true,
        alarmMusic: 'High Energy Beat',
        completed: false,
        snoozedCount: 0,
        recurrence: 'none',
      },
      {
        id: 'task-3',
        userId: 'demo-user',
        title: 'Read AI Research Notes',
        description: 'Review transcription updates.',
        priority: 'low',
        color: '#d4af37',
        colorType: 'metallic',
        dueDate: new Date(Date.now() + 180 * 60 * 1000).toISOString(), // 3 hours from now
        reminderBefore: [],
        hasAlarm: false,
        completed: false,
        snoozedCount: 0,
        recurrence: 'none',
      }
    ];
    localStorage.setItem(TABLES.TASKS, JSON.stringify(janeTasks));

    // Seed mock notes for Jane
    const janeNotes: Note[] = [
      {
        id: 'note-1',
        userId: 'demo-user',
        title: 'Weekly Grocery List',
        content: '<div><strong>Organic Items:</strong></div><ul><li>Fresh Cherries 🍒</li><li>Organic Lemon Honey 🍋</li><li>Almond Milk</li></ul>',
        folder: 'Shopping',
        isFavorite: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'note-2',
        userId: 'demo-user',
        title: 'Product Design Ideas',
        content: '<div>Ideas for Chevvy interface styling:</div><ul><li>Use high contrast modes and beautiful custom HSL colors.</li><li>Add smooth micro-animations.</li><li>Ensure keyboard navigation support is fully implemented.</li></ul>',
        folder: 'Work',
        isFavorite: false,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(TABLES.NOTES, JSON.stringify(janeNotes));
  }
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

  const computedHash = await hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    throw new Error('Invalid email or password');
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
