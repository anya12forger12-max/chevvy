import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Calendar,
  FileText,
  Music,
  Settings,
  Shield,
  LogOut,
  Trash2,
  Plus,
  Edit2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Search,
  Star,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Accessibility,
  X,
  Award
} from 'lucide-react';
import * as db from './services/db';
import { analyzeHabits } from './services/habit';
import type { ProductivityPattern, Recommendation } from './services/habit';
import { detectTasksFromNote } from './services/ai';
import type { AISuggestedTask } from './services/ai';

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('chevvy_token'));
  const [user, setUser] = useState<Omit<db.User, 'passwordHash' | 'salt'> | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Privacy Policy state
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'notes' | 'spotify' | 'settings' | 'admin'>('home');

  // UI lists
  const [tasks, setTasks] = useState<db.Task[]>([]);
  const [notes, setNotes] = useState<db.Note[]>([]);
  const [auditLogs, setAuditLogs] = useState<db.AuditLog[]>([]);
  const [sessions, setSessions] = useState<db.UserSession[]>([]);

  // Task creation/editing state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<db.Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<db.Task['priority']>('normal');
  const [taskColorType, setTaskColorType] = useState<db.Task['colorType']>('standard');
  const [taskColor, setTaskColor] = useState('#fb923c');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskRecurrence, setTaskRecurrence] = useState<db.Task['recurrence']>('none');
  const [taskHasAlarm, setTaskHasAlarm] = useState(true);
  const [taskAlarmMusic, setTaskAlarmMusic] = useState('Cherry Blossom Chillout');

  // Note creation/editing state
  const [selectedNote, setSelectedNote] = useState<db.Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteFolder, setNoteFolder] = useState('General');
  const [noteIsFavorite, setNoteIsFavorite] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const [noteSort, setNoteSort] = useState<'title' | 'created' | 'edited'>('edited');
  const [folders, setFolders] = useState<string[]>(['General', 'Work', 'Personal', 'Shopping']);

  // Voice Note Recording simulator
  const [isRecording, setIsRecording] = useState(false);
  const [recLanguage, setRecLanguage] = useState<'en' | 'te' | 'hi'>('en');
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [voiceText, setVoiceText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // AI Scheduling Suggestion
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestedTask[]>([]);
  const [aiSchedulingEnabled, setAiSchedulingEnabled] = useState(true);

  // Habit insights
  const [productivityPattern, setProductivityPattern] = useState<ProductivityPattern | null>(null);

  // Spotify simulated player state
  const [spotifyPlaying, setSpotifyPlaying] = useState(false);
  const [spotifyCurrentTrack, setSpotifyCurrentTrack] = useState('Cherry Blossom Chillout');
  const [spotifyCurrentArtist, setSpotifyCurrentArtist] = useState('The Sakuras');
  const [spotifyProgress, setSpotifyProgress] = useState(30);
  const [spotifyPlaylists] = useState([
    'Focus Flow 🎧',
    'Morning Energy ☀️',
    'Cherry Chill 🍒',
    'Acoustic Afternoons 🎸',
  ]);
  const [spotifySelectedPlaylist, setSpotifySelectedPlaylist] = useState('Cherry Chill 🍒');
  const [spotifyEnabled, setSpotifyEnabled] = useState(true);

  // Reminders & Alarm runtime
  const [activeAlarmTask, setActiveAlarmTask] = useState<db.Task | null>(null);
  const [showStartOfDayPlan, setShowStartOfDayPlan] = useState(false);
  const [showEndOfDayReview, setShowEndOfDayReview] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [localNotifications, setLocalNotifications] = useState<{ id: string; title: string; body: string }[]>([]);

  // Accessibility state
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');
  const [screenReaderSim, setScreenReaderSim] = useState(false);
  const [screenReaderText, setScreenReaderText] = useState('Screen Reader Ready. Hover elements for descriptions.');

  // Toast alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User preferences from Settings
  const [startOfDayTime, setStartOfDayTime] = useState('08:00');
  const [endOfDayTime, setEndOfDayTime] = useState('21:00');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'te' | 'hi'>('en');

  // Load database
  useEffect(() => {
    db.initDatabase();
    // Load profile if token exists
    if (token) {
      try {
        const profile = db.getUserProfile(token);
        setUser(profile);
        refreshData(token);
      } catch (err) {
        setToken(null);
        sessionStorage.removeItem('chevvy_token');
      }
    }
  }, [token]);

  // Sync data refresh
  const refreshData = (authToken: string) => {
    try {
      const taskList = db.getTasks(authToken);
      setTasks(taskList);
      const noteList = db.getNotes(authToken);
      setNotes(noteList);
      
      // Update habit analysis
      const habits = analyzeHabits(taskList);
      setProductivityPattern(habits);

      // Get active sessions
      const activeSessions = db.getActiveSessions(authToken);
      setSessions(activeSessions);

      // Admin loads logs
      const profile = db.getUserProfile(authToken);
      if (profile.role === 'admin') {
        const logs = db.getAuditLogs(authToken);
        setAuditLogs(logs);
      }
    } catch (err) {
      showToast('Data sync failed.');
    }
  };

  // Toast handler
  const showToast = (msg: string) => {
    setToastMessage(msg);
    announceToScreenReader(`Alert notification: ${msg}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Accessibility Announcement helper
  const announceToScreenReader = (text: string) => {
    setScreenReaderText(text);
  };

  // Track page theme updates
  useEffect(() => {
    const root = document.documentElement;
    // Apply visual mode flags
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply color blind correction
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (colorBlindMode !== 'none') {
      root.classList.add(colorBlindMode);
    }
  }, [highContrast, largeText, reducedMotion, colorBlindMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nowTime = new Date().getTime();
      
      tasks.forEach(task => {
        if (!task.completed) {
          const taskTime = new Date(task.dueDate).getTime();
          const diffMins = Math.round((taskTime - nowTime) / 60000);

          // Trigger Alarms at precise due time
          if (taskTime <= nowTime && taskTime > nowTime - 60000 && !activeAlarmTask) {
            // Trigger alarm
            if (task.hasAlarm) {
              setActiveAlarmTask(task);
              if (spotifyEnabled) {
                setSpotifyPlaying(true);
                setSpotifyCurrentTrack(task.alarmMusic || 'Cherry Blossom Chillout');
              }
            } else {
              triggerLocalNotification(task.title, 'Task schedule starts now.');
              // Auto mark complete or snooze
            }
          }

          // Trigger before-reminders
          if (task.reminderBefore) {
            task.reminderBefore.forEach(reminderMin => {
              // Trigger reminder check
              if (diffMins === reminderMin) {
                triggerLocalNotification(
                  `Reminder: ${task.title}`,
                  `Starts in ${reminderMin} minutes.`
                );
              }
            });
          }
        }
      });
    }, 15000); // Check every 15s

    return () => clearInterval(timer);
  }, [tasks, activeAlarmTask, spotifyEnabled]);

  // Simulate Spotify progress
  useEffect(() => {
    let progressTimer: number;
    if (spotifyPlaying) {
      progressTimer = setInterval(() => {
        setSpotifyProgress(p => (p >= 100 ? 0 : p + 1));
      }, 1000);
    }
    return () => clearInterval(progressTimer);
  }, [spotifyPlaying]);

  const triggerLocalNotification = (title: string, body: string) => {
    if (!notificationsEnabled) return;
    const newNotif = { id: db.generateId(), title, body };
    setLocalNotifications(prev => [newNotif, ...prev]);
    showToast(`${title}: ${body}`);
  };

  // Auth Operations
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyAccepted) {
      showToast('You must explicitly accept the Privacy Policy to proceed.');
      return;
    }
    try {
      const res = await db.registerUser(name, email, password);
      setToken(res.token);
      setUser(res.user);
      sessionStorage.setItem('chevvy_token', res.token);
      showToast(`Welcome to Chevvy, ${res.user.name}!`);
    } catch (err: any) {
      showToast(err.message || 'Registration failed');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await db.loginUser(email, password);
      setToken(res.token);
      setUser(res.user);
      sessionStorage.setItem('chevvy_token', res.token);
      showToast(`Welcome back, ${res.user.name}!`);
    } catch (err: any) {
      showToast(err.message || 'Login failed');
    }
  };

  // Mock Spotify OAuth Login Flow
  const handleSpotifyOAuth = () => {
    if (!privacyAccepted) {
      showToast('You must explicitly accept the Privacy Policy to proceed.');
      return;
    }
    announceToScreenReader('Launching Spotify Secure OAuth Flow');
    
    // Simulate interactive OAuth redirect window
    const width = 450, height = 550;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    const popup = window.open('', 'Spotify Login', `width=${width},height=${height},left=${left},top=${top}`);
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Authorize Chevvy via Spotify</title>
            <style>
              body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #121212; color: white; }
              .logo { font-size: 40px; margin-bottom: 20px; }
              .btn { background: #1db954; color: black; font-weight: bold; border: none; padding: 14px 28px; border-radius: 30px; font-size: 16px; cursor: pointer; }
              .details { margin: 20px 0; color: #b3b3b3; font-size: 13px; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="logo">🍒 ⇆ 🟢</div>
            <h2>Connect Spotify to Chevvy</h2>
            <p class="details">
              This will allow Chevvy to connect playlists, play wake-up alarm music, control Spotify player output, and verify your account.
            </p>
            <button class="btn" onclick="window.opener.postMessage('spotify_auth_success', '*'); window.close();">Agree & Authorize</button>
          </body>
        </html>
      `);
    }

    const receiveMessage = async (event: MessageEvent) => {
      if (event.data === 'spotify_auth_success') {
        window.removeEventListener('message', receiveMessage);
        
        // Log in or link profile
        try {
          const mockEmail = 'spotify_user@chevvy.app';
          const users = JSON.parse(localStorage.getItem('chevvy_users') || '[]');
          let existingUser = users.find((u: any) => u.email === mockEmail);
          
          if (!existingUser) {
            // Register spotify user
            const res = await db.registerUser('Spotify Explorer', mockEmail, 'spotify-oauth-pass');
            db.connectSpotify(res.token, 'spotify_explorer_99');
            setToken(res.token);
            setUser(db.getUserProfile(res.token));
            sessionStorage.setItem('chevvy_token', res.token);
          } else {
            // Login spotify user
            const res = await db.loginUser(mockEmail, 'spotify-oauth-pass');
            setToken(res.token);
            setUser(res.user);
            sessionStorage.setItem('chevvy_token', res.token);
          }
          showToast('Spotify OAuth Success!');
        } catch (err) {
          showToast('OAuth profile linking failed.');
        }
      }
    };
    window.addEventListener('message', receiveMessage);
  };

  const handleLogout = () => {
    if (token) {
      db.logoutUser(token);
      setToken(null);
      setUser(null);
      sessionStorage.removeItem('chevvy_token');
      showToast('Logged out securely.');
    }
  };

  // Schedule task logic
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Build reminders
    let reminderBefore: number[] = [];
    if (taskPriority === 'important') {
      reminderBefore = [60, 30]; // 1 hour, 30 mins
    } else if (taskPriority === 'normal') {
      reminderBefore = [10, 5]; // 10 mins, 5 mins
    } else {
      // low priority
      reminderBefore = [];
    }

    const taskData = {
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      color: taskColor,
      colorType: taskColorType,
      dueDate: new Date(taskDueDate).toISOString(),
      reminderBefore,
      hasAlarm: taskHasAlarm,
      alarmMusic: taskAlarmMusic,
      completed: false,
      recurrence: taskRecurrence,
    };

    try {
      if (editingTask) {
        db.updateTask(token, editingTask.id, taskData);
        showToast('Task updated successfully.');
      } else {
        db.createTask(token, taskData);
        showToast('Task created successfully.');
      }
      setShowTaskModal(false);
      setEditingTask(null);
      clearTaskForm();
      refreshData(token);
    } catch (err: any) {
      showToast(err.message || 'Could not save task.');
    }
  };

  const clearTaskForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('normal');
    setTaskColorType('standard');
    setTaskColor('#fb923c');
    setTaskDueDate('');
    setTaskRecurrence('none');
    setTaskHasAlarm(true);
    setTaskAlarmMusic('Cherry Blossom Chillout');
  };

  const openEditTask = (task: db.Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    setTaskPriority(task.priority);
    setTaskColorType(task.colorType);
    setTaskColor(task.color);
    // Format to datetime-local string
    const d = new Date(task.dueDate);
    const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setTaskDueDate(localISO);
    setTaskRecurrence(task.recurrence);
    setTaskHasAlarm(task.hasAlarm);
    setTaskAlarmMusic(task.alarmMusic || 'Cherry Blossom Chillout');
    setShowTaskModal(true);
  };

  const handleDeleteTask = (id: string) => {
    if (!token) return;
    try {
      db.deleteTask(token, id);
      showToast('Task deleted.');
      refreshData(token);
    } catch (err: any) {
      showToast('Failed to delete task.');
    }
  };

  const toggleTaskCompletion = (task: db.Task) => {
    if (!token) return;
    try {
      db.updateTask(token, task.id, { completed: !task.completed });
      refreshData(token);
    } catch (err: any) {
      showToast('Failed to toggle completion.');
    }
  };

  // Snooze active task from Scheduler / Alarm UI
  const handleSnoozeTask = (task: db.Task, minutes: number) => {
    if (!token) return;
    try {
      const newDueDate = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      db.updateTask(token, task.id, {
        dueDate: newDueDate,
        snoozedCount: task.snoozedCount + 1
      });
      setActiveAlarmTask(null);
      setSpotifyPlaying(false);
      showToast(`Task "${task.title}" snoozed for ${minutes} minutes.`);
      refreshData(token);
    } catch (err) {
      showToast('Snooze failed.');
    }
  };

  // Save Note logic
  const handleSaveNote = () => {
    if (!token) return;
    const noteData = {
      title: noteTitle || 'Untitled Note',
      content: noteContent,
      folder: noteFolder,
      isFavorite: noteIsFavorite,
    };

    try {
      if (selectedNote) {
        db.updateNote(token, selectedNote.id, noteData);
        showToast('Note saved.');
      } else {
        const newNote = db.createNote(token, noteData);
        setSelectedNote(newNote);
        showToast('Note created.');
      }
      refreshData(token);
    } catch (err) {
      showToast('Failed to save note.');
    }
  };

  const handleCreateNewNote = () => {
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteFolder('General');
    setNoteIsFavorite(false);
    setAiSuggestions([]);
    announceToScreenReader('Creating new empty note');
  };

  const handleDeleteNote = (id: string) => {
    if (!token) return;
    try {
      db.deleteNote(token, id);
      handleCreateNewNote();
      showToast('Note deleted.');
      refreshData(token);
    } catch (err) {
      showToast('Note delete failed.');
    }
  };

  // Voice Recording Visualizer Oscilloscope Simulation
  const startVoiceRecording = async () => {
    announceToScreenReader('Requesting Microphone permission for voice notes');
    // Simulate browser permission query
    setMicPermissionGranted(true);
    setIsRecording(true);
    setVoiceText('Listening for voice input...');
    
    // Animate Waveform on Canvas
    setTimeout(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frameCount = 0;
        const draw = () => {
          if (!ctx || !canvas) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          ctx.strokeStyle = '#ff4a7d';
          ctx.lineWidth = 3;
          ctx.beginPath();
          
          const midY = canvas.height / 2;
          const sliceWidth = canvas.width / 100;
          
          for (let i = 0; i < 100; i++) {
            const x = i * sliceWidth;
            // Draw undulating sine wave curves
            const frequency = 0.1;
            const amplitude = Math.sin(frameCount * 0.1) * 20 + 5;
            const y = midY + Math.sin(x * frequency + frameCount * 0.2) * amplitude;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          
          frameCount++;
          animationRef.current = requestAnimationFrame(draw);
        };
        draw();
      }
    }, 100);
  };

  const stopAndTranscribe = (presetPhrase?: string) => {
    setIsRecording(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    let resultText = '';
    
    if (presetPhrase) {
      resultText = presetPhrase;
    } else {
      // Language-based default transcripts
      if (recLanguage === 'te') {
        resultText = 'రేపు ఉదయం 10 గంటలకు మీటింగ్ కి వెళ్ళాలి';
      } else if (recLanguage === 'hi') {
        resultText = 'कल शाम 6 बजे डॉक्टर के पास जाना है';
      } else {
        resultText = 'Remind me to finish client task on next Monday at 9 AM';
      }
    }

    setVoiceText('');
    setNoteContent(prev => prev + `<div>${resultText}</div>`);
    showToast(`Transcribed: "${resultText}"`);

    // Run AI scanner to check for automatic scheduling
    if (aiSchedulingEnabled) {
      // Create temporary note object
      const tempNote: db.Note = {
        id: selectedNote?.id || 'temp',
        userId: user?.id || 'temp-user',
        title: noteTitle || 'Voice Note',
        content: resultText,
        folder: noteFolder,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const suggestions = detectTasksFromNote(tempNote);
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
        showToast('AI detected a task in note! Check proposal box.');
      }
    }
  };

  // Preset speech simulation clicks (extremely useful for test checks)
  const voiceDemoPhrases = {
    en: 'Need to submit project draft tomorrow by 5 pm',
    te: 'సాయంత్రం 5 గంటలకు రేపు మార్కెట్ కి వెళ్ళాలి',
    hi: 'कल सुबह 10 बजे मीटिंग अटेंड करना है'
  };

  // AI Suggestion acceptance
  const approveAISuggestion = (suggestion: AISuggestedTask) => {
    if (!token) return;
    try {
      db.createTask(token, {
        title: suggestion.title,
        description: `Auto-extracted from note: "${suggestion.noteTitle}"`,
        priority: suggestion.priority,
        color: suggestion.priority === 'important' ? '#f43f5e' : '#fb923c',
        colorType: 'standard',
        dueDate: suggestion.dueDate,
        reminderBefore: suggestion.priority === 'important' ? [60, 30] : [10, 5],
        hasAlarm: true,
        alarmMusic: 'Cherry Blossom Chillout',
        completed: false,
        recurrence: 'none'
      });
      // Clear accepted suggestion
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      showToast(`Scheduled: "${suggestion.title}"`);
      refreshData(token);
    } catch (err) {
      showToast('AI scheduling failed.');
    }
  };

  // Accept/Decline details for settings update or delete
  const handleDeleteAccount = () => {
    if (window.confirm('WARNING: This will permanently delete your account, notes, and task history. Proceed?')) {
      // Purge and logout
      const users = JSON.parse(localStorage.getItem('chevvy_users') || '[]');
      const filtered = users.filter((u: any) => u.id !== user?.id);
      localStorage.setItem('chevvy_users', JSON.stringify(filtered));
      
      // Clean up tasks/notes
      const tasksList = JSON.parse(localStorage.getItem('chevvy_tasks') || '[]');
      localStorage.setItem('chevvy_tasks', JSON.stringify(tasksList.filter((t: any) => t.userId !== user?.id)));
      
      const notesList = JSON.parse(localStorage.getItem('chevvy_notes') || '[]');
      localStorage.setItem('chevvy_notes', JSON.stringify(notesList.filter((n: any) => n.userId !== user?.id)));

      handleLogout();
      showToast('Account permanently deleted.');
    }
  };

  // Revoke session helper
  const handleRevokeSession = (sid: string) => {
    if (!token) return;
    try {
      db.revokeSession(token, sid);
      showToast('Session revoked.');
      refreshData(token);
    } catch (err) {
      showToast('Failed to revoke session.');
    }
  };

  // Habit Recommendation acceptance helper
  const acceptHabitRecommendation = (rec: Recommendation) => {
    if (!token || !rec.targetTaskId) return;
    try {
      // Get target task
      const target = tasks.find(t => t.id === rec.targetTaskId);
      if (target) {
        // Move task time to recommended focus hours
        const newD = new Date(target.dueDate);
        if (rec.suggestedTime) {
          const [h, m] = rec.suggestedTime.split(':');
          newD.setHours(parseInt(h), parseInt(m), 0, 0);
        }
        db.updateTask(token, target.id, { dueDate: newD.toISOString() });
        setProductivityPattern(prev => {
          if (!prev) return null;
          return {
            ...prev,
            recommendations: prev.recommendations.filter(r => r.id !== rec.id)
          };
        });
        showToast('Schedule optimized successfully!');
        refreshData(token);
      }
    } catch (err) {
      showToast('Optimizing failed.');
    }
  };

  // Color Mapping helpers for metallic/pastel priorities
  const getColorHex = (priority: db.Task['priority'], type: db.Task['colorType'], overrideColor?: string) => {
    if (priority === 'important') {
      if (type === 'pastel') return 'var(--color-important-pastel)';
      if (type === 'metallic') return 'var(--color-important-metallic)';
      return overrideColor || 'var(--color-important-std)';
    }
    if (priority === 'normal') {
      if (type === 'pastel') return 'var(--color-normal-pastel)';
      if (type === 'metallic') return 'var(--color-normal-metallic)';
      return overrideColor || 'var(--color-normal-std)';
    }
    // Low
    if (type === 'pastel') return 'var(--color-low-pastel)';
    if (type === 'metallic') return 'var(--color-low-metallic)';
    return overrideColor || 'var(--color-low-std)';
  };

  // Sorting notes helper
  const getSortedNotes = () => {
    const searchVal = noteSearch.toLowerCase();
    const filtered = notes.filter(n => 
      n.title.toLowerCase().includes(searchVal) || 
      n.content.toLowerCase().includes(searchVal)
    );

    return [...filtered].sort((a, b) => {
      if (noteSort === 'title') return a.title.localeCompare(b.title);
      if (noteSort === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  // Start of day planning generator
  const triggerStartOfDayPlanning = () => {
    setShowStartOfDayPlan(true);
    announceToScreenReader('Opening Start-of-Day Planning dashboard');
  };

  const triggerEndOfDayReview = () => {
    setShowEndOfDayReview(true);
    announceToScreenReader('Opening End-of-Day Review panel');
  };

  // Filter tasks for dashboard
  const upcomingTasks = tasks.filter(t => !t.completed && new Date(t.dueDate).getTime() > Date.now());
  const completedTodayCount = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="desktop-wrapper">
      {/* Accessibility screen reader log strip */}
      {screenReaderSim && (
        <div className="screen-reader-log" role="status" aria-live="polite">
          <Accessibility size={16} />
          <span>[Screen Reader Voice]: {screenReaderText}</span>
        </div>
      )}

      {/* SVG Filters for simulating color blindness types */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      <div className="device-frame">
        <div className="device-notch" />
        <div className="device-home-bar" />
        
        <div className="device-content">
          
          {/* Active Toast Alarm Banner */}
          {toastMessage && (
            <div className="toast-msg">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} style={{ background: 'transparent', border: 'none', color: '#ff4a7d', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* CRITICAL FEATURE: WAKE-UP ALARM OVERLAY SCREEN */}
          {activeAlarmTask && (
            <div className="alarm-overlay">
              <div className="alarm-icon-ring">
                <Music size={40} className="floating-cherry" />
              </div>
              <h2 style={{ fontSize: '28px', color: '#fcd34d', marginBottom: '8px' }}>Alarm Ringing 🍒</h2>
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>{activeAlarmTask.title}</p>
              
              {spotifyEnabled && (
                <div className="glass-card" style={{ width: '100%', marginBottom: '32px', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
                  <p style={{ fontSize: '12px', color: '#ff7597' }}>PLAYING WAKE-UP SONG FROM SPOTIFY</p>
                  <p style={{ fontWeight: 600 }}>{activeAlarmTask.alarmMusic || 'Cherry Blossom Chillout'}</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    toggleTaskCompletion(activeAlarmTask);
                    setActiveAlarmTask(null);
                    setSpotifyPlaying(false);
                  }}
                  onMouseEnter={() => announceToScreenReader('Mark task complete and stop alarm')}
                >
                  Dismiss & Mark Complete
                </button>
                
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleSnoozeTask(activeAlarmTask, 5)}
                    onMouseEnter={() => announceToScreenReader('Snooze alarm for 5 minutes')}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    Snooze 5m
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleSnoozeTask(activeAlarmTask, 15)}
                    onMouseEnter={() => announceToScreenReader('Snooze alarm for 15 minutes')}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    Snooze 15m
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN PAGE CONTAINER WITH STRICT ACCESS LOCK */}
          {!token ? (
            /* SECURE AUTH AND REGISTRATION SCREEN */
            <div className="screen-container" style={{ justifyContent: 'center', alignContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '64px' }} role="img" aria-label="Cherry Logo">🍒</span>
                <h1 style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: '32px' }}>Chevvy</h1>
                <p style={{ color: 'var(--text-secondary)' }}>AI Smart Scheduler & Alarm Assistant</p>
              </div>

              <div className="glass-card">
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-ui)', marginBottom: '16px' }}>
                  <button 
                    style={{ flex: 1, padding: 10, background: 'transparent', border: 'none', fontWeight: !isRegistering ? 'bold' : 'normal', color: !isRegistering ? 'var(--cherry-pink)' : 'var(--text-muted)', borderBottom: !isRegistering ? '2px solid var(--cherry-pink)' : 'none' }}
                    onClick={() => setIsRegistering(false)}
                    onMouseEnter={() => announceToScreenReader('Switch to Login')}
                  >
                    Login
                  </button>
                  <button 
                    style={{ flex: 1, padding: 10, background: 'transparent', border: 'none', fontWeight: isRegistering ? 'bold' : 'normal', color: isRegistering ? 'var(--cherry-pink)' : 'var(--text-muted)', borderBottom: isRegistering ? '2px solid var(--cherry-pink)' : 'none' }}
                    onClick={() => setIsRegistering(true)}
                    onMouseEnter={() => announceToScreenReader('Switch to Registration')}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {isRegistering && (
                    <div className="input-group">
                      <label className="input-label">Full Name</label>
                      <input className="input-field" type="text" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input className="input-field" type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>

                  {/* PRIVACY POLICY MANDATORY CONSENT CHECKBOX */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '8px 0', textAlign: 'left' }}>
                    <input 
                      type="checkbox" 
                      id="policyCheck" 
                      checked={privacyAccepted} 
                      onChange={e => setPrivacyAccepted(e.target.checked)} 
                      style={{ marginTop: 4, cursor: 'pointer' }}
                    />
                    <label htmlFor="policyCheck" style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      I explicitly accept the{' '}
                      <button 
                        type="button"
                        onClick={() => setShowPrivacyModal(true)} 
                        style={{ color: 'var(--cherry-pink)', background: 'transparent', border: 'none', textDecoration: 'underline', padding: 0, font: 'inherit', cursor: 'pointer' }}
                        onMouseEnter={() => announceToScreenReader('Read Chevvy legal privacy policy')}
                      >
                        Privacy Policy
                      </button>{' '}
                      before using Chevvy app services.
                    </label>
                  </div>

                  <button className="btn btn-primary" type="submit">
                    {isRegistering ? 'Create Secure Account' : 'Secure Login'}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-ui)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OR AUTHORIZE VIA</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-ui)' }} />
                </div>

                <button 
                  className="btn btn-secondary" 
                  onClick={handleSpotifyOAuth}
                  style={{ background: '#1db954', color: 'white', borderColor: '#1db954' }}
                  onMouseEnter={() => announceToScreenReader('Authenticate with Spotify OAuth')}
                >
                  <Music size={16} /> Continue with Spotify
                </button>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED PAGES VIEW */
            <>
              {/* App Top Branding Header */}
              <div className="app-header">
                <div className="branding">
                  <span className="branding-cherry" role="img" aria-label="cherry">🍒</span>
                  <span className="app-title">Chevvy</span>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  {user?.role === 'admin' && (
                    <button 
                      className={`btn-secondary`} 
                      style={{ padding: '6px 10px', borderRadius: '10px', fontSize: '11px', display: 'flex', gap: 4, alignItems: 'center', border: activeTab === 'admin' ? '1px solid var(--cherry-pink)' : '1px solid var(--border-card)' }}
                      onClick={() => setActiveTab(activeTab === 'admin' ? 'home' : 'admin')}
                      onMouseEnter={() => announceToScreenReader('Open Admin Dashboard console')}
                    >
                      <Shield size={12} /> Admin
                    </button>
                  )}
                  <button 
                    onClick={handleLogout} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onMouseEnter={() => announceToScreenReader('Securely logout of your session')}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>

              {/* DYNAMIC SCREEN SWITCHER */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                
                {/* 1. DASHBOARD SCREEN */}
                {activeTab === 'home' && (
                  <div className="screen-container">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <h1 style={{ textAlign: 'left' }}>Hi, {user?.name}! 🍒</h1>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'left' }}>Today is planning day. You completed {completedTodayCount} tasks.</p>
                    </div>

                    {/* Pre-planning buttons */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={triggerStartOfDayPlanning}
                        style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                        onMouseEnter={() => announceToScreenReader('Plan your day goals')}
                      >
                        ☀️ Start-of-Day Plan
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={triggerEndOfDayReview}
                        style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                        onMouseEnter={() => announceToScreenReader('Review pending checklist')}
                      >
                        🌙 End-of-Day Review
                      </button>
                    </div>

                    {/* Habit suggestions widget */}
                    {productivityPattern && productivityPattern.recommendations.length > 0 && (
                      <div className="glass-card" style={{ borderLeft: '4px solid var(--cherry-yellow)', background: 'linear-gradient(90deg, rgba(252,211,77,0.1) 0%, var(--bg-card) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Sparkles size={16} color="#d4af37" />
                          <h3 style={{ fontSize: '13px', fontWeight: 700 }}>AI Habit Schedule Recommendation</h3>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', marginBottom: 8 }}>
                          {productivityPattern.recommendations[0].description}
                        </p>
                        {productivityPattern.recommendations[0].targetTaskId && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '11px', width: 'auto' }}
                            onClick={() => acceptHabitRecommendation(productivityPattern.recommendations[0])}
                            onMouseEnter={() => announceToScreenReader('Apply optimization schedule suggested')}
                          >
                            Approve Schedule Shift
                          </button>
                        )}
                      </div>
                    )}

                    {/* Today priorities checklist */}
                    <div className="glass-card">
                      <h2 style={{ fontSize: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyItems: 'center', gap: 6, textAlign: 'left' }}>
                        <Award size={18} color="var(--cherry-pink)" /> Today's Priorities
                      </h2>
                      {upcomingTasks.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: 12 }}>No pending priorities. Create tasks below!</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {upcomingTasks.slice(0, 3).map(task => {
                            const activeCol = getColorHex(task.priority, task.colorType, task.color);
                            return (
                              <div 
                                key={task.id} 
                                className="flex-row-between" 
                                style={{ padding: 10, background: 'rgba(255,255,255,0.4)', borderRadius: 12, borderLeft: `5px solid ${activeCol}` }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                                  <button 
                                    onClick={() => toggleTaskCompletion(task)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                                    onMouseEnter={() => announceToScreenReader(`Complete task: ${task.title}`)}
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                  <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontWeight: 600, fontSize: '13px' }}>{task.title}</p>
                                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                      ⏰ {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | Recurrence: {task.recurrence}
                                    </p>
                                  </div>
                                </div>
                                <span className="badge" style={{ background: `${activeCol}20`, color: activeCol }}>
                                  {task.priority}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Spotify playing card */}
                    <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(29,185,84,0.15) 0%, var(--bg-card) 100%)' }}>
                      <div className="flex-row-between" style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1db954' }}>SPOTIFY CONNECTED</span>
                        <Music size={16} color="#1db954" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: '#191414', borderRadius: 8, display: 'flex', justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px' }}>🎵</span>
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ fontWeight: 600, fontSize: '13px' }}>{spotifyCurrentTrack}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{spotifyCurrentArtist}</p>
                        </div>
                        <button 
                          onClick={() => setSpotifyPlaying(!spotifyPlaying)} 
                          style={{ background: 'var(--cherry-pink)', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer' }}
                          onMouseEnter={() => announceToScreenReader('Play or pause Spotify track')}
                        >
                          {spotifyPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SMART SCHEDULER TAB */}
                {activeTab === 'schedule' && (
                  <div className="screen-container">
                    <div className="flex-row-between">
                      <h2>Smart Scheduler</h2>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => { clearTaskForm(); setEditingTask(null); setShowTaskModal(true); }}
                        style={{ width: 'auto', padding: '8px 12px', fontSize: '12px' }}
                        onMouseEnter={() => announceToScreenReader('Add new scheduler task')}
                      >
                        <Plus size={16} /> New Task
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
                      {tasks.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', padding: '40px 0' }}>No tasks found. Click "New Task" to create one!</p>
                      ) : (
                        tasks.map(task => {
                          const priorityCol = getColorHex(task.priority, task.colorType, task.color);
                          return (
                            <div 
                              key={task.id} 
                              className="glass-card" 
                              style={{ 
                                borderLeft: `6px solid ${priorityCol}`, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: 6,
                                opacity: task.completed ? 0.6 : 1
                              }}
                            >
                              <div className="flex-row-between">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                  <input 
                                    type="checkbox" 
                                    checked={task.completed} 
                                    onChange={() => toggleTaskCompletion(task)}
                                    style={{ cursor: 'pointer', width: 18, height: 18 }}
                                    onMouseEnter={() => announceToScreenReader(`Check completion of task: ${task.title}`)}
                                  />
                                  <span style={{ fontWeight: 700, textDecoration: task.completed ? 'line-through' : 'none', textAlign: 'left' }}>
                                    {task.title}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => openEditTask(task)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onMouseEnter={() => announceToScreenReader('Edit task details')}>
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--cherry-pink)', cursor: 'pointer' }} onMouseEnter={() => announceToScreenReader('Delete task')}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', paddingLeft: 26 }}>
                                {task.description}
                              </p>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 26, fontSize: '10px' }}>
                                <span className="badge" style={{ background: `${priorityCol}18`, color: priorityCol }}>
                                  {task.priority} ({task.colorType})
                                </span>
                                {task.hasAlarm && (
                                  <span className="badge" style={{ background: 'rgba(255, 74, 125, 0.1)', color: 'var(--cherry-pink)' }}>
                                    🎵 Alarm: {task.alarmMusic}
                                  </span>
                                )}
                                <span className="badge" style={{ background: 'rgba(94, 82, 102, 0.1)', color: 'var(--text-secondary)' }}>
                                  📅 {new Date(task.dueDate).toLocaleString()}
                                </span>
                                {task.recurrence !== 'none' && (
                                  <span className="badge" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>
                                    🔁 {task.recurrence}
                                  </span>
                                )}
                                {task.snoozedCount > 0 && (
                                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                    💤 Snoozed {task.snoozedCount}x
                                  </span>
                                )}
                              </div>

                              {!task.completed && (
                                <div style={{ display: 'flex', gap: 6, paddingLeft: 26, marginTop: 4 }}>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '4px 8px', fontSize: '10px', width: 'auto' }}
                                    onClick={() => handleSnoozeTask(task, 10)}
                                    onMouseEnter={() => announceToScreenReader('Snooze task 10 minutes')}
                                  >
                                    Snooze 10m
                                  </button>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '4px 8px', fontSize: '10px', width: 'auto' }}
                                    onClick={() => handleSnoozeTask(task, 30)}
                                    onMouseEnter={() => announceToScreenReader('Snooze task 30 minutes')}
                                  >
                                    Snooze 30m
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 3. RICH TEXT NOTES TAB */}
                {activeTab === 'notes' && (
                  <div className="screen-container" style={{ gap: 10 }}>
                    
                    {/* Search and Filters */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="flex-row-between">
                        <h2>Notes Panel</h2>
                        <button 
                          className="btn btn-primary" 
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
                          onClick={handleCreateNewNote}
                          onMouseEnter={() => announceToScreenReader('Create new note file')}
                        >
                          <Plus size={14} /> Add Note
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input 
                            className="input-field" 
                            style={{ width: '100%', paddingLeft: 34, paddingRight: 8, paddingItem: 8, fontSize: '12px' }}
                            placeholder="Search note tags/text..."
                            value={noteSearch}
                            onChange={e => setNoteSearch(e.target.value)}
                          />
                          <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                        </div>
                        <select 
                          className="input-field" 
                          style={{ width: 100, fontSize: '11px', padding: 6 }}
                          value={noteSort}
                          onChange={e => setNoteSort(e.target.value as any)}
                        >
                          <option value="edited">Sort: Edit</option>
                          <option value="created">Sort: Created</option>
                          <option value="title">Sort: Title</option>
                        </select>
                      </div>

                      {/* Notes Folder List horizontally */}
                      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
                        {folders.map(f => (
                          <button
                            key={f}
                            className={`badge`}
                            style={{
                              background: noteFolder === f ? 'var(--cherry-pink)' : 'var(--bg-card)',
                              color: noteFolder === f ? 'white' : 'var(--text-secondary)',
                              border: '1px solid var(--border-card)',
                              cursor: 'pointer'
                            }}
                            onClick={() => setNoteFolder(f)}
                          >
                            {f}
                          </button>
                        ))}
                        <button
                          className="badge"
                          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-ui)', color: 'var(--cherry-pink)', cursor: 'pointer' }}
                          onClick={() => {
                            const name = prompt('Enter new folder name:');
                            if (name) setFolders(prev => [...prev, name]);
                          }}
                        >
                          + Folder
                        </button>
                      </div>
                    </div>

                    {/* Notes Workspace split list & editor */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
                      
                      {!selectedNote && noteTitle === '' && noteContent === '' ? (
                        /* Notes listing */
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {getSortedNotes().length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', padding: 40 }}>No notes found.</p>
                          ) : (
                            getSortedNotes().map(note => (
                              <div 
                                key={note.id} 
                                className="glass-card" 
                                style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', cursor: 'pointer' }}
                                onClick={() => {
                                  setSelectedNote(note);
                                  setNoteTitle(note.title);
                                  setNoteContent(note.content);
                                  setNoteFolder(note.folder);
                                  setNoteIsFavorite(note.isFavorite);
                                  setAiSuggestions([]);
                                }}
                              >
                                <div className="flex-row-between">
                                  <h3 style={{ fontSize: '13px', fontWeight: 700 }}>{note.title}</h3>
                                  {note.isFavorite && <Star size={12} fill="var(--cherry-yellow)" color="var(--cherry-yellow)" />}
                                </div>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', height: '1.4em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dangerouslySetInnerHTML={{ __html: note.content }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: 4 }}>
                                  <span>📁 {note.folder}</span>
                                  <span>Edited: {new Date(note.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        /* Note editor workspace */
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ width: 'auto', padding: '6px 10px' }}
                              onClick={() => { setSelectedNote(null); handleCreateNewNote(); }}
                            >
                              Back
                            </button>
                            <input 
                              className="input-field" 
                              style={{ flex: 1, fontWeight: 'bold' }} 
                              placeholder="Note Title" 
                              value={noteTitle} 
                              onChange={e => setNoteTitle(e.target.value)}
                            />
                            <button 
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: noteIsFavorite ? 'var(--cherry-yellow)' : 'var(--text-muted)' }}
                              onClick={() => setNoteIsFavorite(!noteIsFavorite)}
                            >
                              <Star size={20} fill={noteIsFavorite ? 'var(--cherry-yellow)' : 'none'} />
                            </button>
                          </div>

                          {/* Simulated rich text styling tools toolbar */}
                          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 6, borderRadius: 8, border: '1px solid var(--border-card)' }}>
                            <button className="badge" style={{ cursor: 'pointer' }} onClick={() => setNoteContent(prev => prev + '<strong>BoldText</strong>')}><b>B</b></button>
                            <button className="badge" style={{ cursor: 'pointer' }} onClick={() => setNoteContent(prev => prev + '<em>ItalicText</em>')}><i>I</i></button>
                            <button className="badge" style={{ cursor: 'pointer' }} onClick={() => setNoteContent(prev => prev + '<u>UnderlineText</u>')}><u>U</u></button>
                            <button className="badge" style={{ cursor: 'pointer' }} onClick={() => setNoteContent(prev => prev + '<ul><li>List Item</li></ul>')}>• List</button>
                            
                            <div style={{ flex: 1 }} />
                            
                            <select 
                              className="badge" 
                              style={{ border: 'none', background: 'transparent', fontSize: '10px' }}
                              value={noteFolder}
                              onChange={e => setNoteFolder(e.target.value)}
                            >
                              {folders.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>

                          <textarea 
                            className="input-field" 
                            style={{ flex: 1, minHeight: 120, fontFamily: 'monospace', fontSize: '12px' }} 
                            placeholder="Write HTML or plain text notes..."
                            value={noteContent}
                            onChange={e => setNoteContent(e.target.value)}
                          />

                          {/* VOICE NOTE RECORDING FEATURE */}
                          <div className="glass-card" style={{ background: 'rgba(255, 74, 125, 0.05)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div className="flex-row-between">
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cherry-pink)', display: 'flex', gap: 4, alignItems: 'center' }}>
                                <Mic size={12} /> Voice-to-Text Recorder {micPermissionGranted !== null ? `(Mic: ${micPermissionGranted ? 'Granted' : 'Denied'})` : ''}
                              </span>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className={`badge`} style={{ fontSize: '9px', background: recLanguage === 'en' ? 'var(--cherry-pink)' : 'transparent', color: recLanguage === 'en' ? 'white' : 'var(--text-secondary)' }} onClick={() => setRecLanguage('en')}>EN</button>
                                <button className={`badge`} style={{ fontSize: '9px', background: recLanguage === 'te' ? 'var(--cherry-pink)' : 'transparent', color: recLanguage === 'te' ? 'white' : 'var(--text-secondary)' }} onClick={() => setRecLanguage('te')}>TE (తెలుగు)</button>
                                <button className={`badge`} style={{ fontSize: '9px', background: recLanguage === 'hi' ? 'var(--cherry-pink)' : 'transparent', color: recLanguage === 'hi' ? 'white' : 'var(--text-secondary)' }} onClick={() => setRecLanguage('hi')}>HI (हिंदी)</button>
                              </div>
                            </div>

                            {isRecording ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <canvas ref={canvasRef} className="waveform-canvas" width={300} height={60} />
                                <p style={{ fontSize: '10px', color: 'var(--cherry-pink)', fontStyle: 'italic' }}>
                                  Status: {voiceText || 'Recording active. Speak now...'}
                                </p>
                                
                                {/* Preset demo speech triggers */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Demo Preset Phrase (Click to speak):</span>
                                  <button 
                                    className="badge" 
                                    style={{ textAlign: 'left', padding: 4, background: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                                    onClick={() => stopAndTranscribe(voiceDemoPhrases[recLanguage])}
                                  >
                                    💬 "{voiceDemoPhrases[recLanguage]}"
                                  </button>
                                </div>

                                <button className="btn btn-danger" style={{ padding: 6, fontSize: '11px' }} onClick={() => stopAndTranscribe()}>
                                  Stop and Transcribe
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-secondary" 
                                style={{ display: 'flex', gap: 4, alignContent: 'center', justifyContent: 'center', fontSize: '11px', padding: 6 }} 
                                onClick={startVoiceRecording}
                                onMouseEnter={() => announceToScreenReader('Start voice recording session')}
                              >
                                <Mic size={12} /> Record Voice Note
                              </button>
                            )}
                          </div>

                          {/* AI DETECTION SCHEDULER WIDGET */}
                          {aiSuggestions.length > 0 && (
                            <div className="glass-card" style={{ border: '1px solid var(--cherry-pink)', background: 'linear-gradient(135deg, rgba(255,74,125,0.08) 0%, var(--bg-card) 100%)' }}>
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                                <Sparkles size={14} color="var(--cherry-pink)" />
                                <span style={{ fontSize: '11px', fontWeight: 700 }}>AI Task Scheduler Proposal</span>
                              </div>
                              {aiSuggestions.map(s => (
                                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', background: 'rgba(255,255,255,0.4)', padding: 8, borderRadius: 10, fontSize: '11px' }}>
                                  <p><strong>Task:</strong> {s.title}</p>
                                  <p><strong>Proposed Date:</strong> {new Date(s.dueDate).toLocaleString()}</p>
                                  <p style={{ fontStyle: 'italic', fontSize: '10px', color: 'var(--text-secondary)' }}>Phrase: "{s.rawText}"</p>
                                  
                                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                    <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '10px', width: 'auto' }} onClick={() => approveAISuggestion(s)}>
                                      Approve & Schedule
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', width: 'auto' }} onClick={() => setAiSuggestions(prev => prev.filter(x => x.id !== s.id))}>
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveNote}>
                              Save Note
                            </button>
                            {selectedNote && (
                              <button className="btn btn-danger" style={{ width: 'auto', padding: 12 }} onClick={() => handleDeleteNote(selectedNote.id)}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. SPOTIFY CONNECTION TAB */}
                {activeTab === 'spotify' && (
                  <div className="screen-container">
                    <h2>Spotify Integration</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage connected playlists and wake-up alarm song preferences.</p>

                    {/* Spotify OAuth state */}
                    {user?.spotifyConnected ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="glass-card" style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(135deg, rgba(29,185,84,0.2) 0%, var(--bg-card) 100%)' }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1db954', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
                            SG
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <p style={{ fontWeight: 700 }}>Spotify User Connected</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: {user.spotifyUser}</p>
                          </div>
                          <button 
                            className="btn btn-secondary" 
                            style={{ width: 'auto', padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => {
                              if (token) {
                                const profile = db.disconnectSpotify(token);
                                setUser(profile);
                                showToast('Spotify profile disconnected.');
                              }
                            }}
                          >
                            Disconnect
                          </button>
                        </div>

                        {/* Connected playlists */}
                        <div className="glass-card" style={{ textAlign: 'left' }}>
                          <h3 style={{ fontSize: '13px', marginBottom: 8 }}>Linked Playlists</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {spotifyPlaylists.map(pl => (
                              <div 
                                key={pl} 
                                className="flex-row-between" 
                                style={{ 
                                  padding: 8, 
                                  background: spotifySelectedPlaylist === pl ? 'rgba(29,185,84,0.1)' : 'rgba(255,255,255,0.4)', 
                                  borderRadius: 8,
                                  border: spotifySelectedPlaylist === pl ? '1px solid #1db954' : '1px solid transparent'
                                }}
                              >
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{pl}</span>
                                <button 
                                  className="badge" 
                                  style={{ background: spotifySelectedPlaylist === pl ? '#1db954' : 'var(--bg-card)', color: spotifySelectedPlaylist === pl ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
                                  onClick={() => setSpotifySelectedPlaylist(pl)}
                                >
                                  {spotifySelectedPlaylist === pl ? 'Selected' : 'Connect'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Player UI */}
                        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div className="flex-row-between">
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Spotify Player Output</span>
                            <Music size={14} color="#1db954" />
                          </div>
                          
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div style={{ width: 40, height: 40, background: '#191414', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <span>🎵</span>
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <p style={{ fontWeight: 600, fontSize: '12px' }}>{spotifyCurrentTrack}</p>
                              <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{spotifyCurrentArtist}</p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ height: 4, width: '100%', background: 'var(--border-ui)', borderRadius: 2, position: 'relative' }}>
                              <div style={{ height: '100%', width: `${spotifyProgress}%`, background: '#1db954', borderRadius: 2 }} />
                            </div>
                            <div className="flex-row-between" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                              <span>1:12</span>
                              <span>3:40</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center' }}>
                            <button 
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                              onClick={() => { setSpotifyCurrentTrack('High Energy Focus'); setSpotifyCurrentArtist('The Bards'); }}
                            >
                              <SkipBack size={18} />
                            </button>
                            <button 
                              style={{ width: 40, height: 40, borderRadius: '50%', background: '#1db954', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer' }}
                              onClick={() => setSpotifyPlaying(!spotifyPlaying)}
                            >
                              {spotifyPlaying ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <button 
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                              onClick={() => { setSpotifyCurrentTrack('Cherry Blossom Chillout'); setSpotifyCurrentArtist('The Sakuras'); }}
                            >
                              <SkipForward size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-card" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                        <AlertTriangle size={32} color="var(--cherry-yellow)" />
                        <h3 style={{ fontSize: '14px' }}>Spotify Account Not Linked</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Connect Spotify to select custom wake-up tracks and use playback controls directly inside Chevvy scheduler.</p>
                        <button className="btn btn-primary" onClick={handleSpotifyOAuth}>
                          Link Spotify via OAuth
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. APP SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <div className="screen-container">
                    <h2>Preferences</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
                      
                      {/* Day planning configs */}
                      <div className="glass-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <h3 style={{ fontSize: '13px' }}>Day Planning Ranges</h3>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label">Start of Day</label>
                            <input className="input-field" type="time" value={startOfDayTime} onChange={e => setStartOfDayTime(e.target.value)} />
                          </div>
                          <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label">End of Day</label>
                            <input className="input-field" type="time" value={endOfDayTime} onChange={e => setEndOfDayTime(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Security active sessions list */}
                      <div className="glass-card" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '13px', marginBottom: 8 }}>Secure Sessions</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 8 }}>Review other active logins on your profile.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {sessions.map(s => (
                            <div key={s.id} className="flex-row-between" style={{ background: 'rgba(255,255,255,0.4)', padding: 6, borderRadius: 8, fontSize: '10px' }}>
                              <div style={{ flex: 1, marginRight: 6 }}>
                                <p style={{ fontWeight: 600 }}>{s.device}</p>
                                <p style={{ color: 'var(--text-muted)' }}>Created: {new Date(s.createdAt).toLocaleDateString()}</p>
                              </div>
                              {s.id === token ? (
                                <span className="badge" style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--color-low-std)' }}>Current</span>
                              ) : (
                                <button 
                                  className="badge" 
                                  style={{ background: 'var(--bg-card)', color: 'var(--cherry-pink)', border: 'none', cursor: 'pointer' }}
                                  onClick={() => handleRevokeSession(s.id)}
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notification and Voice configurations */}
                      <div className="glass-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <h3 style={{ fontSize: '13px' }}>Feature Toggles</h3>
                        <label style={{ display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={notificationsEnabled} onChange={e => setNotificationsEnabled(e.target.checked)} />
                          Enable Local Alarms and Push Alerts
                        </label>
                        <label style={{ display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={aiSchedulingEnabled} onChange={e => setAiSchedulingEnabled(e.target.checked)} />
                          Enable Note AI Extraction Parser
                        </label>
                        <label style={{ display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={spotifyEnabled} onChange={e => setSpotifyEnabled(e.target.checked)} />
                          Enable Spotify Wakeup Music Integration
                        </label>
                      </div>

                      {/* WCAG Accessibility configurations */}
                      <div className="glass-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <h3 style={{ fontSize: '13px', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <Accessibility size={16} /> WCAG Accessibility Settings
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={highContrast} onChange={e => setHighContrast(e.target.checked)} />
                            High Contrast View Mode
                          </label>
                          <label style={{ display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={largeText} onChange={e => setLargeText(e.target.checked)} />
                            Large Font Sizing Mode
                          </label>
                          <label style={{ display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} />
                            Reduced Motion Mode
                          </label>
                          <label style={{ display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={screenReaderSim} onChange={e => setScreenReaderSim(e.target.checked)} />
                            Interactive Screen Reader Voice Log
                          </label>

                          <div className="input-group">
                            <label className="input-label">Color-blind Mode Correction</label>
                            <select 
                              className="input-field" 
                              style={{ fontSize: '12px', padding: 8 }}
                              value={colorBlindMode} 
                              onChange={e => setColorBlindMode(e.target.value as any)}
                            >
                              <option value="none">None (Standard)</option>
                              <option value="protanopia">Protanopia (Red-blind)</option>
                              <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                              <option value="tritanopia">Tritanopia (Blue-blind)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Dangerous zone account delete */}
                      <button className="btn btn-danger" style={{ marginTop: 8 }} onClick={handleDeleteAccount}>
                        Permanently Delete Account
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. ADMIN SYSTEM DASHBOARD (IF LOGGED IN AS ADMIN) */}
                {activeTab === 'admin' && (
                  <div className="screen-container" style={{ padding: 12 }}>
                    <h2>Admin Terminal Console</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Security Audit Trail & Admin Log Registry</p>

                    <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
                      <div style={{ overflowY: 'auto', flex: 1, background: '#0e0b11', color: '#10b981', padding: 10, borderRadius: 12, fontFamily: 'monospace', fontSize: '9px', textAlign: 'left' }}>
                        {auditLogs.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)' }}>No audit events logged.</p>
                        ) : (
                          auditLogs.map(log => (
                            <div key={log.id} style={{ marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 4 }}>
                              <p style={{ color: '#ec4899' }}>[{new Date(log.timestamp).toLocaleTimeString()}] EVENT: {log.event}</p>
                              <p>User: {log.userId || 'GUEST'} | Device: {log.device}</p>
                              <p style={{ color: '#f59e0b' }}>Details: {log.details}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '11px', padding: 6 }} 
                        onClick={() => {
                          if (token) {
                            const logs = db.getAuditLogs(token);
                            setAuditLogs(logs);
                            showToast('Audit log updated.');
                          }
                        }}
                      >
                        Reload Console Logs
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Sticky Tab Navigation */}
              <div className="bottom-nav">
                <button 
                  className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('home'); setAiSuggestions([]); }}
                  onMouseEnter={() => announceToScreenReader('Go to Dashboard Home tab')}
                >
                  <Home size={18} />
                  <span>Home</span>
                </button>
                
                <button 
                  className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('schedule'); setAiSuggestions([]); }}
                  onMouseEnter={() => announceToScreenReader('Go to Tasks Calendar tab')}
                >
                  <Calendar size={18} />
                  <span>Schedule</span>
                </button>

                <button 
                  className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('notes'); }}
                  onMouseEnter={() => announceToScreenReader('Go to Notepad Editor tab')}
                >
                  <FileText size={18} />
                  <span>Notes</span>
                </button>

                <button 
                  className={`nav-item ${activeTab === 'spotify' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('spotify'); setAiSuggestions([]); }}
                  onMouseEnter={() => announceToScreenReader('Go to Spotify Playback tab')}
                >
                  <Music size={18} />
                  <span>Spotify</span>
                </button>

                <button 
                  className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('settings'); setAiSuggestions([]); }}
                  onMouseEnter={() => announceToScreenReader('Go to Preferences Settings tab')}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
              </div>
            </>
          )}

          {/* DYNAMIC SCREEN MODAL OVERLAYS */}

          {/* A. Task Add/Edit Sheet */}
          {showTaskModal && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
              <div className="glass-card" style={{ width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '90%', overflowY: 'auto' }}>
                <div className="flex-row-between">
                  <h3>{editingTask ? 'Edit Schedule Item' : 'Create Schedule Item'}</h3>
                  <button onClick={() => { setShowTaskModal(false); setEditingTask(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                  <div className="input-group">
                    <label className="input-label">Task Title</label>
                    <input className="input-field" type="text" placeholder="e.g. Code Review session" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea className="input-field" placeholder="Notes or instructions..." value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Priority Level</label>
                      <select className="input-field" style={{ padding: 8 }} value={taskPriority} onChange={e => setTaskPriority(e.target.value as any)}>
                        <option value="important">Tier 1: Important</option>
                        <option value="normal">Tier 2: Normal</option>
                        <option value="low">Tier 3: Low Priority</option>
                      </select>
                    </div>

                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Color Style</label>
                      <select className="input-field" style={{ padding: 8 }} value={taskColorType} onChange={e => setTaskColorType(e.target.value as any)}>
                        <option value="standard">Standard Tone</option>
                        <option value="pastel">Pastel Tone</option>
                        <option value="metallic">Metallic Tone</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Task Color (Custom for Tier 1)</label>
                    <input 
                      type="color" 
                      className="input-field" 
                      style={{ height: 40, padding: 2, cursor: 'pointer' }} 
                      value={taskColor} 
                      onChange={e => setTaskColor(e.target.value)} 
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Due Date & Time</label>
                    <input className="input-field" type="datetime-local" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} required />
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Recurrence Pattern</label>
                      <select className="input-field" style={{ padding: 8 }} value={taskRecurrence} onChange={e => setTaskRecurrence(e.target.value as any)}>
                        <option value="none">One-time</option>
                        <option value="daily">Daily Reminder</option>
                        <option value="weekly">Weekly Reminder</option>
                        <option value="monthly">Monthly Reminder</option>
                        <option value="yearly">Yearly Reminder</option>
                      </select>
                    </div>

                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Spotify Wakeup Alarm</label>
                      <select className="input-field" style={{ padding: 8 }} value={taskAlarmMusic} onChange={e => setTaskAlarmMusic(e.target.value)} disabled={!taskHasAlarm}>
                        <option value="Cherry Blossom Chillout">Cherry Blossom Chillout 🍒</option>
                        <option value="High Energy Focus">High Energy Focus ⚡</option>
                        <option value="Ambient Raindrops">Ambient Raindrops 🌧️</option>
                      </select>
                    </div>
                  </div>

                  <label style={{ display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={taskHasAlarm} onChange={e => setTaskHasAlarm(e.target.checked)} />
                    Trigger Loud Sound Alarm at Task Time
                  </label>

                  <button className="btn btn-primary" type="submit">
                    {editingTask ? 'Update Schedule Item' : 'Add to Schedule'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* B. Start-of-Day Planning Modal */}
          {showStartOfDayPlan && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div className="glass-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                <div className="flex-row-between">
                  <h3 style={{ display: 'flex', gap: 4, alignItems: 'center' }}>☀️ Start-of-Day Setup</h3>
                  <button onClick={() => setShowStartOfDayPlan(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
                
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Welcome to your planning summary. Here are your main goals for today:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {tasks.filter(t => !t.completed).map(t => {
                    const priorityCol = getColorHex(t.priority, t.colorType, t.color);
                    return (
                      <div key={t.id} style={{ display: 'flex', gap: 8, padding: 8, background: 'rgba(255,255,255,0.4)', borderRadius: 10, borderLeft: `4px solid ${priorityCol}` }}>
                        <span className="badge" style={{ background: `${priorityCol}20`, color: priorityCol, alignSelf: 'center' }}>{t.priority}</span>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '12px' }}>{t.title}</p>
                          <p style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Due: {new Date(t.dueDate).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    );
                  })}
                  {tasks.filter(t => !t.completed).length === 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>No tasks found today. Create task lists first!</p>
                  )}
                </div>

                <button className="btn btn-primary" onClick={() => setShowStartOfDayPlan(false)}>
                  Begin Focused Day
                </button>
              </div>
            </div>
          )}

          {/* C. End-of-Day Review Modal */}
          {showEndOfDayReview && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div className="glass-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                <div className="flex-row-between">
                  <h3 style={{ display: 'flex', gap: 4, alignItems: 'center' }}>🌙 End-of-Day Review</h3>
                  <button onClick={() => setShowEndOfDayReview(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
                
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>You have unfinished tasks left. What would you like to do with them?</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {tasks.filter(t => !t.completed).map(t => {
                    const priorityCol = getColorHex(t.priority, t.colorType, t.color);
                    return (
                      <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, background: 'rgba(255,255,255,0.4)', borderRadius: 10, borderLeft: `4px solid ${priorityCol}` }}>
                        <p style={{ fontWeight: 600, fontSize: '12px' }}>{t.title}</p>
                        
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 6px', fontSize: '9px', width: 'auto' }}
                            onClick={() => { toggleTaskCompletion(t); showToast('Task marked complete.'); }}
                          >
                            Mark Done
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 6px', fontSize: '9px', width: 'auto' }}
                            onClick={() => handleSnoozeTask(t, 60 * 12)} // Postpone 12 hours (tomorrow morning)
                          >
                            Snooze Tomorrow
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 6px', fontSize: '9px', width: 'auto' }}
                            onClick={() => openEditTask(t)}
                          >
                            Reschedule
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {tasks.filter(t => !t.completed).length === 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Hooray! All of today's tasks completed! 🎉</p>
                  )}
                </div>

                <button className="btn btn-primary" onClick={() => setShowEndOfDayReview(false)}>
                  Close Review Panel
                </button>
              </div>
            </div>
          )}

          {/* D. Privacy Policy Scrolling Overlay during Signup */}
          {showPrivacyModal && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div className="glass-card" style={{ width: '100%', height: '80%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                <div className="flex-row-between">
                  <h3 style={{ fontWeight: 'bold' }}>Privacy Policy Consent</h3>
                  <button onClick={() => setShowPrivacyModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, borderBottom: '1px solid var(--border-ui)' }}>
                  <p><strong>Effective Date: June 22, 2026</strong></p>
                  <p style={{ margin: '8px 0' }}>Welcome to Chevvy, an AI-powered smart scheduler, productivity planner, note-taking application, reminder system, and Spotify-integrated alarm assistant.</p>
                  
                  <h4 style={{ fontSize: '11px', margin: '8px 0 4px', color: 'var(--text-primary)' }}>1. INFORMATION WE COLLECT</h4>
                  <ul>
                    <li>Account information: Secure hashed password (bcrypt representation) and email profile.</li>
                    <li>Spotify connection: Access/refresh tokens for alarms, play playback music, and playlist metadata linked via Spotify OAuth.</li>
                    <li>Productivity schedules: Task items, due times, completion rates, and snooze counters analyzed for learning focus habits.</li>
                    <li>Voice notes: Microphone capture access to run speech transcription in English, Telugu, and Hindi. Audio is processed immediately and not saved persistently unless saved manually.</li>
                    <li>Device settings and configurations.</li>
                  </ul>

                  <h4 style={{ fontSize: '11px', margin: '8px 0 4px', color: 'var(--text-primary)' }}>2. SPECIAL ADMINISTRATIVE DATA ACCESS</h4>
                  <p>Administrators may access stored user data (including tasks, notes, profile details, and usage logs) for support maintenance, legal compliance, abuse prevention, and platform security checks.</p>

                  <h4 style={{ fontSize: '11px', margin: '8px 0 4px', color: 'var(--text-primary)' }}>3. CONTENT OWNERSHIP & PRIVACY</h4>
                  <p>Users retain full ownership of notes and schedules. We secure connection paths via HTTPS and encrypt databases. Sessions expire after inactivity and can be manually terminated.</p>

                  <h4 style={{ fontSize: '11px', margin: '8px 0 4px', color: 'var(--text-primary)' }}>4. LIMITATION OF LIABILITY</h4>
                  <p>Chevvy and its developers are not liable for direct or indirect losses, Spotify API interruptions, or data outages.</p>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => { setPrivacyAccepted(true); setShowPrivacyModal(false); }}
                  >
                    Accept Policy
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { setPrivacyAccepted(false); setShowPrivacyModal(false); }}
                  >
                    Decline & Deny Access
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
