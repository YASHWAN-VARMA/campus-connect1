import { User, Session, Post, Alert, AttendanceData, TutorSession, Lecture } from '../types';

const KEYS = {
  USERS: 'CC_USERS_ROLEPASS',
  SESSION: 'CC_SESSION_ROLEPASS',
  ANNOUNCEMENTS: 'CC_ANNOUNCEMENTS_PROTO',
  DISCUSSION: 'CC_DISCUSSION_PROTO',
  LOSTFOUND: 'CC_LOSTFOUND_PROTO',
  TUTOR: 'CC_TUTOR_PROTO', // Legacy single messages
  TUTOR_SESSIONS: 'CC_TUTOR_SESSIONS_V1', // New chat sessions
  ATTENDANCE: 'CC_ATTENDANCE_PROTO',
  ALERTS: 'CC_GLOBAL_ALERTS',
  LECTURES: 'CC_LECTURES_PROTO',
};

// Generic helper
function load<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function save(key: string, val: any) {
  localStorage.setItem(key, JSON.stringify(val));
}

// User & Session
export const loadUsers = () => load<Record<string, User>>(KEYS.USERS, {});
export const saveUsers = (users: Record<string, User>) => save(KEYS.USERS, users);

export const getSession = () => load<Session | null>(KEYS.SESSION, null);
export const setSession = (s: Session | null) => {
  if (s) save(KEYS.SESSION, s);
  else localStorage.removeItem(KEYS.SESSION);
};

// Content
export const getAnnouncements = () => load<Post[]>(KEYS.ANNOUNCEMENTS, []);
export const saveAnnouncements = (data: Post[]) => save(KEYS.ANNOUNCEMENTS, data);
export const deleteAnnouncement = (id: string) => {
  const list = getAnnouncements();
  saveAnnouncements(list.filter(p => p.id !== id));
};

export const getDiscussions = () => load<Record<string, Post[]>>(KEYS.DISCUSSION, {});
export const saveDiscussions = (data: Record<string, Post[]>) => save(KEYS.DISCUSSION, data);

export const getLostFound = () => load<Post[]>(KEYS.LOSTFOUND, []);
export const saveLostFound = (data: Post[]) => save(KEYS.LOSTFOUND, data);

export const getTutorMsgs = () => load<Post[]>(KEYS.TUTOR, []);
export const saveTutorMsgs = (data: Post[]) => save(KEYS.TUTOR, data);

// New Chat Sessions
export const getTutorSessions = () => load<TutorSession[]>(KEYS.TUTOR_SESSIONS, []);
export const saveTutorSessions = (data: TutorSession[]) => save(KEYS.TUTOR_SESSIONS, data);

export const getAttendance = () => load<AttendanceData>(KEYS.ATTENDANCE, {});
export const saveAttendance = (data: AttendanceData) => save(KEYS.ATTENDANCE, data);

export const getAlerts = () => load<Alert[]>(KEYS.ALERTS, []);
export const saveAlerts = (data: Alert[]) => save(KEYS.ALERTS, data);

// Lectures
export const getLectures = () => load<Lecture[]>(KEYS.LECTURES, []);
export const saveLectures = (data: Lecture[]) => save(KEYS.LECTURES, data);

// Seeding
export const seedInitialData = () => {
  // Seed Users
  const users = loadUsers();
  if (Object.keys(users).length === 0) {
    // Hasher helper for seed (simple btoa as per original logic)
    const hash = (s: string) => btoa(s).slice(0, 32);
    
    // Students (Pass: RAHUL)
    const sPass = hash('RAHUL');
    ['rahul.demo1@college.edu', 'student.demo2@college.edu'].forEach(email => {
        users[email] = { email, role: 'student', pwHash: sPass, mustChange: true };
    });

    // Teachers (Pass: TEACHER)
    const tPass = hash('TEACHER');
    ['teacher.demo1@college.edu'].forEach(email => {
        users[email] = { email: email, role: 'teacher', pwHash: tPass, mustChange: true };
    });

    saveUsers(users);
  }

  // Seed Content
  if (getAnnouncements().length === 0) {
    saveAnnouncements([{ 
      id: 'ann_1', type: 'announcement', title: 'Welcome juniors!', desc: 'Orientation on Monday at 9AM in auditorium.', time: new Date().toLocaleString(), author: 'admin@college.edu', likes: 5, comments: [] 
    }]);
  }
  
  if (getLostFound().length === 0) {
    saveLostFound([{ 
      id: 'lost_1', type: 'lostfound', title: 'White Type-C charger', desc: 'Left on bench 3 in room 709', time: new Date().toLocaleString(), author: 'student.demo2@college.edu', highAlert: false, likes: 0, comments: [] 
    }]);
  }

  // Seed Lectures
  if (getLectures().length === 0) {
    saveLectures([
      { id: 'lec_1', subject: 'Linear Algebra', topic: 'Eigenvectors', time: '09:00 AM', teacherName: 'Mr. Rupesh', room: 'Hall A' },
      { id: 'lec_2', subject: 'Data Structures', topic: 'Binary Trees', time: '11:30 AM', teacherName: 'Mr. Subhesh kumar', room: 'Lab 2' }
    ]);
  }
};