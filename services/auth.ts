import { loadUsers, saveUsers, setSession, getSession } from './storage';
import { User, Role } from '../types';

const COMMON_PASS_STUDENT = 'RAHUL';
const COMMON_PASS_TEACHER = 'TEACHER';

const hash = (str: string) => {
  try { return btoa(str).slice(0, 32); } catch { return str; }
};

export const login = (email: string, pass: string, role: Role): { success: boolean; msg: string; mustChange?: boolean } => {
  const users = loadUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const user = users[normalizedEmail];

  if (!user || user.role !== role) {
    return { success: false, msg: 'Account not found for this role.' };
  }

  const matchesStored = user.pwHash === hash(pass);
  const commonPass = role === 'student' ? COMMON_PASS_STUDENT : COMMON_PASS_TEACHER;
  const usedCommon = pass === commonPass;

  // Allow common passkey ONLY if mustChange is true
  const allowCommonNow = user.mustChange && usedCommon;

  if (!matchesStored && !allowCommonNow) {
    return { success: false, msg: 'Incorrect passkey.' };
  }

  if (user.mustChange) {
    return { success: true, msg: 'Temporary passkey detected.', mustChange: true };
  }

  setSession({ email: user.email, role: user.role, ts: Date.now() });
  return { success: true, msg: 'Login successful.' };
};

export const signup = (email: string, role: Role): { success: boolean; msg: string } => {
  const users = loadUsers();
  const normalizedEmail = email.toLowerCase().trim();

  if (users[normalizedEmail]) {
    return { success: false, msg: 'Account already exists.' };
  }

  const commonPass = role === 'student' ? COMMON_PASS_STUDENT : COMMON_PASS_TEACHER;
  
  users[normalizedEmail] = {
    email: normalizedEmail,
    role,
    pwHash: hash(commonPass),
    mustChange: true
  };
  saveUsers(users);
  
  return { success: true, msg: `Account created. Use "${commonPass}" on first login.` };
};

export const changePassword = (email: string, newPass: string): boolean => {
  const users = loadUsers();
  const user = users[email];
  if (!user) return false;

  user.pwHash = hash(newPass);
  user.mustChange = false;
  users[email] = user;
  saveUsers(users);

  setSession({ email: user.email, role: user.role, ts: Date.now() });
  return true;
};

export const logout = () => {
  setSession(null);
};