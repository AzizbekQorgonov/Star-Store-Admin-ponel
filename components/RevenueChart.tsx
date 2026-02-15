import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../context/StoreContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

type TimeRange = '24h' | '3d' | '1w' | '1m';

type ChartPoint = {
  name: string;
  savdo: number;
};

const toAmount = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const getOrderTime = (order: { createdAt?: number; date?: string }) => {
  if (typeof order.createdAt === 'number' && Number.isFinite(order.createdAt)) return order.createdAt;
  const parsed = Date.parse(String(order.date || ''));
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const RevenueChart: React.FC = () => {
  const { currency, formatPrice, orders } = useStore();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1w');

  const chartData = useMemo<ChartPoint[]>(() => {
    const now = Date.now();
    const revenueOrders = orders.filter((o) => o.status !== 'Cancelled');

    if (selectedRange === '24h') {
      const bucketMs = 4 * 60 * 60 * 1000;
      const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
      const points = labels.map((name) => ({ name, savdo: 0 }));
      const start = now - 24 * 60 * 60 * 1000;
      revenueOrders.forEach((order) => {
        const ts = getOrderTime(order);
        if (ts < start || ts > now) return;
        const idx = Math.min(5, Math.max(0, Math.floor((ts - start) / bucketMs)));
        points[idx].savdo += toAmount(order.price);
      });
      points[6].savdo = points[5].savdo;
      return points;
    }

    if (selectedRange === '3d') {
      const days = [2, 1, 0];
      return days.map((dayOffset) => {
        const day = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const total = revenueOrders
          .filter((o) => {
            const ts = getOrderTime(o);
            return ts >= dayStart && ts < dayEnd;
          })
          .reduce((sum, o) => sum + toAmount(o.price), 0);
        const name = dayOffset === 0
          ? 'Bugun'
          : day.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
        return { name, savdo: total };
      });
    }

    if (selectedRange === '1w') {
      const dayNames = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Jum', 'Shan'];
      const points: ChartPoint[] = [];
      for (let i = 6; i >= 0; i -= 1) {
        const day = new Date(now - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const total = revenueOrders
          .filter((o) => {
            const ts = getOrderTime(o);
            return ts >= dayStart && ts < dayEnd;
          })
          .reduce((sum, o) => sum + toAmount(o.price), 0);
        points.push({ name: dayNames[day.getDay()], savdo: total });
      }
      return points;
    }

    const points: ChartPoint[] = [];
    for (let i = 3; i >= 0; i -= 1) {
      const ref = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
      const day = ref.getDay();
      const diffToMonday = (day + 6) % 7;
      const weekStart = new Date(ref);
      weekStart.setDate(ref.getDate() - diffToMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartMs = weekStart.getTime();
      const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;
      const total = revenueOrders
        .filter((o) => {
          const ts = getOrderTime(o);
          return ts >= weekStartMs && ts < weekEndMs;
        })
        .reduce((sum, o) => sum + toAmount(o.price), 0);
      points.push({ name: `${4 - i}-Hafta`, savdo: total });
    }
    return points;
  }, [orders, selectedRange]);

  const ranges: { key: TimeRange; label: string }[] = [
    { key: '24h', label: '24 Soat' },
    { key: '3d', label: '3 Kun' },
    { key: '1w', label: '1 Hafta' },
    { key: '1m', label: '1 Oy' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentValue = Number(payload[0].value || 0);
      const currentIndex = chartData.findIndex((item) => item.name === label);
      let trend = 0;
      if (currentIndex > 0) {
        const prevValue = chartData[currentIndex - 1].savdo;
        trend = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : (currentValue > 0 ? 100 : 0);
      }

      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl ring-1 ring-slate-900/5">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <div className="flex items-end gap-3">
            <p className="text-lg font-bold text-indigo-600 dark:text-white">
              {formatPrice(currentValue)}
            </p>
            {currentIndex > 0 && (
              <div className={`flex items-center gap-0.5 text-xs font-bold mb-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{Math.abs(Math.round(trend))}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 h-full transition-colors flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Sotuvlar Dinamikasi</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedRange === '24h' ? 'Oxirgi sutka davomidagi' :
             selectedRange === '3d' ? 'Oxirgi 3 kunlik' :
             selectedRange === '1w' ? 'Haftalik' : 'Oylik'} natijalar
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {ranges.map((range) => (
            <button
              key={range.key}
              onClick={() => setSelectedRange(range.key)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-all
                ${selectedRange === range.key
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
              `}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[260px]">
        <ResponsiveContainer width="99%" height={250}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSavdo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => {
                const num = Number(value || 0);
                if (num >= 1000) {
                  if (currency === 'UZS') return `${Math.round(num * 12.65 / 1000)}k`;
                  return `${Math.round(num / 1000)}k`;
                }
                return `${Math.round(num)}`;
              }}
            />
            <Tooltip
              cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '5 5' }}
              content={<CustomTooltip />}
            />
            <Area
              type="monotone"
              dataKey="savdo"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSavdo)"
              animationDuration={700}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
