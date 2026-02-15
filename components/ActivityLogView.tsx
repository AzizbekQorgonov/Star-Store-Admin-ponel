import React from 'react';
import { Activity, Clock, ShieldCheck, AlertCircle, ShoppingBag, Tag, DollarSign, User, Filter, Search, Download } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ActivityLog } from '../types';

const ActivityLogView: React.FC = () => {
  // Mock logs for display - CLEARED
  const logs: ActivityLog[] = [];

  const getIcon = (iconType?: string) => {
      switch(iconType) {
          case 'box': return <ShoppingBag size={18} />;
          case 'tag': return <Tag size={18} />;
          case 'dollar': return <DollarSign size={18} />;
          case 'user': return <User size={18} />;
          case 'truck': return <Activity size={18} />;
          case 'lock': return <ShieldCheck size={18} />;
          default: return <Activity size={18} />;
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">Faoliyat Tarixi (Audit Log)</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Tizimdagi barcha muhim o'zgarishlar vaqt shkalasi</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm">
             <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
             <Download size={16} /> Eksport CSV
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-transparent dark:from-indigo-900 dark:via-slate-800 border-r border-dashed border-slate-300 dark:border-slate-700"></div>

        <div className="space-y-6">
            {logs.length > 0 ? logs.map((log, index) => (
                <div 
                    key={log.id} 
                    className="relative flex items-start gap-6 group"
                    style={{animationDelay: `${index * 100}ms`}}
                >
                    {/* Icon Bubble */}
                    <div className={`
                        relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-4 border-cream dark:border-slate-950 shadow-sm transition-transform group-hover:scale-110
                        ${log.status === 'failed' 
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' 
                            : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}
                    `}>
                        {log.status === 'failed' ? <AlertCircle size={20} /> : getIcon(log.icon)}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group-hover:border-indigo-100 dark:group-hover:border-indigo-900/30">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className={`font-semibold text-sm ${log.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                                    {log.action}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                    Target: <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{log.target}</span>
                                </p>
                            </div>
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-full">
                                <Clock size={12} /> {log.timestamp}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                             <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                                    {log.user.charAt(0)}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">User: {log.user}</span>
                             </div>
                             {log.status === 'success' && (
                                 <span className="text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full font-medium">Success</span>
                             )}
                             {log.status === 'failed' && (
                                 <span className="text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full font-medium">Failed</span>
                             )}
                        </div>
                    </div>
                </div>
            )) : (
              <div className="py-12 text-center text-slate-400 ml-10">
                 Hozircha faoliyat tarixi mavjud emas.
              </div>
            )}
        </div>
        
        <div className="mt-8 text-center">
            <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                Eski yozuvlarni yuklash...
            </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogView;