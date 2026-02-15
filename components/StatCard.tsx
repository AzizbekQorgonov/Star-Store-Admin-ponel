import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendDirection, icon, colorClass, onClick }) => {
  
  // 1. Analyze if the value is effectively Zero
  const isZero = useMemo(() => {
    // Remove currency symbols, commas, spaces to check the raw number
    const cleanValue = value.replace(/[^0-9.-]+/g, "");
    const num = parseFloat(cleanValue);
    return isNaN(num) || num === 0;
  }, [value]);

  // -- LIVE CHART LOGIC --
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const chartHeight = 80;
  const chartWidth = 300;

  // Initialize data based on isZero state
  useEffect(() => {
    // If zero, fill with low numbers (flat line). If not, random active numbers.
    const initialData = Array.from({ length: 12 }, () => isZero ? Math.random() * 5 : Math.floor(Math.random() * 50) + 20);
    setDataPoints(initialData);
  }, [isZero]);

  // Update loop for "Live" effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => {
        if (prev.length === 0) {
          return Array.from({ length: 12 }, () => (isZero ? Math.random() * 5 : Math.floor(Math.random() * 50) + 20));
        }
        const newData = [...prev.slice(1)]; // Remove first
        
        let nextVal;
        
        if (isZero) {
           // If value is 0, keep line flat at the bottom (0 to 5 range)
           nextVal = Math.random() * 5;
        } else {
           // If active, generate random movement (Random Walk)
           const lastVal = prev[prev.length - 1];
           nextVal = lastVal + (Math.random() * 20 - 10);
           // Clamp values to keep inside graph visually
           nextVal = Math.max(10, Math.min(90, nextVal));
        }

        newData.push(nextVal);
        return newData;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isZero]);

  // Convert data points to SVG Path "M x y L x y ..."
  const generatePath = (data: number[]) => {
    if (data.length === 0) return "";
    
    const stepX = chartWidth / (data.length - 1);
    
    // First point
    let path = `M 0 ${chartHeight - data[0]}`;
    
    // Subsequent points
    data.slice(1).forEach((val, i) => {
       const x = (i + 1) * stepX;
       const y = chartHeight - val;
       path += ` L ${x} ${y}`;
    });

    return path;
  };

  const linePath = generatePath(dataPoints);
  // Close the path for fill area
  const areaPath = linePath ? `${linePath} V ${chartHeight + 20} H 0 Z` : '';

  // -- THEME LOGIC --
  const getTheme = () => {
    // If value is 0, force a neutral/gray theme regardless of the prop
    if (isZero) {
      return {
        gradient: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900',
        shadow: 'shadow-none border border-slate-200 dark:border-slate-700',
        stroke: '#94a3b8', // slate-400
        text: 'text-slate-500 dark:text-slate-400',
        valueText: 'text-slate-700 dark:text-slate-200',
        trendBg: 'bg-slate-300 dark:bg-slate-700',
        iconBg: 'bg-slate-300 dark:bg-slate-700',
        iconColor: 'text-slate-600 dark:text-slate-300'
      };
    }

    // Active Themes
    if (colorClass.includes('emerald') || colorClass.includes('green')) {
      return {
        gradient: 'from-emerald-500 to-teal-600',
        shadow: 'shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20',
        stroke: '#a7f3d0', // emerald-200
        text: 'text-emerald-50',
        valueText: 'text-white',
        trendBg: 'bg-emerald-400/20',
        iconBg: 'bg-emerald-400/20',
        iconColor: 'text-white'
      };
    }
    if (colorClass.includes('blue') || colorClass.includes('indigo')) {
      return {
        gradient: 'from-blue-500 to-indigo-600',
        shadow: 'shadow-lg shadow-blue-200 dark:shadow-blue-900/20',
        stroke: '#bfdbfe', // blue-200
        text: 'text-blue-50',
        valueText: 'text-white',
        trendBg: 'bg-blue-400/20',
        iconBg: 'bg-blue-400/20',
        iconColor: 'text-white'
      };
    }
    if (colorClass.includes('purple') || colorClass.includes('violet')) {
      return {
        gradient: 'from-purple-500 to-fuchsia-600',
        shadow: 'shadow-lg shadow-purple-200 dark:shadow-purple-900/20',
        stroke: '#e9d5ff', // purple-200
        text: 'text-purple-50',
        valueText: 'text-white',
        trendBg: 'bg-purple-400/20',
        iconBg: 'bg-purple-400/20',
        iconColor: 'text-white'
      };
    }
    if (colorClass.includes('red') || colorClass.includes('orange')) {
      return {
        gradient: 'from-orange-500 to-red-600',
        shadow: 'shadow-lg shadow-red-200 dark:shadow-red-900/20',
        stroke: '#fecaca', // red-200
        text: 'text-red-50',
        valueText: 'text-white',
        trendBg: 'bg-red-400/20',
        iconBg: 'bg-red-400/20',
        iconColor: 'text-white'
      };
    }
    // Default Fallback
    return {
      gradient: 'from-slate-700 to-slate-900',
      shadow: 'shadow-lg shadow-slate-200',
      stroke: '#e2e8f0',
      text: 'text-slate-200',
      valueText: 'text-white',
      trendBg: 'bg-slate-600/50',
      iconBg: 'bg-slate-600/50',
      iconColor: 'text-white'
    };
  };

  const theme = getTheme();

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-5 sm:p-6 w-full h-full
        bg-gradient-to-br ${theme.gradient}
        ${theme.shadow}
        hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex flex-col justify-between
      `}
    >
      {/* Background Live Chart SVG */}
      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-30 pointer-events-none transition-all duration-500 ease-in-out">
         <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full">
            {areaPath && (
              <path d={areaPath} fill="currentColor" className={`transition-all duration-1000 ease-linear ${isZero ? 'text-slate-300 dark:text-slate-600' : 'text-white opacity-50'}`} />
            )}
            {linePath && (
              <path d={linePath} fill="none" stroke={theme.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000 ease-linear" />
            )}
         </svg>
      </div>

      {/* Gloss/Shine Effect - Only show if active */}
      {!isZero && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.07] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      )}
      
      <div className="relative z-10 flex justify-between items-start gap-4">
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Icon Bubble */}
          <div className={`p-3 backdrop-blur-md rounded-xl w-fit ${isZero ? '' : 'border border-white/20 shadow-inner'} ${theme.iconBg}`}>
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<any>, { size: 24, className: theme.iconColor }) 
              : icon
            }
          </div>
          
          <div>
            <p className={`text-sm font-medium mb-1 tracking-wide ${theme.text} opacity-90 truncate`}>{title}</p>
            <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${theme.valueText} drop-shadow-sm truncate`}>{value}</h3>
          </div>
        </div>

        {/* Trend Badge */}
        <div className={`
          flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full shrink-0
          ${isZero ? 'border border-slate-300 dark:border-slate-600' : 'border border-white/20 backdrop-blur-sm'}
          ${theme.trendBg} ${isZero ? 'text-slate-500 dark:text-slate-400' : 'text-white'}
        `}>
          {isZero ? <Minus size={14} /> : (trendDirection === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
