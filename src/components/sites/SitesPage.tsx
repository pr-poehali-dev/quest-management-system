import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { getSites, updateSite, getPaths } from '@/lib/store';
import type { Site } from '@/lib/db';
import AcceptSiteModal from './AcceptSiteModal';

export default function SitesPage() {
  const { currentUser, currentSite, setCurrentSite, isOwner } = useApp();
  const [sites, setSites] = useState<Site[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [copied, setCopied] = useState<string | null>(null);

  const reload = () => {
    if (!currentUser) return;
    setSites(getSites(isOwner ? currentUser.id : undefined));
  };

  useEffect(() => { reload(); }, [currentUser, isOwner]);

  const handleEdit = (site: Site) => {
    setEditing(site);
    setEditForm({ name: site.name, description: site.description || '' });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    updateSite(editing.id, { name: editForm.name, description: editForm.description });
    reload();
    setEditing(null);
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const INTEGRATION_TEMPLATE = (site: Site) => `
=== ДАННЫЕ ИНТЕГРАЦИИ ДЛЯ "МАСТЕР ПУТЕЙ" ===
Сайт: ${site.name}
Ключ интеграции: ${site.integration_key}
Платформа: Мастер путей

--- ИНСТРУКЦИЯ ДЛЯ ИИ-ГЕНЕРАТОРА ---
Создай сайт участника квестов с интеграцией к платформе "Мастер путей".
Ключ для всех API-запросов: ${site.integration_key}
Подключи авторизацию, список путей, прохождение уровней, кнопку оплаты.
Стиль: тёмный фон, золотые кнопки (Cinzel), мистическая атмосфера.
=============================================
  `.trim();

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl gold-text mb-1">Управление сайтами</h1>
          <p className="text-muted-foreground text-sm">Подключённые сайты с квестами</p>
        </div>
        <button onClick={() => setShowModal(true)} className="gold-btn px-5 py-3 rounded-xl flex items-center gap-2">
          <Icon name="Plus" size={18} />
          Принять дополнение
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4 float">🌐</div>
          <h3 className="font-display text-xl text-muted-foreground mb-3">Нет подключённых сайтов</h3>
          <button onClick={() => setShowModal(true)} className="gold-btn px-6 py-3 rounded-xl inline-flex items-center gap-2">
            <Icon name="Plus" size={16} />
            Добавить первый сайт
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map(site => {
            const paths = getPaths(site.id);
            const isActive = currentSite?.id === site.id;
            return (
              <div key={site.id} className={`glass-card rounded-xl p-5 transition-all ${isActive ? 'border-primary/40 glow-blue' : 'hover:border-border/60'}`}>
                {editing?.id === site.id ? (
                  <div className="space-y-3">
                    <input
                      className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <textarea
                      className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary resize-none"
                      rows={2}
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="gold-btn px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                        <Icon name="Save" size={14} /> Сохранить
                      </button>
                      <button onClick={() => setEditing(null)} className="glass-card px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center shrink-0">
                          <span className="text-xl">🌐</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-sm">{site.name}</h3>
                            {isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Активен</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${site.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                              {site.status === 'active' ? 'Онлайн' : 'Офлайн'}
                            </span>
                          </div>
                          {site.description && <p className="text-xs text-muted-foreground mt-0.5">{site.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Icon name="Map" size={11} /> {paths.length} путей</span>
                            <span className="flex items-center gap-1"><Icon name="Key" size={11} /> <span className="font-mono">{site.integration_key.slice(0, 12)}...</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive && (
                          <button onClick={() => setCurrentSite(site)} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            Выбрать
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyKey(INTEGRATION_TEMPLATE(site), site.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${copied === site.id ? 'bg-green-400/10 text-green-400' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                          title="Скопировать данные интеграции"
                        >
                          <Icon name={copied === site.id ? 'CheckCircle' : 'Copy'} size={12} />
                          {copied === site.id ? 'Скопировано' : 'Данные интеграции'}
                        </button>
                        <button onClick={() => handleEdit(site)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
                          <Icon name="Edit2" size={14} />
                        </button>
                        <button
                          onClick={() => { updateSite(site.id, { status: site.status === 'active' ? 'inactive' : 'active' }); reload(); }}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
                        >
                          <Icon name={site.status === 'active' ? 'PauseCircle' : 'PlayCircle'} size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AcceptSiteModal open={showModal} onClose={() => { setShowModal(false); reload(); }} />
    </div>
  );
}