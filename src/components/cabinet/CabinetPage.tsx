import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import {
  getUserPathAccess, getUserProgress, getMessages,
  updateUser, sendMessage, markRead, hashPassword,
  createJoinRequest, getAllUsers
} from '@/lib/store';
import type { PathAccess, Path } from '@/lib/db';
import QuestPlayer from './QuestPlayer';

export default function CabinetPage() {
  const { currentUser, setCurrentUser, currentSite } = useApp();
  const [pathAccess, setPathAccess] = useState<Array<PathAccess & { path: Path }>>([]);
  const [progress, setProgress] = useState<ReturnType<typeof getUserProgress>>([]);
  const [messages, setMessages] = useState<ReturnType<typeof getMessages>>([]);
  const [tab, setTab] = useState<'paths' | 'messages' | 'settings'>('paths');
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [msgForm, setMsgForm] = useState({ content: '' });
  const [activePath, setActivePath] = useState<(PathAccess & { path: Path }) | null>(null);
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [pwError, setPwError] = useState('');
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) return;
    const access = getUserPathAccess(currentUser.id);
    setPathAccess(access);
    setProgress(getUserProgress(currentUser.id));
    setMessages(getMessages(currentUser.id));
    setEditForm({ name: currentUser.name, email: currentUser.email || '', phone: currentUser.phone || '' });
  }, [currentUser]);

  if (!currentUser) return null;

  if (activePath) {
    return <QuestPlayer access={activePath} onBack={() => { setActivePath(null); setProgress(getUserProgress(currentUser.id)); }} />;
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateUser(currentUser.id, { name: editForm.name, email: editForm.email, phone: editForm.phone });
    if (updated) { setCurrentUser(updated); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (hashPassword(passwordForm.current) !== currentUser.password_hash) { setPwError('Неверный текущий пароль'); return; }
    if (passwordForm.new !== passwordForm.confirm) { setPwError('Пароли не совпадают'); return; }
    if (passwordForm.new.length < 6) { setPwError('Минимум 6 символов'); return; }
    const updated = updateUser(currentUser.id, { password_hash: hashPassword(passwordForm.new) });
    if (updated) { setCurrentUser(updated); setPwSaved(true); setPasswordForm({ current: '', new: '', confirm: '' }); setTimeout(() => setPwSaved(false), 2000); }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgForm.content || !currentSite) return;
    const users = getAllUsers();
    const owner = users.find(u => u.role === 'owner');
    if (!owner) return;
    sendMessage(currentSite.id, currentUser.id, owner.id, msgForm.content);
    setMsgSent(true);
    setMsgForm({ content: '' });
    setTimeout(() => setMsgSent(false), 3000);
  };

  const handleRequestAccess = (siteId: string, pathId?: string) => {
    createJoinRequest(siteId, currentUser.id, pathId);
    setRequestSent(prev => new Set([...prev, siteId + (pathId || '')]));
  };

  const completedCount = progress.filter(p => p.completed).length;
  const totalScore = progress.filter(p => p.completed).reduce((sum, p) => sum + p.score, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full glass-card-violet flex items-center justify-center font-display text-2xl gold-text pulse-glow">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl gold-text mb-0.5">{currentUser.name}</h1>
            <p className="text-sm text-muted-foreground">{currentUser.email || currentUser.phone}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{completedCount} уровней пройдено</span>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400">⭐ {totalScore} очков</span>
            </div>
          </div>
          {/* Кнопка оплаты */}
          <a
            href="https://yoomoney.ru/to/410017253212598/0"
            target="_blank"
            rel="noopener noreferrer"
            className="gold-btn px-5 py-3 rounded-xl flex items-center gap-2 text-sm"
          >
            <Icon name="CreditCard" size={16} />
            Оплата
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-card rounded-xl mb-6 w-fit">
        {[
          { id: 'paths', label: 'Мои пути', icon: 'Map' },
          { id: 'messages', label: `Сообщения${messages.filter(m => !m.is_read && m.recipient_id === currentUser.id).length > 0 ? ` (${messages.filter(m => !m.is_read && m.recipient_id === currentUser.id).length})` : ''}`, icon: 'MessageCircle' },
          { id: 'settings', label: 'Настройки', icon: 'Settings' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${tab === t.id ? 'gold-btn' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* PATHS TAB */}
      {tab === 'paths' && (
        <div className="space-y-4">
          {pathAccess.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4 float">🗺️</div>
              <h3 className="font-display text-xl text-muted-foreground mb-2">Нет доступных путей</h3>
              <p className="text-sm text-muted-foreground mb-6">Запросите доступ у владельца платформы или дождитесь приглашения</p>
              {currentSite && (
                <button
                  onClick={() => handleRequestAccess(currentSite.id)}
                  disabled={requestSent.has(currentSite.id)}
                  className={`px-6 py-3 rounded-xl inline-flex items-center gap-2 text-sm transition-all ${requestSent.has(currentSite.id) ? 'bg-green-400/10 text-green-400 border border-green-400/30' : 'gold-btn'}`}
                >
                  <Icon name={requestSent.has(currentSite.id) ? 'CheckCircle' : 'Send'} size={16} />
                  {requestSent.has(currentSite.id) ? 'Запрос отправлен' : 'Запросить доступ'}
                </button>
              )}
            </div>
          ) : (
            pathAccess.map(access => {
              const pathProgress = progress.filter(p => p.path_id === access.path_id && p.completed);
              return (
                <div key={access.id} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">🗺️</div>
                      <div>
                        <h3 className="font-display text-sm mb-1">{access.path.title}</h3>
                        {access.path.description && <p className="text-xs text-muted-foreground mb-2">{access.path.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Icon name="CheckCircle" size={10} className="text-green-400" /> {pathProgress.length} пройдено</span>
                          <span className="flex items-center gap-1"><Icon name="Key" size={10} /> <span className="font-mono">{access.access_token.slice(0, 8)}...</span></span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActivePath(access)}
                      className="passage-btn flex items-center gap-2"
                    >
                      <Icon name="Play" size={16} />
                      Начать Путь: {access.path.title}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MESSAGES TAB */}
      {tab === 'messages' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display text-sm gold-text mb-4">Сообщить владельцу</h3>
            {msgSent ? (
              <div className="text-center py-6">
                <Icon name="CheckCircle" size={32} className="text-green-400 mx-auto mb-2" />
                <p className="text-green-400">Сообщение отправлено!</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <textarea
                  className="flex-1 bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                  rows={3}
                  placeholder="Ваше сообщение..."
                  value={msgForm.content}
                  onChange={e => setMsgForm(f => ({ ...f, content: e.target.value }))}
                />
                <button type="submit" className="gold-btn px-4 rounded-xl flex items-center gap-2 text-sm self-end py-3">
                  <Icon name="Send" size={16} />
                  Отправить
                </button>
              </form>
            )}
          </div>

          {messages.length > 0 && (
            <div className="space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => markRead(msg.id)}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${!msg.is_read && msg.recipient_id === currentUser.id ? 'border-primary/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full glass-card-violet flex items-center justify-center text-sm shrink-0">
                      {msg.sender?.name.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{msg.sender?.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString('ru')}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{msg.content}</p>
                    </div>
                    {!msg.is_read && msg.recipient_id === currentUser.id && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-sm gold-text mb-4">Личные данные</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
                <input className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input type="email" className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Телефон</label>
                <input type="tel" className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <button type="submit" className={`w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${saved ? 'bg-green-400/10 text-green-400' : 'gold-btn'}`}>
                <Icon name={saved ? 'CheckCircle' : 'Save'} size={16} />
                {saved ? 'Сохранено!' : 'Сохранить'}
              </button>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-sm gold-text mb-4">Изменить пароль</h3>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Текущий пароль</label>
                <input type="password" className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" value={passwordForm.current} onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Новый пароль</label>
                <input type="password" className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" value={passwordForm.new} onChange={e => setPasswordForm(f => ({ ...f, new: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Подтвердите пароль</label>
                <input type="password" className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} />
              </div>
              {pwError && <p className="text-destructive text-xs">{pwError}</p>}
              <button type="submit" className={`w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${pwSaved ? 'bg-green-400/10 text-green-400' : 'gold-btn'}`}>
                <Icon name={pwSaved ? 'CheckCircle' : 'Lock'} size={16} />
                {pwSaved ? 'Пароль обновлён!' : 'Обновить пароль'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}