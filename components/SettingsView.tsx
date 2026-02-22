import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, Lock, Globe, Moon, Sun, Smartphone, Mail, Shield, Save, ChevronDown, Check, Coins } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import BlurImage from './BlurImage';
import { resolveImageUrl } from '../utils/image';

const SettingsView: React.FC = () => {
  const { user, darkMode, toggleDarkMode, addNotification, currency, setCurrency } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'appearance'>('profile');
  
  // Custom Select State for Language & Currency
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const LANGUAGES = [
      { code: 'uz', label: "O'zbek tili" },
      { code: 'ru', label: "Русский" },
      { code: 'en', label: "English" }
  ];

  const CURRENCIES = [
      { code: 'USD', label: "AQSh Dollari ($)", icon: '$' },
      { code: 'UZS', label: "O'zbek So'mi (UZS)", icon: 'S' },
      { code: 'EUR', label: "Yevro (€)", icon: '€' },
      { code: 'RUB', label: "Rubl (₽)", icon: '₽' },
  ];
  
  // Mock States for interactivity
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+998 90 123 45 67',
    language: 'uz',
    emailNotif: true,
    pushNotif: false,
    marketingNotif: true
  });

  const handleSave = () => {
    addNotification('success', 'Sozlamalar muvaffaqiyatli saqlandi!');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: <User size={18} /> },
    { id: 'appearance', label: 'Ko\'rinish', icon: <Sun size={18} /> },
    { id: 'notifications', label: 'Bildirishnoma', icon: <Bell size={18} /> },
    { id: 'security', label: 'Xavfsizlik', icon: <Lock size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary dark:text-white">Tizim Sozlamalari</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Profil va tizim parametrlarini boshqarish</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">Shaxsiy Ma'lumotlar</h3>
              
              <div className="flex items-center gap-6 mb-6">
                 <div className="relative group cursor-pointer">
                    <BlurImage src={resolveImageUrl(user?.avatar)} alt="Avatar" loading="lazy" decoding="async" className="w-24 h-24 rounded-full border-4 border-slate-50 dark:border-slate-800 object-cover" />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-white text-xs font-medium">O'zgartirish</span>
                    </div>
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{user?.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">To'liq ism</label>
                  <div className="relative">
                     <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                     />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email manzil</label>
                  <div className="relative">
                     <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                        type="email" 
                        value={formData.email}
                        readOnly
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                     />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Telefon raqam</label>
                  <div className="relative">
                     <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                     />
                  </div>
                </div>
                
                {/* Custom Language Select */}
                <div ref={langDropdownRef} className="relative z-20">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tizim Tili</label>
                  <div className="relative">
                     <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-300/40 via-violet-300/35 to-cyan-300/35 opacity-0 hover:opacity-100 focus-within:opacity-100 blur-[6px] transition-opacity duration-300 pointer-events-none"></div>
                     <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500/80 dark:text-indigo-300 z-10" />
                     <button
                        type="button"
                        onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                        className="relative w-full pl-10 pr-10 py-2.5 border border-white/70 dark:border-indigo-400/30 rounded-xl bg-white/45 dark:bg-slate-800/40 backdrop-blur-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/45 text-left flex justify-between items-center transition-all duration-300 hover:border-indigo-300/80 hover:shadow-[0_10px_24px_-16px_rgba(79,70,229,0.9)]"
                     >
                        {LANGUAGES.find(l => l.code === formData.language)?.label || formData.language}
                        <ChevronDown size={16} className={`text-indigo-500/80 dark:text-indigo-300 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                     </button>
                     
                     {isLangDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white/85 dark:bg-slate-800/92 backdrop-blur-xl border border-white/70 dark:border-indigo-400/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                           {LANGUAGES.map((lang) => (
                              <div 
                                 key={lang.code}
                                 onClick={() => {
                                    setFormData({...formData, language: lang.code});
                                    setIsLangDropdownOpen(false);
                                 }}
                                 className={`
                                    px-4 py-2.5 cursor-pointer text-sm transition-colors flex items-center justify-between
                                    ${formData.language === lang.code 
                                       ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200' 
                                       : 'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-700/60'}
                                 `}
                              >
                                 {lang.label}
                                 {formData.language === lang.code && <Check size={14} />}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                </div>

                {/* Custom Currency Select */}
                <div ref={currencyDropdownRef} className="relative z-10">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Asosiy Valyuta</label>
                  <div className="relative">
                     <Coins size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                     <button
                        type="button"
                        onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left flex justify-between items-center transition-colors hover:border-indigo-400"
                     >
                        {CURRENCIES.find(c => c.code === currency)?.label || currency}
                        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
                     </button>
                     
                     {isCurrencyDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                           {CURRENCIES.map((curr) => (
                              <div 
                                 key={curr.code}
                                 onClick={() => {
                                    setCurrency(curr.code);
                                    setIsCurrencyDropdownOpen(false);
                                    addNotification('info', `Valyuta o'zgartirildi: ${curr.code}`);
                                 }}
                                 className={`
                                    px-4 py-2.5 cursor-pointer text-sm transition-colors flex items-center justify-between
                                    ${currency === curr.code 
                                       ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                                       : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                 `}
                              >
                                 <span className="flex items-center gap-2">
                                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{curr.code}</span>
                                    {curr.label}
                                 </span>
                                 {currency === curr.code && <Check size={14} />}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* APPEARANCE SETTINGS */}
          {activeTab === 'appearance' && (
             <div className="space-y-6">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">Tizim Ko'rinishi</h3>
               
               <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-indigo-600 dark:text-indigo-400">
                        {darkMode ? <Moon size={24}/> : <Sun size={24}/>}
                     </div>
                     <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{darkMode ? 'Tungi Rejim' : 'Kunduzgi Rejim'}</h4>
                        <p className="text-sm text-slate-500">Tizim interfeysi ranglarini o'zgartirish</p>
                     </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer" />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
               </div>
             </div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === 'notifications' && (
             <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">Bildirishnomalar</h3>
                
                <div className="space-y-4">
                   {[
                      { id: 'emailNotif', label: 'Email xabarnomalar', desc: 'Yangi buyurtmalar va hisobotlarni email orqali olish' },
                      { id: 'pushNotif', label: 'Push xabarlar', desc: 'Brauzer orqali tezkor xabarlar olish' },
                      { id: 'marketingNotif', label: 'Marketing yangiliklari', desc: 'Yangi aksiyalar va tizim yangiliklari haqida' },
                   ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                         <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">{item.label}</h4>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                              type="checkbox" 
                              // @ts-ignore
                              checked={formData[item.id]} 
                              // @ts-ignore
                              onChange={(e) => setFormData({...formData, [item.id]: e.target.checked})}
                              className="sr-only peer" 
                           />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                         </label>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* SECURITY SETTINGS */}
          {activeTab === 'security' && (
             <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">Xavfsizlik</h3>
                
                <div className="space-y-4">
                   <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg flex gap-3">
                      <Shield className="text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                      <div>
                         <h4 className="font-bold text-yellow-800 dark:text-yellow-500">Parolni o'zgartirish</h4>
                         <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">Oxirgi marta 3 oy oldin o'zgartirilgan. Xavfsizlik uchun har 6 oyda yangilash tavsiya etiladi.</p>
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Joriy parol</label>
                      <input type="password" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Yangi parol</label>
                         <input type="password" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white" placeholder="Yangi parol" />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parolni tasdiqlash</label>
                         <input type="password" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white" placeholder="Qayta kiriting" />
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
             <button className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                Bekor qilish
             </button>
             <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
             >
                <Save size={18} />
                O'zgarishlarni Saqlash
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsView;
