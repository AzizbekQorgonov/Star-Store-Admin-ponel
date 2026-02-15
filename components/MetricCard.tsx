import React from 'react';
import { MetricCardProps } from '../types';

const MetricCard: React.FC<MetricCardProps> = ({ category, title, description, value, icon, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border-l-4 border-indigo-900 dark:border-indigo-500 hover:translate-y-[-2px] transition-transform duration-200 border-y border-r border-y-slate-100 border-r-slate-100 dark:border-y-slate-800 dark:border-r-slate-800 ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/50 px-2 py-1 rounded">
          {category}
        </span>
        {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
      </div>
      <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h4>
      <div className="mt-2">
        <span className="text-xl font-bold text-slate-800 dark:text-white">{value}</span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
    </div>
  );
};

export default MetricCard;