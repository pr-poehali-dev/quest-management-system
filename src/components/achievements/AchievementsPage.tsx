import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { getAllProgress, getAllUsers, getPaths, getLevels } from '@/lib/store';
import type { User } from '@/lib/db';

interface UserStats {
  user: User;
  totalCompleted: number;
  totalScore: number;
  usedHints: number;
  paths: number;
}

export default function AchievementsPage() {
  const { currentSite } = useApp();
  const [stats, setStats] = useState<UserStats[]>([]);
  const [filter, setFilter] = useState<'score' | 'completed' | 'hints'>('score');

  useEffect(() => {
    if (!currentSite) return;
    const allProgress = getAllProgress();
    const allUsers = getAllUsers();
    const sitePaths = getPaths(currentSite.id);
    const pathIds = new Set(sitePaths.map(p => p.id));

    const userMap = new Map<string, UserStats>();

    allUsers.forEach(user => {
      const userProgress = allProgress.filter(p => p.user_id === user.id && pathIds.has(p.path_id));
      const completed = userProgress.filter(p => p.completed);
      const uniquePaths = new Set(completed.map(p => p.path_id));
      userMap.set(user.id, {
        user,
        totalCompleted: completed.length,
        totalScore: completed.reduce((sum, p) => sum + p.score, 0),
        usedHints: userProgress.filter(p => p.used_hint).length,
        paths: uniquePaths.size,
      });
    });

    const sorted = Array.from(userMap.values()).filter(s => s.totalCompleted > 0 || s.totalScore > 0);
    setStats(sorted);
  }, [currentSite]);

  const sortedStats = [...stats].sort((a, b) => {
    if (filter === 'score') return b.totalScore - a.totalScore;
    if (filter === 'completed') return b.totalCompleted - a.totalCompleted;
    return a.usedHints - b.usedHints;
  });

  const getMedalColor = (idx: number) => {
    if (idx === 0) return 'text-yellow-400';
    if (idx === 1) return 'text-gray-400';
    if (idx === 2) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getMedalEmoji = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `${idx + 1}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text mb-1">Таблица достижений</h1>
        <p className="text-muted-foreground text-sm">Прогресс участников в реальном времени</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'score', label: 'По очкам', icon: 'Star' },
          { id: 'completed', label: 'По уровням', icon: 'CheckCircle' },
          { id: 'hints', label: 'Без подсказок', icon: 'Eye' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${filter === f.id ? 'gold-btn' : 'glass-card text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name={f.icon} size={14} />
            {f.label}
          </button>
        ))}
      </div>

      {sortedStats.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4 float">🏆</div>
          <h3 className="font-display text-xl text-muted-foreground mb-2">Таблица пуста</h3>
          <p className="text-sm text-muted-foreground">Участники ещё не прошли ни одного уровня</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-2 text-xs text-muted-foreground font-medium">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Участник</div>
            <div className="col-span-2 text-center">Очки</div>
            <div className="col-span-2 text-center">Уровней</div>
            <div className="col-span-2 text-center">Путей</div>
            <div className="col-span-1 text-center">Подск.</div>
          </div>

          {sortedStats.map((stat, idx) => (
            <div
              key={stat.user.id}
              className={`glass-card rounded-xl p-4 animate-fade-in grid grid-cols-12 gap-4 items-center transition-all ${idx === 0 ? 'border-yellow-400/30 glow-gold' : idx === 1 ? 'border-gray-400/20' : ''}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className={`col-span-1 text-xl font-display ${getMedalColor(idx)} text-center`}>
                {getMedalEmoji(idx)}
              </div>
              <div className="col-span-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-display shrink-0 ${idx === 0 ? 'bg-yellow-400/10 text-yellow-400' : 'glass-card-violet'}`}>
                  {stat.user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{stat.user.name}</p>
                  <p className="text-xs text-muted-foreground">{stat.user.email || stat.user.phone}</p>
                </div>
              </div>
              <div className={`col-span-2 text-center font-display text-lg ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-foreground'}`}>
                {stat.totalScore}
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm font-medium text-green-400">{stat.totalCompleted}</span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm text-blue-400">{stat.paths}</span>
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-sm ${stat.usedHints > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {stat.usedHints}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedStats.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="glass-card-violet rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="font-display text-sm gold-text mb-1">Лидер</p>
            <p className="text-sm">{sortedStats[0]?.user.name || '—'}</p>
            <p className="text-xs text-muted-foreground">{sortedStats[0]?.totalScore || 0} очков</p>
          </div>
          <div className="glass-card rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <p className="font-display text-sm text-blue-400 mb-1">Всего уровней</p>
            <p className="font-display text-2xl">{sortedStats.reduce((s, u) => s + u.totalCompleted, 0)}</p>
            <p className="text-xs text-muted-foreground">пройдено</p>
          </div>
          <div className="glass-card rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="font-display text-sm text-purple-400 mb-1">Участников</p>
            <p className="font-display text-2xl">{sortedStats.length}</p>
            <p className="text-xs text-muted-foreground">активных</p>
          </div>
        </div>
      )}
    </div>
  );
}
