import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { registerUser, createSession, loginUser, createJoinRequest, getSites, getAllUsers } from '@/lib/store';
import { saveSession } from '@/lib/db';
import type { Site } from '@/lib/db';

interface Props {
  inviteToken?: string;
}

type Mode = 'welcome' | 'login' | 'register' | 'registered';

export default function LandingPage({ inviteToken }: Props) {
  const { setCurrentUser, refreshUser, login } = useApp();
  const [mode, setMode] = useState<Mode>('welcome');
  const [site, setSite] = useState<Site | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loginForm, setLoginForm] = useState({ emailOrPhone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sites = getSites();
    if (sites.length > 0) setSite(sites[0]);
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Введите имя'); return; }
    if (!form.email && !form.phone) { setError('Укажите email или телефон'); return; }
    if (form.password !== form.confirm) { setError('Пароли не совпадают'); return; }
    if (form.password.length < 6) { setError('Минимум 6 символов'); return; }

    const existing = getAllUsers().find(u => (form.email && u.email === form.email) || (form.phone && u.phone === form.phone));
    if (existing) { setError('Пользователь с таким email или телефоном уже существует'); return; }

    setLoading(true);
    setTimeout(() => {
      const user = registerUser(form.name, form.email, form.phone, form.password);
      if (site) createJoinRequest(site.id, user.id);
      const token = createSession(user.id);
      saveSession(token, user);
      setCurrentUser(user);
      refreshUser();
      setMode('registered');
      setLoading(false);
    }, 600);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = login(loginForm.emailOrPhone, loginForm.password);
      if (!user) { setError('Неверный логин или пароль'); setLoading(false); return; }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen star-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg glass-card-violet flex items-center justify-center float">
            <span className="text-lg">🗝️</span>
          </div>
          <span className="font-display text-lg gold-text">Мастер путей</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 transition-colors">
            Войти
          </button>
          <button onClick={() => setMode('register')} className="gold-btn px-4 py-2 rounded-lg text-sm">
            Зарегистрироваться
          </button>
        </div>
      </header>

      {mode === 'welcome' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {/* Hero */}
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="text-8xl mb-8 float">🗺️</div>
            <h1 className="font-display text-5xl md:text-6xl gold-text mb-4 leading-tight">
              Мастер путей
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Платформа квестов и приключений
            </p>
            {site && (
              <p className="text-sm text-muted-foreground mb-8 px-4 py-2 rounded-full glass-card inline-block">
                📍 {site.name}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => setMode('register')}
                className="gold-btn px-10 py-4 rounded-xl text-lg flex items-center justify-center gap-3"
              >
                <Icon name="Sparkles" size={22} />
                Начать путь
              </button>
              <button
                onClick={() => setMode('login')}
                className="glass-card px-10 py-4 rounded-xl text-lg flex items-center justify-center gap-3 hover:border-primary/30 transition-all"
              >
                <Icon name="LogIn" size={22} />
                У меня есть аккаунт
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { emoji: '🧩', title: 'Загадки', desc: 'Текстовые, визуальные и звуковые головоломки' },
                { emoji: '🏆', title: 'Достижения', desc: 'Соревнуйтесь с другими участниками за очки' },
                { emoji: '🗺️', title: 'Пути', desc: 'Уникальные маршруты с уровнями и секретами' },
              ].map((f, i) => (
                <div key={i} className="glass-card rounded-xl p-5 text-left" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="text-3xl mb-3">{f.emoji}</div>
                  <h3 className="font-display text-sm mb-2 text-primary">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auth Forms */}
      {(mode === 'register' || mode === 'login') && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-fade-in">
            <button onClick={() => setMode('welcome')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <Icon name="ArrowLeft" size={14} /> На главную
            </button>

            <div className="glass-card rounded-2xl p-8">
              <h2 className="font-display text-xl gold-text mb-2 text-center">
                {mode === 'register' ? 'Регистрация' : 'Вход'}
              </h2>
              {site && <p className="text-sm text-muted-foreground text-center mb-6">{site.name}</p>}

              {mode === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  {[
                    { label: 'Имя *', key: 'name', type: 'text', placeholder: 'Ваше имя' },
                    { label: 'Email', key: 'email', type: 'email', placeholder: 'email@example.com' },
                    { label: 'Телефон', key: 'phone', type: 'tel', placeholder: '+7 900 000-00-00' },
                    { label: 'Пароль *', key: 'password', type: 'password', placeholder: 'Минимум 6 символов' },
                    { label: 'Повторите пароль *', key: 'confirm', type: 'password', placeholder: 'Повторите пароль' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-sm text-muted-foreground mb-1 block">{f.label}</label>
                      <input
                        type={f.type}
                        className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                        placeholder={f.placeholder}
                        value={form[f.key as keyof typeof form]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  {error && <p className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</p>}
                  <button type="submit" disabled={loading} className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="UserPlus" size={18} />}
                    {loading ? 'Регистрация...' : 'Зарегистрироваться и запросить доступ'}
                  </button>
                  <p className="text-xs text-center text-muted-foreground">
                    После регистрации заявка автоматически отправится владельцу платформы
                  </p>
                  <button type="button" onClick={() => setMode('login')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Уже есть аккаунт? Войти →
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Email или телефон</label>
                    <input
                      className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                      placeholder="email@example.com или +7..."
                      value={loginForm.emailOrPhone}
                      onChange={e => setLoginForm(f => ({ ...f, emailOrPhone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Пароль</label>
                    <input
                      type="password"
                      className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                      placeholder="Ваш пароль"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  {error && <p className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</p>}
                  <button type="submit" disabled={loading} className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="LogIn" size={18} />}
                    {loading ? 'Вход...' : 'Войти'}
                  </button>
                  <button type="button" onClick={() => setMode('register')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Нет аккаунта? Зарегистрироваться →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === 'registered' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md animate-scale-in">
            <div className="text-7xl mb-6 float">✨</div>
            <h2 className="font-display text-2xl gold-text mb-3">Добро пожаловать!</h2>
            <p className="text-muted-foreground mb-2">Вы успешно зарегистрированы.</p>
            <p className="text-sm text-muted-foreground mb-8">
              Заявка на участие отправлена. Как только владелец одобрит запрос — вам откроются доступные пути.
            </p>
            <div className="glass-card-violet rounded-xl p-5 text-left">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">Войдите в Личный кабинет чтобы увидеть статус заявки и доступные квесты после одобрения.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border/30 py-4 text-center">
        <p className="text-xs text-muted-foreground">Мастер путей · Платформа управления квестами</p>
      </footer>
    </div>
  );
}
