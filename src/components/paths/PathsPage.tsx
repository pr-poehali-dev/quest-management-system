import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { getPaths, createPath, updatePath, getLevels, createLevel, updateLevel, deleteLevel } from '@/lib/store';
import type { Path, Level, RiddleType } from '@/lib/db';

export default function PathsPage() {
  const { currentSite, isEditor } = useApp();
  const [paths, setPaths] = useState<Path[]>([]);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [showNewPath, setShowNewPath] = useState(false);
  const [showNewLevel, setShowNewLevel] = useState(false);
  const [pathForm, setPathForm] = useState({ title: '', description: '' });
  const [levelForm, setLevelForm] = useState({ title: '', riddleContent: '', answer: '', hint: '', riddleType: 'text' as RiddleType });
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [editLevelForm, setEditLevelForm] = useState({ title: '', riddleContent: '', answer: '', hint: '', riddleType: 'text' as RiddleType });

  const reload = () => {
    if (!currentSite) return;
    const p = getPaths(currentSite.id);
    setPaths(p);
    if (selectedPath) {
      setLevels(getLevels(selectedPath.id));
    }
  };

  useEffect(() => { reload(); }, [currentSite, selectedPath?.id]);

  const handleSelectPath = (path: Path) => {
    setSelectedPath(path);
    setLevels(getLevels(path.id));
    setShowNewLevel(false);
  };

  const handleCreatePath = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSite || !pathForm.title) return;
    const p = createPath(currentSite.id, pathForm.title, pathForm.description);
    setPaths(prev => [...prev, p]);
    setPathForm({ title: '', description: '' });
    setShowNewPath(false);
    setSelectedPath(p);
    setLevels([]);
  };

  const handleCreateLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPath || !levelForm.title || !levelForm.answer) return;
    const l = createLevel(selectedPath.id, levelForm.title, levelForm.riddleContent, levelForm.answer, levelForm.hint, levelForm.riddleType);
    setLevels(prev => [...prev, l]);
    setLevelForm({ title: '', riddleContent: '', answer: '', hint: '', riddleType: 'text' });
    setShowNewLevel(false);
  };

  const handleEditLevel = (level: Level) => {
    setEditingLevel(level);
    setEditLevelForm({ title: level.title, riddleContent: level.riddle_content || '', answer: level.answer, hint: level.hint || '', riddleType: level.riddle_type });
  };

  const handleSaveLevel = () => {
    if (!editingLevel) return;
    updateLevel(editingLevel.id, { title: editLevelForm.title, riddle_content: editLevelForm.riddleContent, answer: editLevelForm.answer, hint: editLevelForm.hint, riddle_type: editLevelForm.riddleType });
    if (selectedPath) setLevels(getLevels(selectedPath.id));
    setEditingLevel(null);
  };

  const handleDeleteLevel = (id: string) => {
    deleteLevel(id);
    setLevels(prev => prev.filter(l => l.id !== id));
  };

  const RIDDLE_TYPES: { value: RiddleType; label: string; icon: string }[] = [
    { value: 'text', label: 'Текст', icon: 'FileText' },
    { value: 'image', label: 'Картинка', icon: 'Image' },
    { value: 'video', label: 'Видео', icon: 'Video' },
    { value: 'audio', label: 'Аудио', icon: 'Music' },
  ];

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
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Paths List */}
      <div className="w-72 border-r border-border flex flex-col bg-sidebar">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-sm gold-text mb-3">Пути · {currentSite.name}</h2>
          {isEditor && (
            <button onClick={() => setShowNewPath(true)} className="gold-btn w-full py-2 rounded-lg text-sm flex items-center justify-center gap-2">
              <Icon name="Plus" size={14} />
              Новый путь
            </button>
          )}
        </div>

        {showNewPath && (
          <form onSubmit={handleCreatePath} className="p-4 border-b border-border bg-muted/30 space-y-2">
            <input
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              placeholder="Название пути"
              value={pathForm.title}
              onChange={e => setPathForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
            <textarea
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
              rows={2}
              placeholder="Описание..."
              value={pathForm.description}
              onChange={e => setPathForm(f => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <button type="submit" className="gold-btn flex-1 py-1.5 rounded text-xs">Создать</button>
              <button type="button" onClick={() => setShowNewPath(false)} className="flex-1 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground glass-card transition-colors">Отмена</button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {paths.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="text-3xl mb-2">🗺️</div>
              Нет путей. Создайте первый!
            </div>
          ) : (
            paths.map(path => (
              <button
                key={path.id}
                onClick={() => handleSelectPath(path)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                  selectedPath?.id === path.id
                    ? 'bg-primary/10 border-l-2 border-primary text-primary'
                    : 'text-foreground hover:bg-muted/40 border-l-2 border-transparent'
                }`}
              >
                <Icon name="Map" size={16} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{path.title}</p>
                  <p className="text-xs text-muted-foreground">{getLevels(path.id).length} уровней</p>
                </div>
                <div className="ml-auto">
                  <span className={`w-2 h-2 rounded-full inline-block ${path.is_active ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Levels Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedPath ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="text-6xl mb-4 float">🗝️</div>
              <h3 className="font-display text-xl text-muted-foreground mb-2">Выберите путь</h3>
              <p className="text-sm text-muted-foreground">Нажмите на путь слева для редактирования уровней</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg gold-text">{selectedPath.title}</h2>
                {selectedPath.description && <p className="text-sm text-muted-foreground">{selectedPath.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { updatePath(selectedPath.id, { is_active: !selectedPath.is_active }); reload(); setSelectedPath({ ...selectedPath, is_active: !selectedPath.is_active }); }}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${selectedPath.is_active ? 'bg-green-400/10 text-green-400 hover:bg-red-400/10 hover:text-red-400' : 'bg-muted text-muted-foreground hover:bg-green-400/10 hover:text-green-400'}`}
                >
                  {selectedPath.is_active ? 'Активен' : 'Неактивен'}
                </button>
                {isEditor && (
                  <button onClick={() => setShowNewLevel(true)} className="gold-btn px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Icon name="Plus" size={14} />
                    Новый уровень
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
              {showNewLevel && (
                <form onSubmit={handleCreateLevel} className="glass-card-violet rounded-xl p-5 animate-scale-in">
                  <h3 className="font-display text-sm gold-text mb-4">Новый уровень</h3>
                  <div className="space-y-3">
                    <input
                      className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      placeholder="Название уровня"
                      value={levelForm.title}
                      onChange={e => setLevelForm(f => ({ ...f, title: e.target.value }))}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      {RIDDLE_TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setLevelForm(f => ({ ...f, riddleType: t.value }))}
                          className={`flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all ${levelForm.riddleType === t.value ? 'gold-btn' : 'glass-card text-muted-foreground hover:text-foreground'}`}
                        >
                          <Icon name={t.icon} size={12} /> {t.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                      rows={3}
                      placeholder="Текст загадки..."
                      value={levelForm.riddleContent}
                      onChange={e => setLevelForm(f => ({ ...f, riddleContent: e.target.value }))}
                    />
                    <input
                      className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      placeholder="Правильный ответ *"
                      value={levelForm.answer}
                      onChange={e => setLevelForm(f => ({ ...f, answer: e.target.value }))}
                    />
                    <input
                      className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      placeholder="Подсказка (опционально, -10 баллов)"
                      value={levelForm.hint}
                      onChange={e => setLevelForm(f => ({ ...f, hint: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="gold-btn flex-1 py-2 rounded-lg text-sm">Создать уровень</button>
                      <button type="button" onClick={() => setShowNewLevel(false)} className="flex-1 py-2 rounded-lg text-sm glass-card text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
                    </div>
                  </div>
                </form>
              )}

              {levels.length === 0 && !showNewLevel ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🧩</div>
                  <p className="text-muted-foreground">Нет уровней. Добавьте первую загадку!</p>
                </div>
              ) : (
                levels.map((level, idx) => (
                  <div key={level.id} className="glass-card rounded-xl p-5 animate-fade-in">
                    {editingLevel?.id === level.id ? (
                      <div className="space-y-3">
                        <input className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" value={editLevelForm.title} onChange={e => setEditLevelForm(f => ({ ...f, title: e.target.value }))} />
                        <div className="flex gap-2">
                          {RIDDLE_TYPES.map(t => (
                            <button key={t.value} type="button" onClick={() => setEditLevelForm(f => ({ ...f, riddleType: t.value }))} className={`flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all ${editLevelForm.riddleType === t.value ? 'gold-btn' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                              <Icon name={t.icon} size={12} /> {t.label}
                            </button>
                          ))}
                        </div>
                        <textarea className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none" rows={3} value={editLevelForm.riddleContent} onChange={e => setEditLevelForm(f => ({ ...f, riddleContent: e.target.value }))} />
                        <input className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="Правильный ответ" value={editLevelForm.answer} onChange={e => setEditLevelForm(f => ({ ...f, answer: e.target.value }))} />
                        <input className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="Подсказка" value={editLevelForm.hint} onChange={e => setEditLevelForm(f => ({ ...f, hint: e.target.value }))} />
                        <div className="flex gap-2">
                          <button onClick={handleSaveLevel} className="gold-btn flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1"><Icon name="Save" size={14} /> Сохранить</button>
                          <button onClick={() => setEditingLevel(null)} className="flex-1 py-2 rounded-lg text-sm glass-card text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 font-display text-sm text-primary">{idx + 1}</div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm mb-1">{level.title}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              {RIDDLE_TYPES.find(t => t.value === level.riddle_type) && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground flex items-center gap-1">
                                  <Icon name={RIDDLE_TYPES.find(t => t.value === level.riddle_type)!.icon} size={10} />
                                  {RIDDLE_TYPES.find(t => t.value === level.riddle_type)!.label}
                                </span>
                              )}
                              {level.hint && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">Подсказка -{level.hint_penalty}б</span>}
                            </div>
                            {level.riddle_content && <p className="text-xs text-muted-foreground line-clamp-2">{level.riddle_content}</p>}
                            <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><Icon name="Key" size={10} /> Ответ: {level.answer}</p>
                          </div>
                        </div>
                        {isEditor && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleEditLevel(level)} className="text-muted-foreground hover:text-foreground transition-colors p-1"><Icon name="Edit2" size={14} /></button>
                            <button onClick={() => handleDeleteLevel(level.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Icon name="Trash2" size={14} /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
