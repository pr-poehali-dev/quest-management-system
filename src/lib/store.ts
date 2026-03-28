// Локальное хранилище данных (localStorage)
import { genId, hashPassword } from './db';
import type { User, Site, Path, Level, SiteMember, PathAccess, Progress, JoinRequest, Invitation, Message, UserRole } from './db';

const STORE_KEY = 'mp_store';

interface Store {
  users: User[];
  sites: Site[];
  paths: Path[];
  levels: Level[];
  siteMembers: SiteMember[];
  pathAccess: PathAccess[];
  progress: Progress[];
  joinRequests: JoinRequest[];
  invitations: Invitation[];
  messages: Message[];
  sessions: Array<{ id: string; user_id: string; token: string; expires_at: string }>;
}

function emptyStore(): Store {
  return {
    users: [], sites: [], paths: [], levels: [],
    siteMembers: [], pathAccess: [], progress: [],
    joinRequests: [], invitations: [], messages: [], sessions: []
  };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    return { ...emptyStore(), ...JSON.parse(raw) };
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

// AUTH
export function registerOwner(name: string, email: string, phone: string, password: string): User {
  const store = loadStore();
  const user: User = {
    id: genId(), name, email, phone,
    role: 'owner', password_hash: hashPassword(password),
    is_active: true, avatar_url: undefined,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  store.users.push(user);
  saveStore(store);
  return user;
}

export function registerUser(name: string, email: string, phone: string, password: string): User {
  const store = loadStore();
  const user: User = {
    id: genId(), name, email, phone,
    role: 'member_1', password_hash: hashPassword(password),
    is_active: true, avatar_url: undefined,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  store.users.push(user);
  saveStore(store);
  return user;
}

export function loginUser(emailOrPhone: string, password: string): User | null {
  const store = loadStore();
  const user = store.users.find(u =>
    (u.email === emailOrPhone || u.phone === emailOrPhone) &&
    u.password_hash === hashPassword(password) &&
    u.is_active
  );
  return user || null;
}

export function createSession(userId: string): string {
  const store = loadStore();
  const token = genId() + genId();
  store.sessions.push({
    id: genId(), user_id: userId, token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  saveStore(store);
  return token;
}

export function getUserByToken(token: string): User | null {
  const store = loadStore();
  const session = store.sessions.find(s => s.token === token && new Date(s.expires_at) > new Date());
  if (!session) return null;
  return store.users.find(u => u.id === session.user_id) || null;
}

export function hasOwner(): boolean {
  const store = loadStore();
  return store.users.some(u => u.role === 'owner');
}

// SITES
export function createSite(name: string, description: string, ownerId: string): Site {
  const store = loadStore();
  const site: Site = {
    id: genId(), name, description, owner_id: ownerId,
    integration_key: genId(),
    status: 'active', settings: {},
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  store.sites.push(site);
  saveStore(store);
  return site;
}

export function getSites(ownerId?: string): Site[] {
  const store = loadStore();
  if (ownerId) return store.sites.filter(s => s.owner_id === ownerId);
  return store.sites;
}

export function updateSite(id: string, data: Partial<Site>) {
  const store = loadStore();
  const idx = store.sites.findIndex(s => s.id === id);
  if (idx >= 0) {
    store.sites[idx] = { ...store.sites[idx], ...data, updated_at: new Date().toISOString() };
    saveStore(store);
  }
}

// PATHS
export function createPath(siteId: string, title: string, description: string): Path {
  const store = loadStore();
  const orderNum = store.paths.filter(p => p.site_id === siteId).length;
  const path: Path = {
    id: genId(), site_id: siteId, title, description,
    order_num: orderNum, is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  store.paths.push(path);
  saveStore(store);
  return path;
}

export function getPaths(siteId: string): Path[] {
  const store = loadStore();
  return store.paths.filter(p => p.site_id === siteId).sort((a, b) => a.order_num - b.order_num);
}

export function updatePath(id: string, data: Partial<Path>) {
  const store = loadStore();
  const idx = store.paths.findIndex(p => p.id === id);
  if (idx >= 0) {
    store.paths[idx] = { ...store.paths[idx], ...data, updated_at: new Date().toISOString() };
    saveStore(store);
  }
}

// LEVELS
export function createLevel(pathId: string, title: string, riddleContent: string, answer: string, hint: string, riddleType: 'text' | 'image' | 'video' | 'audio'): Level {
  const store = loadStore();
  const orderNum = store.levels.filter(l => l.path_id === pathId).length;
  const level: Level = {
    id: genId(), path_id: pathId, title,
    order_num: orderNum, riddle_type: riddleType,
    riddle_content: riddleContent, answer, hint,
    hint_penalty: 10,
    created_at: new Date().toISOString()
  };
  store.levels.push(level);
  saveStore(store);
  return level;
}

export function getLevels(pathId: string): Level[] {
  const store = loadStore();
  return store.levels.filter(l => l.path_id === pathId).sort((a, b) => a.order_num - b.order_num);
}

export function updateLevel(id: string, data: Partial<Level>) {
  const store = loadStore();
  const idx = store.levels.findIndex(l => l.id === id);
  if (idx >= 0) {
    store.levels[idx] = { ...store.levels[idx], ...data };
    saveStore(store);
  }
}

export function deleteLevel(id: string) {
  const store = loadStore();
  store.levels = store.levels.filter(l => l.id !== id);
  saveStore(store);
}

// MEMBERS
export function getSiteMembers(siteId: string): Array<SiteMember & { user: User }> {
  const store = loadStore();
  return store.siteMembers
    .filter(m => m.site_id === siteId)
    .map(m => ({ ...m, user: store.users.find(u => u.id === m.user_id)! }))
    .filter(m => m.user);
}

export function addMember(siteId: string, userId: string, role: UserRole): SiteMember {
  const store = loadStore();
  const existing = store.siteMembers.find(m => m.site_id === siteId && m.user_id === userId);
  if (existing) return existing;
  const member: SiteMember = {
    id: genId(), site_id: siteId, user_id: userId,
    role, joined_at: new Date().toISOString()
  };
  store.siteMembers.push(member);
  saveStore(store);
  return member;
}

export function updateMemberRole(id: string, role: UserRole) {
  const store = loadStore();
  const idx = store.siteMembers.findIndex(m => m.id === id);
  if (idx >= 0) { store.siteMembers[idx].role = role; saveStore(store); }
}

// PATH ACCESS
export function grantPathAccess(pathId: string, userId: string, grantedBy: string): PathAccess {
  const store = loadStore();
  const existing = store.pathAccess.find(a => a.path_id === pathId && a.user_id === userId);
  if (existing) return existing;
  const access: PathAccess = {
    id: genId(), path_id: pathId, user_id: userId,
    access_token: genId(),
    granted_at: new Date().toISOString(), granted_by: grantedBy
  };
  store.pathAccess.push(access);
  saveStore(store);
  return access;
}

export function getUserPathAccess(userId: string): Array<PathAccess & { path: Path }> {
  const store = loadStore();
  return store.pathAccess
    .filter(a => a.user_id === userId)
    .map(a => ({ ...a, path: store.paths.find(p => p.id === a.path_id)! }))
    .filter(a => a.path);
}

// PROGRESS
export function saveProgress(userId: string, levelId: string, pathId: string, completed: boolean, usedHint: boolean, score: number): Progress {
  const store = loadStore();
  const existing = store.progress.findIndex(p => p.user_id === userId && p.level_id === levelId);
  if (existing >= 0) {
    store.progress[existing] = { ...store.progress[existing], completed, used_hint: usedHint, score, completed_at: completed ? new Date().toISOString() : undefined };
    saveStore(store);
    return store.progress[existing];
  }
  const prog: Progress = {
    id: genId(), user_id: userId, level_id: levelId, path_id: pathId,
    completed, used_hint: usedHint, score, attempts: 1,
    completed_at: completed ? new Date().toISOString() : undefined
  };
  store.progress.push(prog);
  saveStore(store);
  return prog;
}

export function getUserProgress(userId: string): Progress[] {
  const store = loadStore();
  return store.progress.filter(p => p.user_id === userId);
}

export function getAllProgress(): Progress[] {
  const store = loadStore();
  return store.progress;
}

// JOIN REQUESTS
export function createJoinRequest(siteId: string, userId: string, pathId?: string): JoinRequest {
  const store = loadStore();
  const existing = store.joinRequests.find(r => r.site_id === siteId && r.user_id === userId && r.status === 'pending');
  if (existing) return existing;
  const req: JoinRequest = {
    id: genId(), site_id: siteId, user_id: userId,
    path_id: pathId, status: 'pending',
    requested_at: new Date().toISOString()
  };
  store.joinRequests.push(req);
  saveStore(store);
  return req;
}

export function getJoinRequests(siteId: string): Array<JoinRequest & { user: User }> {
  const store = loadStore();
  return store.joinRequests
    .filter(r => r.site_id === siteId && r.status === 'pending')
    .map(r => ({ ...r, user: store.users.find(u => u.id === r.user_id)! }))
    .filter(r => r.user);
}

export function approveJoinRequest(requestId: string, reviewerId: string) {
  const store = loadStore();
  const idx = store.joinRequests.findIndex(r => r.id === requestId);
  if (idx >= 0) {
    store.joinRequests[idx].status = 'approved';
    store.joinRequests[idx].reviewed_at = new Date().toISOString();
    store.joinRequests[idx].reviewed_by = reviewerId;
    const req = store.joinRequests[idx];
    // Add to members
    const existing = store.siteMembers.find(m => m.site_id === req.site_id && m.user_id === req.user_id);
    if (!existing) {
      store.siteMembers.push({ id: genId(), site_id: req.site_id, user_id: req.user_id, role: 'member_1', joined_at: new Date().toISOString() });
    }
    saveStore(store);
  }
}

// INVITATIONS
export function createInvitation(siteId: string, invitedBy: string, contact: string, contactType: 'email' | 'phone' | 'vk' | 'max', role: UserRole): Invitation {
  const store = loadStore();
  const inv: Invitation = {
    id: genId(), site_id: siteId, invited_by: invitedBy,
    contact, contact_type: contactType,
    invite_token: genId(), role, status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  store.invitations.push(inv);
  saveStore(store);
  return inv;
}

// MESSAGES
export function sendMessage(siteId: string, senderId: string, recipientId: string, content: string): Message {
  const store = loadStore();
  const msg: Message = {
    id: genId(), site_id: siteId, sender_id: senderId,
    recipient_id: recipientId, content, is_read: false,
    created_at: new Date().toISOString()
  };
  store.messages.push(msg);
  saveStore(store);
  return msg;
}

export function getMessages(userId: string): Array<Message & { sender: User }> {
  const store = loadStore();
  return store.messages
    .filter(m => m.recipient_id === userId || m.sender_id === userId)
    .map(m => ({ ...m, sender: store.users.find(u => u.id === m.sender_id)! }))
    .filter(m => m.sender)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function markRead(messageId: string) {
  const store = loadStore();
  const idx = store.messages.findIndex(m => m.id === messageId);
  if (idx >= 0) { store.messages[idx].is_read = true; saveStore(store); }
}

// UPDATE USER
export function updateUser(id: string, data: Partial<User>) {
  const store = loadStore();
  const idx = store.users.findIndex(u => u.id === id);
  if (idx >= 0) {
    store.users[idx] = { ...store.users[idx], ...data, updated_at: new Date().toISOString() };
    saveStore(store);
    return store.users[idx];
  }
  return null;
}

export function getAllUsers(): User[] {
  const store = loadStore();
  return store.users;
}
