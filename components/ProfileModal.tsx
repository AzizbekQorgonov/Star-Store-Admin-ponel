import React, { useState } from 'react';
import { X, Shield, Mail, CheckCircle2, LogOut, Star, Settings, User as UserIcon, Edit2, Save } from 'lucide-react';
import { User } from '../types';
import { useStore } from '../context/StoreContext';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onSettingsClick: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onLogout, onSettingsClick }) => {
  const { updateUser } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Background with Logo */}
        <div className="h-36 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-visible flex items-start justify-center pt-6">
          {/* Background Decorative Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
             <Star size={140} className="text-white fill-white rotate-12" />
          </div>
          
          {/* Center Logo Text */}
          <div className="relative z-10 flex flex-col items-center text-white/95 animate-in slide-in-from-bottom-2 duration-700">
             <span className="font-bold tracking-[0.2em] text-xs opacity-80">STAR STORE ADMIN</span>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-20"
          >
            <X size={18} />
          </button>

          {/* Centered Avatar - Positioned absolutely relative to header but overlapping content */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20">
            <div className="p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-lg">
               <img 
                 src={user.avatar} 
                 alt={user.name} 
                 className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-inner object-cover" 
               />
               <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full" title="Online"></div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-12 relative mt-2">
          
          {/* User Info - Editable Form */}
          <div className="text-center mb-6">
            {!isEditing ? (
              <>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  {user.name}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
                  <Mail size={14} />
                  <span className="text-sm">{user.email}</span>
                </div>
                
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Edit2 size={12} /> Profilni tahrirlash
                </button>
              </>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <div>
                   <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1 text-left">F.I.SH</label>
                   <div className="relative">
                      <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      />
                   </div>
                </div>
                <div>
                   <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1 text-left">Email</label>
                   <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      />
                   </div>
                </div>
                <div className="flex gap-2 justify-center mt-2">
                   <button 
                     onClick={() => { setIsEditing(false); setFormData({name: user.name, email: user.email}); }}
                     className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                   >
                     Bekor qilish
                   </button>
                   <button 
                     onClick={handleSave}
                     className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center gap-1"
                   >
                     <Save size={12} /> Saqlash
                   </button>
                </div>
              </div>
            )}
            
            <div className="mt-3 flex justify-center">
              <div className={`
                px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1.5
                ${user.role === 'admin' 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'}
              `}>
                <Shield size={14} />
                <span className="capitalize">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Stats / Simple Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                <div className="font-semibold text-green-600">Active</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">ID Code</p>
                <div className="font-mono text-slate-700 dark:text-slate-300">
                  #{Math.floor(Math.random() * 9000) + 1000}
                </div>
              </div>
            </div>

            {/* Permissions / Access Level */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 justify-center">
                <CheckCircle2 size={16} className="text-slate-400" />
                Huquq va Darajalar
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <ul className="space-y-2">
                  {user.permissions?.slice(0, 3).map((perm, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      {perm}
                    </li>
                  ))}
                  {user.permissions && user.permissions.length > 3 && (
                     <li className="text-xs text-slate-400 pl-3.5 italic">+ yana {user.permissions.length - 3} ta huquq</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={onLogout}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium border border-transparent hover:border-red-200"
              >
                <LogOut size={18} />
                Chiqish
              </button>
              <button 
                onClick={() => {
                    onClose();
                    onSettingsClick();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium border border-transparent hover:border-slate-300"
              >
                <Settings size={18} />
                Sozlamalar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;