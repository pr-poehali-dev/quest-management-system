import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { createSite } from '@/lib/store';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'choose' | 'create' | 'key';

const INTEGRATION_TEMPLATE = (siteName: string, key: string) => `
=== ДАННЫЕ ИНТЕГРАЦИИ ДЛЯ "МАСТЕР ПУТЕЙ" ===
Платформа: Мастер путей (Master of Paths)
Сайт: ${siteName}
Ключ интеграции: ${key}
API-эндпоинт: wss://masterpaths.app/api/connect
Токен: Bearer ${key}

--- ИНСТРУКЦИЯ ДЛЯ ИИ-ГЕНЕРАТОРОВ ---
Создай сайт/приложение с следующими параметрами:

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
- React + TypeScript + Vite (обязательно)
- Tailwind CSS для стилизации
- Тёмная тема с синим и золотым цветами
- Адаптивный дизайн (mobile-first)

ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ:
1. Форма входа участников (email/телефон + пароль)
2. Список доступных Путей (квестов) для участника
3. Страница прохождения уровня с загадкой и полем ответа
4. Кнопка "Запросить доступ к Пути"
5. Кнопка "Сообщить" (для связи с администратором)
6. Кнопка оплаты: https://yoomoney.ru/to/410017253212598/0
7. Уникальная ссылка доступа к каждому квесту

ИНТЕГРАЦИЯ С ПЛАТФОРМОЙ:
- При входе использовать API: POST /api/auth с ключом интеграции: ${key}
- Все запросы содержать заголовок: X-Integration-Key: ${key}
- Сайт подключён к платформе "Мастер путей"
- Участники синхронизируются автоматически

СТИЛЬ И ДИЗАЙН:
- Шрифты: Cinzel (заголовки), Golos Text (текст)
- Цвета: тёмно-синий фон, золотые кнопки, фиолетовые акценты
- Кнопки стиль: золотой градиент с оттиском названий (Cinzel bold)
- Мистическая атмосфера, ощущение приключения

СКОПИРУЙ ЭТОТ ТЕКСТ ЦЕЛИКОМ И ВСТАВЬ В ЗАПРОС К ИИ-ГЕНЕРАТОРУ
Ключ интеграции: ${key}
=======================================
`.trim();

export default function AcceptSiteModal({ open, onClose }: Props) {
  const { currentUser, setCurrentSite, setActivePage } = useApp();
  const [mode, setMode] = useState<Mode>('choose');
  const [form, setForm] = useState({ name: '', description: '' });
  const [keyInput, setKeyInput] = useState('');
  const [createdSite, setCreatedSite] = useState<{ name: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('Введите название сайта'); return; }
    if (!currentUser) return;
    const site = createSite(form.name, form.description, currentUser.id);
    setCurrentSite(site);
    setCreatedSite({ name: site.name, key: site.integration_key });
    setMode('key');
  };

  const handleCopyIntegration = () => {
    if (!createdSite) return;
    const text = INTEGRATION_TEMPLATE(createdSite.name, createdSite.key);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    setMode('choose');
    setForm({ name: '', description: '' });
    setKeyInput('');
    setCreatedSite(null);
    setCopied(false);
    setError('');
    if (createdSite) setActivePage('sites');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative glass-card rounded-2xl w-full max-w-lg p-6 animate-scale-in">
        <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="X" size={20} />
        </button>

        {mode === 'choose' && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3 float">🌐</div>
              <h2 className="font-display text-xl gold-text mb-2">Принять дополнение</h2>
              <p className="text-sm text-muted-foreground">Добавьте новый сайт в платформу</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('create')}
                className="glass-card-violet rounded-xl p-5 text-left hover:border-violet/50 transition-all group"
              >
                <div className="text-3xl mb-3">✨</div>
                <h3 className="font-display text-sm mb-2 group-hover:text-primary transition-colors">Создать новый сайт</h3>
                <p className="text-xs text-muted-foreground">Задайте параметры и получите данные интеграции для ИИ-генератора</p>
              </button>
              <button
                onClick={() => setMode('key')}
                className="glass-card rounded-xl p-5 text-left hover:border-primary/30 transition-all group"
              >
                <div className="text-3xl mb-3">🔑</div>
                <h3 className="font-display text-sm mb-2 group-hover:text-primary transition-colors">Принять по ключу</h3>
                <p className="text-xs text-muted-foreground">Подключите уже созданный сайт по ключу интеграции</p>
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <>
            <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <Icon name="ArrowLeft" size={14} /> Назад
            </button>
            <h2 className="font-display text-xl gold-text mb-6">Создать новый сайт</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Название сайта *</label>
                <input
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                  placeholder="Мой квест-сайт"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Описание</label>
                <textarea
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
                  rows={3}
                  placeholder="Описание сайта..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-3">
                  <Icon name="AlertCircle" size={16} />
                  {error}
                </div>
              )}
              <button type="submit" className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2">
                <Icon name="Sparkles" size={18} />
                Создать и получить данные интеграции
              </button>
            </form>
          </>
        )}

        {mode === 'key' && createdSite && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full glass-card-violet flex items-center justify-center mx-auto mb-4 pulse-glow">
                <Icon name="CheckCircle" size={32} className="text-green-400" />
              </div>
              <h2 className="font-display text-xl gold-text mb-2">Сайт создан!</h2>
              <p className="text-sm text-muted-foreground">Скопируйте данные интеграции для ИИ-генератора</p>
            </div>

            <div className="bg-muted rounded-xl p-4 mb-4 max-h-40 overflow-y-auto scrollbar-thin">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                {INTEGRATION_TEMPLATE(createdSite.name, createdSite.key).slice(0, 400)}...
              </pre>
            </div>

            <button
              onClick={handleCopyIntegration}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-display text-sm font-semibold transition-all ${
                copied
                  ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                  : 'gold-btn'
              }`}
            >
              <Icon name={copied ? 'CheckCircle' : 'Copy'} size={18} />
              {copied ? 'Скопировано! Вставьте в запрос к ИИ' : 'Скопировать данные интеграции'}
            </button>

            {copied && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Вставьте в текст запроса вашему ИИ-генератору сайтов
              </p>
            )}

            <button onClick={handleClose} className="w-full py-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Перейти к управлению сайтом →
            </button>
          </>
        )}

        {mode === 'key' && !createdSite && (
          <>
            <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <Icon name="ArrowLeft" size={14} /> Назад
            </button>
            <h2 className="font-display text-xl gold-text mb-6">Принять по ключу</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Ключ интеграции</label>
                <input
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all font-mono"
                  placeholder="xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                />
              </div>
              <button className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2">
                <Icon name="Link" size={18} />
                Подключить сайт
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
