import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const LoginView: React.FC = () => {
  const { login, addNotification } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Email va parolni to'ldiring.");
      return;
    }

    setError('');
    setLoading(true);
    const result = await login(normalizedEmail, password);
    setLoading(false);

    if (!result.success) {
      const message = result.error || "Login yoki parol noto'g'ri.";
      setError(message);
      addNotification('error', message);
      return;
    }

    addNotification('success', `Xush kelibsiz, ${result.user?.name || 'Admin'}!`);
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-500">
      <div className="mb-8 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-secondary blur-xl opacity-30 rounded-full animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
            <Star className="text-white fill-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          STAR STORE <span className="text-indigo-600">ADMIN</span>
        </h1>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-all duration-300">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="p-8 animate-in zoom-in-95 duration-500">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">Admin tizimiga kirish</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="admin@starstore.uz"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Parol</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="********"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Kirish <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
