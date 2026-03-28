import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Site, Path } from './db';
import { loadSession, saveSession, clearSession } from './db';
import { getUserByToken, createSession, loginUser, getSites, hasOwner } from './store';

interface AppContextType {
  currentUser: User | null;
  sessionToken: string | null;
  currentSite: Site | null;
  setCurrentSite: (site: Site | null) => void;
  login: (emailOrPhone: string, password: string) => User | null;
  logout: () => void;
  setCurrentUser: (u: User) => void;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  hasOwnerAccount: boolean;
  refreshUser: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  activeQuestPath: Path | null;
  setActiveQuestPath: (p: Path | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [hasOwnerAccount, setHasOwnerAccount] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [activeQuestPath, setActiveQuestPath] = useState<Path | null>(null);

  useEffect(() => {
    setHasOwnerAccount(hasOwner());
    const session = loadSession();
    if (session) {
      const user = getUserByToken(session.token);
      if (user) {
        setCurrentUserState(user);
        setSessionToken(session.token);
        const sites = getSites(user.role === 'owner' ? user.id : undefined);
        if (sites.length > 0) setCurrentSite(sites[0]);
      } else {
        clearSession();
      }
    }
  }, []);

  const login = useCallback((emailOrPhone: string, password: string): User | null => {
    const user = loginUser(emailOrPhone, password);
    if (!user) return null;
    const token = createSession(user.id);
    setCurrentUserState(user);
    setSessionToken(token);
    saveSession(token, user);
    const sites = getSites(user.role === 'owner' ? user.id : undefined);
    if (sites.length > 0) setCurrentSite(sites[0]);
    return user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setCurrentUserState(null);
    setSessionToken(null);
    setCurrentSite(null);
    setActivePage('dashboard');
  }, []);

  const setCurrentUser = useCallback((u: User) => {
    setCurrentUserState(u);
    const session = loadSession();
    if (session) saveSession(session.token, u);
  }, []);

  const refreshUser = useCallback(() => {
    const session = loadSession();
    if (session) {
      const user = getUserByToken(session.token);
      if (user) setCurrentUserState(user);
    }
    setHasOwnerAccount(hasOwner());
  }, []);

  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const isEditor = isAdmin || currentUser?.role === 'editor';

  return (
    <AppContext.Provider value={{
      currentUser, sessionToken, currentSite, setCurrentSite,
      login, logout, setCurrentUser,
      isOwner, isAdmin, isEditor,
      hasOwnerAccount, refreshUser,
      activePage, setActivePage,
      activeQuestPath, setActiveQuestPath
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
