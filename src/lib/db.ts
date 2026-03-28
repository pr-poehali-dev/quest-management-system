// Типы для всей платформы

export type UserRole = 'owner' | 'admin' | 'editor' | 'member_1' | 'member_2' | 'member_3';

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  editor: 'Редактор',
  member_1: 'Участник I',
  member_2: 'Участник II',
  member_3: 'Участник III',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'text-yellow-400',
  admin: 'text-purple-400',
  editor: 'text-blue-400',
  member_1: 'text-green-400',
  member_2: 'text-teal-400',
  member_3: 'text-cyan-400',
};

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: UserRole;
  password_hash: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  integration_key: string;
  status: 'active' | 'inactive' | 'pending';
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Path {
  id: string;
  site_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  order_num: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RiddleType = 'text' | 'image' | 'video' | 'audio';

export interface Level {
  id: string;
  path_id: string;
  title: string;
  order_num: number;
  riddle_type: RiddleType;
  riddle_content?: string;
  riddle_file_url?: string;
  answer: string;
  hint?: string;
  hint_penalty: number;
  created_at: string;
}

export interface SiteMember {
  id: string;
  site_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  user?: User;
}

export interface PathAccess {
  id: string;
  path_id: string;
  user_id: string;
  access_token: string;
  granted_at: string;
  granted_by: string;
  path?: Path;
}

export interface Progress {
  id: string;
  user_id: string;
  level_id: string;
  path_id: string;
  completed: boolean;
  used_hint: boolean;
  score: number;
  completed_at?: string;
  attempts: number;
}

export interface JoinRequest {
  id: string;
  site_id: string;
  user_id: string;
  path_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  user?: User;
  path?: Path;
}

export interface Invitation {
  id: string;
  site_id: string;
  invited_by: string;
  contact: string;
  contact_type: 'email' | 'phone' | 'vk' | 'max';
  invite_token: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface Message {
  id: string;
  site_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  expires_at: string;
}

// LocalStorage helpers
const LS_KEY = 'mp_session';

export function saveSession(token: string, user: User) {
  localStorage.setItem(LS_KEY, JSON.stringify({ token, user }));
}

export function loadSession(): { token: string; user: User } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(LS_KEY);
}

// Утилита для генерации псевдо-UUID на фронтенде (временная)
export function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function hashPassword(password: string): string {
  // Простой хэш для демо (в продакшене использовать bcrypt на бэкенде)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
