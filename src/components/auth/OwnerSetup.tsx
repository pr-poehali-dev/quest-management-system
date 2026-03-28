import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { registerOwner, createSession } from '@/lib/store';
import { saveSession } from '@/lib/db';
import { useApp } from '@/lib/context';

export default function OwnerSetup() {
  const { setCurrentUser, refreshUser } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (step === 1) { setStep(2); return; }
    if (form.password !== form.confirm) { setError('Пароли не совпадают'); return; }
    if (form.password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    if (!form.name || (!form.email && !form.phone)) { setError('Заполните имя и email или телефон'); return; }
    setLoading(true);
    setTimeout(() => {
      const user = registerOwner(form.name, form.email, form.phone, form.password);
      const token = createSession(user.id);
      saveSession(token, user);
      setCurrentUser(user);
      refreshUser();
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 star-bg">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-card-violet mb-4 float">
            <span className="text-4xl">🗝️</span>
          </div>
          <h1 className="font-display text-3xl gold-text mb-2">Мастер путей</h1>
          <p className="text-muted-foreground text-sm">Первый запуск · Регистрация Владельца</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`flex items-center gap-2 ${s < step ? 'text-primary' : s === step ? 'text-foreground' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-display ${s < step ? 'gold-btn' : s === step ? 'glass-card border border-primary' : 'glass-card'}`}>
                {s < step ? '✓' : s}
              </div>
              {s < 2 && <div className={`w-16 h-px ${s < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-display text-xl mb-1 text-center">
            {step === 1 ? 'Личные данные' : 'Безопасность'}
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            {step === 1 ? 'Введите ваше имя и контактные данные' : 'Создайте надёжный пароль'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Ваше имя *</label>
                  <input
                    className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Иван Петров"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                  <input
                    type="email"
                    className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="owner@example.com"
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
                <p className="text-xs text-muted-foreground">Укажите хотя бы email или телефон</p>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Пароль *</label>
                  <input
                    type="password"
                    className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Минимум 6 символов"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
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
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-3">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name={step === 1 ? 'ArrowRight' : 'Crown'} size={18} />
              )}
              {step === 1 ? 'Далее' : loading ? 'Создание...' : 'Создать аккаунт Владельца'}
            </button>

            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="w-full py-2 text-muted-foreground text-sm hover:text-foreground transition-colors">
                ← Назад
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Мастер путей · Платформа управления квестами
        </p>
      </div>
    </div>
  );
}
