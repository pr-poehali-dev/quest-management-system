import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { registerUser, createSession } from '@/lib/store';
import { saveSession } from '@/lib/db';
import { useApp } from '@/lib/context';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { login, setCurrentUser, refreshUser } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', emailOrPhone: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.emailOrPhone || !form.password) { setError('Заполните все поля'); return; }
    setLoading(true);
    setTimeout(() => {
      const user = login(form.emailOrPhone, form.password);
      if (!user) { setError('Неверный логин или пароль'); setLoading(false); return; }
      setLoading(false);
    }, 400);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Укажите имя'); return; }
    if (!form.email && !form.phone) { setError('Укажите email или телефон'); return; }
    if (form.password !== form.confirm) { setError('Пароли не совпадают'); return; }
    if (form.password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true);
    setTimeout(() => {
      const user = registerUser(form.name, form.email, form.phone, form.password);
      const token = createSession(user.id);
      saveSession(token, user);
      setCurrentUser(user);
      refreshUser();
      setSuccess('Аккаунт создан! Войдите в систему.');
      setLoading(false);
      setMode('login');
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 star-bg">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-card-violet mb-4 float">
            <span className="text-4xl">🗺️</span>
          </div>
          <h1 className="font-display text-3xl gold-text mb-2">Мастер путей</h1>
          <p className="text-muted-foreground text-sm">Платформа управления квестами</p>
        </div>

        {/* Tabs */}
        <div className="glass-card rounded-2xl p-1 flex mb-2">
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-display transition-all ${mode === m ? 'gold-btn' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {m === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8">
          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 rounded-lg px-4 py-3 mb-4">
              <Icon name="CheckCircle" size={16} />
              {success}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Email или телефон</label>
                <input
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="email@example.com или +7..."
                  value={form.emailOrPhone}
                  onChange={e => setForm(f => ({ ...f, emailOrPhone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Пароль</label>
                <input
                  type="password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ваш пароль"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-3">
                  <Icon name="AlertCircle" size={16} />
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="LogIn" size={18} />}
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Имя *</label>
                <input
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ваше имя"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Телефон</label>
                <input
                  type="tel"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="+7 900 000-00-00"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Пароль *</label>
                <input
                  type="password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Минимум 6 символов"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Подтвердите пароль *</label>
                <input
                  type="password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Повторите пароль"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-3">
                  <Icon name="AlertCircle" size={16} />
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="UserPlus" size={18} />}
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
