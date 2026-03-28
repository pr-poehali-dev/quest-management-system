import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { getSites, getPaths, getSiteMembers, getJoinRequests, getAllProgress, getAllUsers } from '@/lib/store';
import type { Site, Path } from '@/lib/db';
import AcceptSiteModal from '@/components/sites/AcceptSiteModal';

export default function DashboardPage() {
  const { currentUser, currentSite, setActivePage, isOwner, isAdmin } = useApp();
  const [sites, setSites] = useState<Site[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const s = getSites(isOwner ? currentUser.id : undefined);
    setSites(s);
    if (s.length > 0) {
      const p = getPaths(s[0].id);
      setPaths(p);
      const m = getSiteMembers(s[0].id);
      setMemberCount(m.length);
      const r = getJoinRequests(s[0].id);
      setRequestCount(r.length);
    }
    const prog = getAllProgress();
    setProgressTotal(prog.filter(p => p.completed).length);
  }, [currentUser, isOwner]);

  const stats = [
    { label: 'Сайтов', value: sites.length, icon: 'Globe', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Путей', value: paths.length, icon: 'Map', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Участников', value: memberCount, icon: 'Users', color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Запросов', value: requestCount, icon: 'Bell', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Пройдено', value: progressTotal, icon: 'Trophy', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Пользователей', value: getAllUsers().length, icon: 'UserCheck', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl gold-text mb-1">Панель управления</h1>
          <p className="text-muted-foreground">Добро пожаловать, {currentUser?.name} · {currentSite?.name || 'Нет активного сайта'}</p>
        </div>
        {(isOwner || isAdmin) && (
          <button
            onClick={() => setShowAcceptModal(true)}
            className="gold-btn px-6 py-3 rounded-xl flex items-center gap-2 pulse-glow"
          >
            <Icon name="PlusCircle" size={18} />
            Принять дополнение
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-4 text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.bg} mb-3`}>
              <Icon name={stat.icon} size={20} className={stat.color} />
            </div>
            <div className={`font-display text-2xl ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sites as Quests */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-foreground">Сайты и Пути</h2>
          {(isOwner || isAdmin) && (
            <button onClick={() => setActivePage('sites')} className="text-sm text-primary hover:underline flex items-center gap-1">
              Управление <Icon name="ArrowRight" size={14} />
            </button>
          )}
        </div>
        {sites.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="text-5xl mb-4 float">🗺️</div>
            <h3 className="font-display text-lg text-muted-foreground mb-2">Нет подключённых сайтов</h3>
            <p className="text-sm text-muted-foreground mb-6">Нажмите «Принять дополнение», чтобы добавить первый сайт с путями</p>
            {(isOwner || isAdmin) && (
              <button onClick={() => setShowAcceptModal(true)} className="gold-btn px-6 py-3 rounded-xl inline-flex items-center gap-2">
                <Icon name="Plus" size={16} />
                Добавить сайт
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map(site => {
              const sitePaths = getPaths(site.id);
              return (
                <div key={site.id} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group" onClick={() => setActivePage('paths')}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xl">🌐</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${site.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {site.status === 'active' ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <h3 className="font-display text-sm mb-1 group-hover:text-primary transition-colors">{site.name}</h3>
                  {site.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{site.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Icon name="Map" size={12} /> {sitePaths.length} путей</span>
                    <span className="flex items-center gap-1"><Icon name="Calendar" size={12} /> {new Date(site.created_at).toLocaleDateString('ru')}</span>
                  </div>
                  {sitePaths.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1">
                      {sitePaths.slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Icon name="ChevronRight" size={12} className="text-primary" />
                          {p.title}
                        </div>
                      ))}
                      {sitePaths.length > 3 && <p className="text-xs text-muted-foreground">+{sitePaths.length - 3} ещё</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Join Requests */}
      {(isOwner || isAdmin) && currentSite && (() => {
        const requests = getJoinRequests(currentSite.id);
        if (requests.length === 0) return null;
        return (
          <div>
            <h2 className="font-display text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
              Запросы на участие ({requests.length})
            </h2>
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full glass-card-violet flex items-center justify-center">
                      {req.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{req.user.name}</p>
                      <p className="text-xs text-muted-foreground">{req.user.email || req.user.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => setActivePage('members')} className="gold-btn px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Icon name="CheckCircle" size={14} />
                    Принять
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <AcceptSiteModal open={showAcceptModal} onClose={() => setShowAcceptModal(false)} />
    </div>
  );
}
