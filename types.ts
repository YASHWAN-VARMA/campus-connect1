export type Role = 'student' | 'teacher' | 'president';

export interface User {
  email: string;
  role: Role;
  pwHash: string;
  mustChange: boolean;
}

export interface Session {
  email: string;
  role: Role;
  ts: number;
}

export type PostType = 'announcement' | 'discussion' | 'lostfound' | 'tutor';

export interface Post {
  id: string;
  type: PostType;
  title?: string;
  desc: string; // Used for content/text/description
  author: string;
  time: string;
  anon?: boolean;
  reported?: boolean; // For tutor messages
  highAlert?: boolean; // For lost & found
  likes: number;
  comments: Comment[];
  category?: string; // For discussions
  tags?: string[];
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface Alert {
  id: string;
  text: string;
  time: string;
}

export interface AttendanceRecord {
  title: string;
  date: string;
  students: Record<string, 'present' | 'absent' | 'done'>;
}

export interface AttendanceData {
  [topicId: string]: AttendanceRecord;
}

// --- New Tutor Chat Types ---

export interface Attachment {
  id: string;
  type: 'image' | 'video';
  name: string;
  data: string; // Base64 string for demo purposes
}

export interface ChatMessage {
  id: string;
  senderEmail: string;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
}

export interface TutorSession {
  id: string;
  studentEmail: string;
  teacherName: string; // "Mr. Subhesh kumar", etc.
  subject: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

// --- Lecture / Schedule Types ---

export interface Lecture {
  id: string;
  subject: string;
  topic: string;
  time: string; // ISO string or simple time string
  teacherName: string;
  room: string;
}