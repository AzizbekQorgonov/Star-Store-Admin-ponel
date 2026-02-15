import React, { useState, useEffect } from 'react';
import { Search, Command, ArrowRight, Moon, Sun, LogOut, LayoutDashboard, Box, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ViewType } from '../types';

interface CommandPaletteProps {
  setCurrentView: (view: ViewType) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ setCurrentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { toggleDarkMode, logout, darkMode } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const actions = [
    { 
      title: 'Dashboardga o\'tish', 
      icon: <LayoutDashboard size={18} />, 
      action: () => setCurrentView('dashboard'),
      shortcut: 'G D'
    },
    { 
      title: 'Mahsulotlar', 
      icon: <Box size={18} />, 
      action: () => setCurrentView('products'),
      shortcut: 'G P' 
    },
    { 
      title: 'Buyurtmalar', 
      icon: <ShoppingBag size={18} />, 
      action: () => setCurrentView('orders'),
      shortcut: 'G O' 
    },
    { 
      title: darkMode ? 'Kunduzgi rejim' : 'Tungi rejim', 
      icon: darkMode ? <Sun size={18} /> : <Moon size={18} />, 
      action: toggleDarkMode,
      shortcut: 'Cmd T'
    },
    { 
      title: 'Tizimdan chiqish', 
      icon: <LogOut size={18} />, 
      action: logout,
      shortcut: 'Cmd Q'
    },
  ];

  const filteredActions = actions.filter(action => 
    action.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buyruqni yozing yoki qidiring..." 
            className="flex-1 bg-transparent outline-none text-slate-800 dark:text-white placeholder:text-slate-400"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            <span className="text-xs">ESC</span>
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredActions.length > 0 ? (
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tavsiya etilgan</div>
              {filteredActions.map((item, index) => (
                <button 
                  key={index}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 group-hover:text-indigo-500">{item.icon}</span>
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-xs text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
             <div className="py-8 text-center text-slate-500">Hech narsa topilmadi</div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
           <span><Command size={10} className="inline mr-1"/>+ K</span>
           <span>Tanlash uchun ↵</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;