import React, { useState, useRef, useEffect } from 'react';
import { Menu, Star, Search, Bell, X, Check, ShoppingBag, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { StoreProvider, useStore } from './context/StoreContext';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import OrdersView from './components/OrdersView';
import CategoriesView from './components/CategoriesView';
import CMSView from './components/CMSView';
import CustomersView from './components/CustomersView';
import FinanceView from './components/FinanceView';
import ActivityLogView from './components/ActivityLogView';
import SettingsView from './components/SettingsView'; // Import SettingsView
import SiteBuilderView from './components/SiteBuilderView';
import AIAssistant from './components/AIAssistant';
import LoginView from './components/LoginView';
import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/ToastContainer';
import ProfileModal from './components/ProfileModal'; 
import GlobalLoading from './components/GlobalLoading';
import BlurImage from './components/BlurImage';
import { ViewType, Notification } from './types';
import { resolveImageUrl } from './utils/image';

// Main App Content wrapped in Auth logic
const AppContent: React.FC = () => {
  const { user, isLoading, setSidebarOpen, logout, setFocusedOrderId, inbox, markAsRead, markAllAsRead, clearInbox } = useStore();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [routeLoading, setRouteLoading] = useState(false);
  const routeTimerRef = useRef<number | null>(null);
  const firstViewRef = useRef(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Notification State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (firstViewRef.current) {
      firstViewRef.current = false;
      return;
    }
    setRouteLoading(true);
    if (routeTimerRef.current) window.clearTimeout(routeTimerRef.current);
    routeTimerRef.current = window.setTimeout(() => {
      setRouteLoading(false);
      routeTimerRef.current = null;
    }, 260);
  }, [currentView]);

  useEffect(() => {
    return () => {
      if (routeTimerRef.current) {
        window.clearTimeout(routeTimerRef.current);
      }
    };
  }, []);
  
  // Handle Notification Click - Navigation Logic
  const handleNotificationClick = (notification: Notification) => {
    // 1. Mark as read
    markAsRead(notification.id);
    
    // 2. Navigate if target exists
    if (notification.targetView) {
      setCurrentView(notification.targetView);
      
      // 3. Special handling for Orders to open Modal
      if (notification.targetView === 'orders' && notification.targetId) {
        setFocusedOrderId(notification.targetId);
      }
    }
    
    // 4. Close dropdown
    setIsNotifOpen(false);
  };

  const unreadCount = inbox.filter(n => !n.read).length;

  if (!user) {
    return (
      <>
        <ToastContainer />
        <LoginView />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView setCurrentView={setCurrentView} />;
      case 'products': return <ProductsView />;
      case 'orders': return <OrdersView />;
      case 'categories': return <CategoriesView />;
      case 'marketing': return <CMSView />;
      case 'customers': return <CustomersView />;
      case 'finance': return <FinanceView />;
      case 'activity': return <ActivityLogView />;
      case 'settings': return <SettingsView />; // Connected SettingsView
      case 'site-builder': return <SiteBuilderView />;
      default: return <DashboardView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative transition-colors duration-300 overflow-x-hidden">
      <GlobalLoading visible={isLoading || routeLoading} />
      {/* Utilities */}
      <CommandPalette setCurrentView={setCurrentView} />
      <ToastContainer />
      <AIAssistant />
      
      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal 
          user={user} 
          onClose={() => setIsProfileOpen(false)} 
          onLogout={logout} 
          onSettingsClick={() => {
             setCurrentView('settings');
             setIsProfileOpen(false);
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300 max-w-full">
        
        {/* Mobile Header (Sticky) */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 p-4 border-b border-slate-200 dark:border-slate-800 lg:hidden flex items-center justify-between transition-colors">
          <div 
            className="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
            onClick={() => setCurrentView('dashboard')}
          >
             <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center border border-secondary">
               <Star className="text-secondary fill-secondary" size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-primary dark:text-white tracking-widest leading-none">STAR STORE</span>
              <span className="text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">New fashion</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
          >
            <Menu size={24} />
          </button>
        </header>
        
        {/* Desktop Header / Toolbar (Sticky & Glassmorphism) */}
        <div className="hidden lg:flex justify-between items-center px-8 py-4 sticky top-0 z-30 bg-cream/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-colors">
           <div className="flex items-center gap-2 text-slate-400 text-sm">
              <button 
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', metaKey: true}))}
                className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 dark:bg-white/5 dark:hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200 shadow-sm backdrop-blur-sm text-slate-600 dark:text-slate-300"
              >
                <Search size={14} />
                <span>Qidirish...</span>
                <span className="text-xs bg-white/20 px-1.5 rounded border border-white/10">Ctrl K</span>
              </button>
           </div>
           
           <div className="flex items-center gap-4">
              {/* Notification Center */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 text-slate-600 dark:text-slate-300 bg-secondary/20 hover:bg-secondary/30 border border-white/10 rounded-xl transition-all relative shadow-sm backdrop-blur-sm"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 dark:border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                     <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="font-semibold text-slate-800 dark:text-white">Bildirishnomalar</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                            Hammasini o'qilgan qilish
                          </button>
                        )}
                     </div>
                     <div className="max-h-[320px] overflow-y-auto">
                        {inbox.length > 0 ? (
                          inbox.map(item => (
                            <div 
                              key={item.id} 
                              onClick={() => handleNotificationClick(item)}
                              className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors relative ${!item.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                            >
                               <div className="flex gap-3">
                                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    item.type === 'order' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                    item.type === 'alert' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                     {item.type === 'order' ? <ShoppingBag size={14} /> : item.type === 'alert' ? <AlertTriangle size={14} /> : <Info size={14} />}
                                  </div>
                                  <div>
                                     <h4 className={`text-sm ${!item.read ? 'font-bold text-slate-800 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{item.title}</h4>
                                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{item.message}</p>
                                     <p className="text-[10px] text-slate-400 mt-2">{item.time}</p>
                                  </div>
                                  {!item.read && <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full"></div>}
                               </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-500">
                             Yangi xabarlar yo'q
                          </div>
                        )}
                     </div>
                     <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-center flex justify-center">
                        <button 
                           onClick={clearInbox}
                           className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                           <Trash2 size={12} /> Tarixni tozalash
                        </button>
                     </div>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

               {/* Clickable Profile Section */}
               <div 
                 className="flex items-center gap-4 cursor-pointer p-2 rounded-lg bg-secondary/5 hover:bg-secondary/20 border border-transparent hover:border-white/10 transition-all backdrop-blur-sm"
                 onClick={() => setIsProfileOpen(true)}
                 title="Profilni ko'rish"
               >
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase flex items-center justify-end gap-1">
                      {user.role}
                      <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                    </p>
                  </div>
                  <BlurImage src={resolveImageUrl(user.avatar)} alt="User" loading="lazy" decoding="async" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
               </div>
           </div>
        </div>

        {/* Dynamic View Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

// Root App wraps provider
const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;

