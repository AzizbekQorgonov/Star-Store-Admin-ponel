import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Box,
  Layers,
  Megaphone,
  Wallet,
  Star,
  Sparkles,
  Moon,
  Sun,
  Activity,
  LayoutGrid
} from 'lucide-react';
import { ViewType } from '../types';
import { useStore } from '../context/StoreContext';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { isSidebarOpen, setSidebarOpen, darkMode, toggleDarkMode, logout } = useStore();

  const menuItems: { id: ViewType; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'products', icon: <Box size={20} />, label: 'Mahsulotlar' },
    { id: 'orders', icon: <ShoppingBag size={20} />, label: 'Buyurtmalar' },
    { id: 'customers', icon: <Users size={20} />, label: 'Mijozlar' },
    { id: 'finance', icon: <Wallet size={20} />, label: 'Moliya' },
    { id: 'categories', icon: <Layers size={20} />, label: 'Kategoriyalar' },
    { id: 'marketing', icon: <Megaphone size={20} />, label: 'Marketing & Hero' },
    { id: 'site-builder', icon: <LayoutGrid size={20} />, label: 'Pages Manager' },
    { id: 'activity', icon: <Activity size={20} />, label: 'Faoliyat Tarixi' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Sozlamalar' },
  ];

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-primary dark:bg-slate-900 text-white shadow-xl transition-transform duration-300 ease-in-out border-r border-transparent dark:border-slate-800
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="p-6 border-b border-white/10 flex flex-col items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors group"
          >
            <div className="relative w-14 h-14 transition-all duration-300 group-hover:scale-[1.06] group-active:scale-95">
              <span className="absolute inset-0 rounded-full border border-violet-300/55"></span>
              <span className="absolute inset-[4px] rounded-full border border-violet-300/35"></span>
              <span className="absolute inset-[8px] rounded-full border border-violet-300/25"></span>
              <span className="absolute -inset-2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.25),rgba(139,92,246,0.02)_72%)] opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></span>
              <div className="relative w-full h-full flex items-center justify-center">
                <Star className="w-7 h-7 text-violet-300 fill-violet-300 transition-transform duration-500 group-hover:rotate-[12deg]" />
                <Sparkles className="absolute right-[7px] top-[8px] w-3 h-3 text-indigo-200 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
              </div>
            </div>
            <div className="text-center">
              <h1
                className="text-[24px] font-semibold tracking-[0.28em] text-violet-100 group-hover:text-white transition-colors uppercase"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                STAR STORE
              </h1>
              <p className="text-xs text-slate-300/90 mt-1 tracking-[0.1em]">New fashion for you</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left duration-200
                      ${currentView === item.id
                        ? 'bg-secondary/20 hover:bg-secondary/30 text-white font-medium border border-white/10 shadow-sm backdrop-blur-md'
                        : 'text-slate-400 hover:bg-secondary/10 hover:text-white border border-transparent'}
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-secondary/10 rounded-xl transition-colors border border-transparent hover:border-white/5"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? 'Kunduzgi rejim' : 'Tungi rejim'}</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-secondary/10 rounded-xl transition-colors border border-transparent hover:border-white/5"
            >
              <LogOut size={20} />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
