import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, Star, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';

type AuthMode = 'login' | 'changeLogin' | 'changePassword';

const LOGIN_KEY = 'admin_login';
const PASSWORD_KEY = 'admin_password';
const DEFAULT_LOGIN = 'admin';
const DEFAULT_PASSWORD = 'admin2009';

const readCredentials = () => {
  if (typeof window === 'undefined') {
    return { login: DEFAULT_LOGIN, password: DEFAULT_PASSWORD };
  }
  const storedLogin = localStorage.getItem(LOGIN_KEY) || DEFAULT_LOGIN;
  const storedPassword = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
  return { login: storedLogin, password: storedPassword };
};

const LoginView: React.FC = () => {
  const { login, addNotification } = useStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [oldLogin, setOldLogin] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const title = useMemo(() => {
    if (mode === 'changeLogin') return "Change login";
    if (mode === 'changePassword') return "Change password";
    return 'Tizimga kirish';
  }, [mode]);

  const resetChangeForms = () => {
    setOldLogin('');
    setOldPassword('');
    setNewLogin('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const backToLogin = () => {
    setMode('login');
    resetChangeForms();
  };

  const verifyOldCredentials = () => {
    const creds = readCredentials();
    return oldLogin === creds.login && oldPassword === creds.password;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = readCredentials();
    setLoading(true);
    setTimeout(() => {
      if (username === creds.login && password === creds.password) {
        login(username);
      } else {
        addNotification('error', "Login yoki parol noto'g'ri!");
      }
      setLoading(false);
    }, 500);
  };

  const handleChangeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldLogin || !oldPassword || !newLogin.trim()) {
      addNotification('warning', "Barcha maydonlarni to'ldiring");
      return;
    }
    if (!verifyOldCredentials()) {
      addNotification('error', "Oldingi login yoki parol noto'g'ri");
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOGIN_KEY, newLogin.trim());
    }
    addNotification('success', 'Login muvaffaqiyatli yangilandi');
    backToLogin();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldLogin || !oldPassword || !newPassword || !confirmPassword) {
      addNotification('warning', "Barcha maydonlarni to'ldiring");
      return;
    }
    if (!verifyOldCredentials()) {
      addNotification('error', "Oldingi login yoki parol noto'g'ri");
      return;
    }
    if (newPassword.length < 6) {
      addNotification('warning', "Yangi parol kamida 6 belgidan iborat bo'lsin");
      return;
    }
    if (newPassword !== confirmPassword) {
      addNotification('error', 'Yangi parollar mos emas');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(PASSWORD_KEY, newPassword);
    }
    addNotification('success', 'Parol muvaffaqiyatli yangilandi');
    backToLogin();
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-500">
      <div className="mb-8 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-secondary blur-xl opacity-30 rounded-full animate-pulse"></div>
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
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="p-8 animate-in zoom-in-95 duration-500">
          {mode !== 'login' && (
            <button
              onClick={backToLogin}
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">{title}</h2>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Login</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    placeholder="admin"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 active:scale-95"
              >
                Kirish <ArrowRight size={18} />
              </button>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setMode('changeLogin')}
                  className="text-indigo-600 hover:underline"
                >
                  Change login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('changePassword')}
                  className="text-indigo-600 hover:underline"
                >
                  Change password
                </button>
              </div>
            </form>
          )}

          {mode === 'changeLogin' && (
            <form onSubmit={handleChangeLogin} className="space-y-4">
              <input
                type="text"
                value={oldLogin}
                onChange={(e) => setOldLogin(e.target.value)}
                placeholder="Old login"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <input
                type="text"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
                placeholder="New login"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
                Save login
              </button>
            </form>
          )}

          {mode === 'changePassword' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="text"
                value={oldLogin}
                onChange={(e) => setOldLogin(e.target.value)}
                placeholder="Old login"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
                Save password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;

