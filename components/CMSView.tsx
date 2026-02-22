import React, { useState } from 'react';
import { Image as ImageIcon, Save, Percent, Type, Plus, Trash2, Sparkles, Copy, Check, Megaphone, Calendar, Minus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Coupon } from '../types';
import BlurImage from './BlurImage';
import { resolveImageUrl } from '../utils/image';

const CMSView: React.FC = () => {
  const { addNotification, coupons, addCoupon, deleteCoupon } = useStore();

  // --- HERO SECTION STATE ---
  const [heroData, setHeroData] = useState({
    title: "Yozgi Kolleksiya 2024",
    subtitle: "Eng so'nggi urfdagi kiyimlar va aksessuarlar. 50% gacha chegirmalar.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80",
    buttonText: "Xarid qilish"
  });

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    description: '',
  });

  // --- ACTIONS ---

  const handleSaveHero = () => {
    addNotification('success', "Bosh sahifa (Hero) muvaffaqiyatli yangilandi!");
  };

  const handleAddCoupon = () => {
    if (!newCoupon.code || !newCoupon.discount) {
      addNotification('warning', "Kupon kodi va foizini kiriting!");
      return;
    }
    const newCouponId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Date.now().toString();
    const coupon: Coupon = {
      id: newCouponId,
      code: newCoupon.code.toUpperCase(),
      discount: Number(newCoupon.discount),
      description: newCoupon.description || "Maxsus taklif",
      status: 'active',
      color: 'from-emerald-400 to-teal-500' // Default new color
    };
    addCoupon(coupon);
    setNewCoupon({ code: '', discount: '', description: '' });
    addNotification('success', "Yangi kupon qo'shildi!");
  };

  const handleDeleteCoupon = (id: string) => {
    deleteCoupon(id);
    addNotification('info', "Kupon o'chirildi");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('success', "Nusxalandi!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Marketing Markazi
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Do'kon vizual ko'rinishi va sodiqlik dasturlarini boshqarish
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* --- LEFT: HERO EDITOR (GLASSMORPHISM) --- */}
        <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-colors">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="p-6 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center relative z-10">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                 <ImageIcon size={20} />
              </div>
              Hero Banner
            </h3>
            <button 
                onClick={handleSaveHero}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:scale-105 transition-transform active:scale-95 shadow-lg"
            >
              <Save size={18} /> Saqlash
            </button>
          </div>

          <div className="p-6 space-y-6 relative z-10">
            {/* Live Preview Card */}
            <div className="relative w-full h-48 rounded-2xl overflow-hidden group shadow-lg border border-slate-200 dark:border-slate-700">
               <BlurImage src={resolveImageUrl(heroData.image)} alt="Preview" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
               <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center px-8">
                  <h4 className="text-2xl font-bold text-white mb-2">{heroData.title}</h4>
                  <p className="text-white/80 text-sm max-w-[60%] line-clamp-2">{heroData.subtitle}</p>
                  <button className="mt-4 px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded w-fit">{heroData.buttonText}</button>
               </div>
               <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/20">
                  LIVE PREVIEW
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Sarlavha (H1)</label>
                  <input 
                    type="text" 
                    value={heroData.title}
                    onChange={(e) => setHeroData({...heroData, title: e.target.value})}
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
               </div>
               <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Qisqacha Tavsif</label>
                  <textarea 
                    value={heroData.subtitle}
                    onChange={(e) => setHeroData({...heroData, subtitle: e.target.value})}
                    rows={2}
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Tugma Matni</label>
                      <input 
                        type="text" 
                        value={heroData.buttonText}
                        onChange={(e) => setHeroData({...heroData, buttonText: e.target.value})}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                   </div>
                   <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Rasm URL</label>
                      <input 
                        type="text" 
                        value={heroData.image}
                        onChange={(e) => setHeroData({...heroData, image: e.target.value})}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                   </div>
               </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT: LUNAR REWARDS (ADVANCED & TRANSPARENT) --- */}
        <div className="space-y-6">
           
           {/* 1. Add New Coupon Card */}
           <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-xl bg-gradient-to-br from-white/80 to-indigo-50/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-xl">
              <div className="p-6 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                    <Sparkles size={20} />
                  </div>
                  Lunar Rewards
                </h3>
              </div>
              
              <div className="p-6">
                 <div className="flex flex-col gap-4">
                    {/* Visual Ticket Preview */}
                    <div className="relative h-28 w-full rounded-2xl overflow-hidden shadow-lg flex bg-slate-900 text-white">
                        {/* Left Side (Discount) */}
                        <div className="w-1/3 bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-2 relative border-r-2 border-dashed border-white/30">
                           <div className="absolute -top-3 -right-3 w-6 h-6 bg-white dark:bg-slate-800 rounded-full"></div>
                           <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white dark:bg-slate-800 rounded-full"></div>
                           <span className="text-3xl font-bold">{newCoupon.discount || '0'}%</span>
                           <span className="text-[10px] uppercase tracking-widest opacity-80">OFF</span>
                        </div>
                        {/* Right Side (Info) */}
                        <div className="flex-1 p-4 flex flex-col justify-center bg-slate-800 relative">
                            <h4 className="text-xl font-mono font-bold tracking-wider text-indigo-300">{newCoupon.code || 'CODE'}</h4>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{newCoupon.description || "Ta'rif kiritilmoqda..."}</p>
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                               <Calendar size={10} />
                               <span>Valid until: Forever</span>
                            </div>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                       <input 
                         type="text" 
                         placeholder="KOD (masalan: SALE50)"
                         value={newCoupon.code}
                         onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                         className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-purple-500 outline-none uppercase font-mono font-bold dark:text-white placeholder:font-sans placeholder:font-normal"
                       />
                       
                       {/* MODERN INNOVATIVE SPINBOX */}
                       <div className="relative group">
                          <input 
                            type="number" 
                            placeholder="Foiz (20)"
                            value={newCoupon.discount}
                            onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})}
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-purple-500 outline-none font-bold dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                          />
                          <span className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                          
                          {/* Custom Vertical Spin Buttons */}
                          <div className="absolute right-1 top-1 bottom-1 flex flex-col w-6 gap-0.5">
                             <button 
                                onClick={() => setNewCoupon(p => ({...p, discount: Math.min(100, Number(p.discount || 0) + 5).toString()}))}
                                className="flex-1 bg-white/50 dark:bg-slate-700/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-500 hover:text-purple-600 rounded-t-md transition-all flex items-center justify-center active:scale-95"
                             >
                                <Plus size={10} strokeWidth={3} />
                             </button>
                             <button 
                                onClick={() => setNewCoupon(p => ({...p, discount: Math.max(0, Number(p.discount || 0) - 5).toString()}))}
                                className="flex-1 bg-white/50 dark:bg-slate-700/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-500 hover:text-purple-600 rounded-b-md transition-all flex items-center justify-center active:scale-95"
                             >
                                <Minus size={10} strokeWidth={3} />
                             </button>
                          </div>
                       </div>
                    </div>
                    
                    <textarea 
                       placeholder="Kupon haqida ma'lumot (nimani yozsangiz shu chiqadi)"
                       value={newCoupon.description}
                       onChange={e => setNewCoupon({...newCoupon, description: e.target.value})}
                       rows={2}
                       className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-purple-500 outline-none text-sm dark:text-white resize-none"
                    />
                    
                    <button 
                       onClick={handleAddCoupon}
                       className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                       <Plus size={20} /> Kupon Yaratish
                    </button>
                 </div>
              </div>
           </div>

           {/* 2. Active Coupons List */}
           <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">Faol Kuponlar</h4>
              {coupons.map((coupon) => (
                <div key={coupon.id} className="group relative flex bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
                   {/* Left Color Strip */}
                   <div className={`w-2 bg-gradient-to-b ${coupon.color}`}></div>
                   
                   <div className="flex-1 p-4 flex justify-between items-center">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-lg text-slate-800 dark:text-white">{coupon.code}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${coupon.status === 'expired' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                               {coupon.status === 'expired' ? 'Expired' : `-${coupon.discount}%`}
                            </span>
                         </div>
                         <p className="text-sm text-slate-500 dark:text-slate-400">{coupon.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => copyToClipboard(coupon.code)}
                           className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Nusxalash"
                         >
                            <Copy size={18} />
                         </button>
                         <button 
                           onClick={() => handleDeleteCoupon(coupon.id)}
                           className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="O'chirish"
                         >
                            <Trash2 size={18} />
                         </button>
                      </div>
                   </div>
                </div>
              ))}
              
              {coupons.length === 0 && (
                 <div className="text-center py-8 text-slate-400 bg-white/30 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    Kuponlar mavjud emas
                 </div>
              )}
           </div>

        </div>
      </div>
    </div>
  );
};

export default CMSView;
