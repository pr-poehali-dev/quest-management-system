import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { ROLE_LABELS } from '@/lib/db';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  roles?: string[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Панель управления', icon: 'LayoutDashboard' },
  { id: 'sites', label: 'Управление сайтами', icon: 'Globe', roles: ['owner', 'admin'] },
  { id: 'paths', label: 'Редактор путей', icon: 'Map', roles: ['owner', 'admin', 'editor'] },
  { id: 'members', label: 'Участники', icon: 'Users', roles: ['owner', 'admin', 'editor'] },
  { id: 'achievements', label: 'Таблица достижений', icon: 'Trophy' },
  { id: 'messages', label: 'Сообщения', icon: 'MessageCircle' },
  { id: 'cabinet', label: 'Личный кабинет', icon: 'User' },
];

export default function Sidebar() {
  const { currentUser, logout, activePage, setActivePage, currentSite } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  if (!currentUser) return null;

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(currentUser.role)
  );

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg glass-card-violet flex items-center justify-center shrink-0 pulse-glow">
          <span className="text-lg">🗝️</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-display text-sm gold-text truncate">Мастер путей</h2>
            {currentSite && <p className="text-xs text-muted-foreground truncate">{currentSite.name}</p>}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto scrollbar-thin">
        {visibleItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activePage === item.id
                ? 'active text-primary bg-primary/10 border-l-2 border-primary'
                : 'text-sidebar-foreground hover:text-foreground'
            }`}
          >
            <Icon name={item.icon} size={18} className="shrink-0" />
            {!collapsed && (
              <span className="truncate font-body">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full glass-card-violet flex items-center justify-center shrink-0 text-sm">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[currentUser.role]}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
              <Icon name="LogOut" size={16} />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={logout} className="w-full flex justify-center py-2 text-muted-foreground hover:text-destructive transition-colors mt-1" title="Выйти">
            <Icon name="LogOut" size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
