import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import {
  getSiteMembers, getJoinRequests, approveJoinRequest,
  createInvitation, updateMemberRole, getPaths, grantPathAccess,
  getAllUsers, updateUser, hashPassword
} from '@/lib/store';
import type { UserRole } from '@/lib/db';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/db';

type InviteType = 'email' | 'phone' | 'vk' | 'max';

export default function MembersPage() {
  const { currentUser, currentSite, isAdmin, isOwner } = useApp();
  const [members, setMembers] = useState<ReturnType<typeof getSiteMembers>>([]);
  const [requests, setRequests] = useState<ReturnType<typeof getJoinRequests>>([]);
  const [paths, setPaths] = useState<ReturnType<typeof getPaths>>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<InviteType>('email');
  const [inviteContact, setInviteContact] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member_1');
  const [inviteSent, setInviteSent] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [tab, setTab] = useState<'members' | 'requests' | 'invite'>('members');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [accessModal, setAccessModal] = useState<{ userId: string; userName: string } | null>(null);

  const reload = () => {
    if (!currentSite) return;
    setMembers(getSiteMembers(currentSite.id));
    setRequests(getJoinRequests(currentSite.id));
    setPaths(getPaths(currentSite.id));
  };

  useEffect(() => { reload(); }, [currentSite]);

  const handleApprove = (requestId: string) => {
    if (!currentUser) return;
    approveJoinRequest(requestId, currentUser.id);
    reload();
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSite || !currentUser || !inviteContact) return;
    const inv = createInvitation(currentSite.id, currentUser.id, inviteContact, inviteType, inviteRole);

    const link = `${window.location.origin}?invite=${inv.invite_token}`;

    if (inviteType === 'vk') {
      const vkText = encodeURIComponent(`Вас приглашают на платформу "Мастер путей"! Перейдите по ссылке: ${link}`);
      window.open(`https://vk.com/share.php?url=${encodeURIComponent(link)}&title=${vkText}`, '_blank');
    } else if (inviteType === 'email') {
      const subject = encodeURIComponent('Приглашение на платформу Мастер путей');
      const body = encodeURIComponent(`Добрый день!\n\nВас приглашают присоединиться к платформе "Мастер путей".\n\nПерейдите по ссылке для регистрации:\n${link}\n\nС уважением,\nКоманда Мастер путей`);
      window.open(`mailto:${inviteContact}?subject=${subject}&body=${body}`, '_blank');
    } else if (inviteType === 'phone') {
      const smsText = encodeURIComponent(`Мастер путей: ${link}`);
      window.open(`sms:${inviteContact}?body=${smsText}`, '_blank');
    }

    setGeneratedLink(link);
    setInviteSent(true);
  };

  const handleUpdatePassword = (userId: string) => {
    if (editPassword.length < 6) return;
    updateUser(userId, { password_hash: hashPassword(editPassword) });
    setEditingMember(null);
    setEditPassword('');
  };

  const handleGrantAccess = (pathId: string) => {
    if (!accessModal || !currentUser) return;
    grantPathAccess(pathId, accessModal.userId, currentUser.id);
  };

  const INVITE_TYPES: { type: InviteType; label: string; icon: string; color: string }[] = [
    { type: 'email', label: 'Email', icon: 'Mail', color: 'text-blue-400' },
    { type: 'phone', label: 'SMS', icon: 'Phone', color: 'text-green-400' },
    { type: 'vk', label: 'ВКонтакте', icon: 'Share2', color: 'text-blue-300' },
    { type: 'max', label: 'Макс', icon: 'MessageCircle', color: 'text-purple-400' },
  ];

  const ROLE_OPTIONS: UserRole[] = ['admin', 'editor', 'member_1', 'member_2', 'member_3'];

  if (!currentSite) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">🌐</div>
          <p className="text-muted-foreground">Сначала выберите сайт</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl gold-text mb-1">Участники</h1>
          <p className="text-muted-foreground text-sm">{currentSite.name}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setTab('invite'); setShowInviteModal(true); }} className="gold-btn px-5 py-3 rounded-xl flex items-center gap-2">
            <Icon name="UserPlus" size={18} />
            Пригласить
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-card rounded-xl mb-6 w-fit">
        {[
          { id: 'members', label: `Участники (${members.length})`, icon: 'Users' },
          { id: 'requests', label: `Запросы (${requests.length})`, icon: 'Bell' },
          { id: 'invite', label: 'Пригласить', icon: 'UserPlus' },
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

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-muted-foreground">Нет участников. Пригласите первых!</p>
            </div>
          ) : (
            members.map(m => (
              <div key={m.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full glass-card-violet flex items-center justify-center font-display text-sm">
                      {m.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.user.name}</p>
                      <p className="text-xs text-muted-foreground">{m.user.email || m.user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full bg-muted ${ROLE_COLORS[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                    {isAdmin && (
                      <>
                        <select
                          className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none"
                          value={m.role}
                          onChange={e => { updateMemberRole(m.id, e.target.value as UserRole); reload(); }}
                        >
                          {ROLE_OPTIONS.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setAccessModal({ userId: m.user_id, userName: m.user.name })}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors flex items-center gap-1"
                        >
                          <Icon name="Key" size={12} /> Доступ к путям
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => { setEditingMember(editingMember === m.user_id ? null : m.user_id); setEditPassword(''); }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <Icon name="Lock" size={12} /> Пароль
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {editingMember === m.user_id && isOwner && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                    <input
                      type="password"
                      className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      placeholder="Новый пароль (мин. 6 символов)"
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                    />
                    <button onClick={() => handleUpdatePassword(m.user_id)} className="gold-btn px-4 py-2 rounded-lg text-sm">Обновить</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="text-5xl mb-3">📬</div>
              <p className="text-muted-foreground">Нет новых запросов</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full glass-card-violet flex items-center justify-center">
                    {req.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{req.user.name}</p>
                    <p className="text-xs text-muted-foreground">{req.user.email || req.user.phone}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Icon name="Clock" size={10} /> {new Date(req.requested_at).toLocaleString('ru')}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(req.id)} className="gold-btn px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                      <Icon name="CheckCircle" size={14} /> Принять
                    </button>
                    <button className="glass-card px-4 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1">
                      <Icon name="XCircle" size={14} /> Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Invite Tab */}
      {tab === 'invite' && (
        <div className="glass-card rounded-2xl p-6 max-w-lg">
          <h3 className="font-display text-lg gold-text mb-6">Пригласить участника</h3>
          {inviteSent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl float">✉️</div>
              <p className="text-green-400 font-medium">Приглашение отправлено!</p>
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Или поделитесь ссылкой напрямую:</p>
                <div className="flex items-center gap-2">
                  <input className="flex-1 bg-muted text-xs rounded px-3 py-2 text-muted-foreground font-mono" readOnly value={generatedLink} />
                  <button onClick={() => { navigator.clipboard.writeText(generatedLink); }} className="gold-btn px-3 py-2 rounded text-xs">
                    <Icon name="Copy" size={12} />
                  </button>
                </div>
              </div>
              <button onClick={() => { setInviteSent(false); setInviteContact(''); setGeneratedLink(''); }} className="text-sm text-muted-foreground hover:text-foreground">
                Пригласить ещё
              </button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Способ приглашения</label>
                <div className="grid grid-cols-4 gap-2">
                  {INVITE_TYPES.map(t => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => { setInviteType(t.type); setInviteContact(''); }}
                      className={`py-2 px-3 rounded-lg text-xs flex flex-col items-center gap-1 transition-all ${inviteType === t.type ? 'gold-btn' : 'glass-card text-muted-foreground hover:text-foreground'}`}
                    >
                      <Icon name={t.icon} size={16} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {inviteType === 'email' ? 'Email адрес' : inviteType === 'phone' ? 'Номер телефона' : inviteType === 'vk' ? 'VK профиль / ID' : 'Аккаунт Макс'}
                </label>
                <input
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  placeholder={inviteType === 'email' ? 'user@email.com' : inviteType === 'phone' ? '+7 900 000-00-00' : inviteType === 'vk' ? 'https://vk.com/id...' : '@username'}
                  value={inviteContact}
                  onChange={e => setInviteContact(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Роль участника</label>
                <select
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                >
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <button type="submit" className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2">
                <Icon name="Send" size={18} />
                Отправить приглашение
              </button>
            </form>
          )}
        </div>
      )}

      {/* Path Access Modal */}
      {accessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAccessModal(null)} />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="font-display text-lg gold-text mb-4">Доступ к путям · {accessModal.userName}</h3>
            {paths.length === 0 ? (
              <p className="text-muted-foreground text-sm">Нет доступных путей для этого сайта</p>
            ) : (
              <div className="space-y-2">
                {paths.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 glass-card rounded-lg">
                    <span className="text-sm">{p.title}</span>
                    <button onClick={() => handleGrantAccess(p.id)} className="gold-btn px-3 py-1.5 rounded text-xs flex items-center gap-1">
                      <Icon name="Key" size={12} /> Открыть доступ
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setAccessModal(null)} className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
