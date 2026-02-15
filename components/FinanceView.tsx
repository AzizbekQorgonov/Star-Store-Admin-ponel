import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight, Download, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import RevenueChart from './RevenueChart';
import { useStore } from '../context/StoreContext';

const FinanceView: React.FC = () => {
  const { formatPrice, orders } = useStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Calculate Real Income (Sum of all non-cancelled orders)
  const totalIncome = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, order) => sum + Number(order.price), 0);

  // 2. Calculate Estimated Expenses (Mock Logic: 65% of Income is Product Cost + Shipping)
  const estimatedExpenses = totalIncome * 0.65;

  // 3. Calculate Balance
  const currentBalance = totalIncome - estimatedExpenses;

  // 4. Expense Breakdowns
  const marketingCost = estimatedExpenses * 0.45; // 45%
  const salaryCost = estimatedExpenses * 0.30;    // 30%
  const logisticsCost = estimatedExpenses * 0.25; // 25%

  const expenseData = [
    { name: 'Marketing', value: marketingCost, color: '#6366f1' },   // Indigo-500
    { name: 'Ish haqi', value: salaryCost, color: '#a855f7' },       // Purple-500
    { name: 'Logistika', value: logisticsCost, color: '#10b981' },   // Emerald-500
  ];

  // 5. Filter Transactions based on Card Click
  const filteredTransactions = useMemo(() => {
    let data = orders;
    
    if (activeFilter === 'income') {
      data = orders.filter(o => o.status !== 'Cancelled');
    } else if (activeFilter === 'expense') {
      // In this mock, we treat 'Cancelled' as a refund/expense type for the list
      data = orders.filter(o => o.status === 'Cancelled');
    }

    // Sort by date (mock logic assumes array order is roughly date order)
    return data;
  }, [orders, activeFilter]);

  // Handle display limit
  const displayedTransactions = isExpanded ? filteredTransactions : filteredTransactions.slice(0, 5);

  // Custom Tooltip for Pie Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 text-xs">
          <p className="font-semibold text-slate-700 dark:text-slate-200">{payload[0].name}</p>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">Moliya va Hisobotlar</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Kompaniyaning moliyaviy holati va tahlili</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
           <Download size={16} />
           PDF Hisobot
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance Card (Static - resets filter) */}
        <div 
           onClick={() => setActiveFilter('all')}
           className={`relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-6 shadow-xl shadow-indigo-200 dark:shadow-none cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 duration-300 ${activeFilter === 'all' ? 'ring-4 ring-indigo-300 dark:ring-indigo-900' : ''}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Wallet size={120} />
          </div>
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <Wallet size={24} className="text-white" />
                </div>
                <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium border border-white/10 flex items-center gap-1">
                   <TrendingUp size={12} /> +24%
                </span>
              </div>
              <p className="text-indigo-100 text-sm font-medium mb-1 opacity-80">Sof Foyda (Balans)</p>
              <h3 className="text-4xl font-bold tracking-tight">{formatPrice(currentBalance)}</h3>
              <p className="text-xs text-indigo-200 mt-4 opacity-70">Barchasini ko'rish uchun bosing</p>
          </div>
        </div>

        {/* Income Card (Clickable) */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'income' ? 'all' : 'income')}
          className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md active:scale-95 group relative duration-300 ${activeFilter === 'income' ? 'border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/30' : 'border-slate-100 dark:border-slate-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${activeFilter === 'income' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
              <ArrowUpRight size={24} />
            </div>
            <span className="text-emerald-600 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Jami Kirim (Sales)</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{formatPrice(totalIncome)}</h3>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
             <div className="h-full bg-emerald-500 w-[70%] rounded-full"></div>
          </div>
          {activeFilter === 'income' && <div className="absolute top-2 right-2 text-emerald-500 animate-in fade-in zoom-in"><Filter size={16} /></div>}
        </div>

        {/* Expense Card (Clickable) */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'expense' ? 'all' : 'expense')}
          className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md active:scale-95 group relative duration-300 ${activeFilter === 'expense' ? 'border-red-500 ring-2 ring-red-100 dark:ring-red-900/30' : 'border-slate-100 dark:border-slate-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${activeFilter === 'expense' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
              <ArrowDownRight size={24} />
            </div>
            <span className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">-5%</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Xarajatlar & Qaytimlar</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{formatPrice(estimatedExpenses)}</h3>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
             <div className="h-full bg-red-500 w-[30%] rounded-full"></div>
          </div>
          {activeFilter === 'expense' && <div className="absolute top-2 right-2 text-red-500 animate-in fade-in zoom-in"><Filter size={16} /></div>}
        </div>
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 h-[400px]">
            <RevenueChart />
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Xarajatlar Tuzilmasi</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Taxminiy oylik xarajatlar taqsimoti</p>
             
             {/* Recharts Pie Chart */}
             <div className="flex-1 min-h-[220px] relative">
                 <ResponsiveContainer width="99%" height={210}>
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        cornerRadius={6}
                        stroke="none"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                 </ResponsiveContainer>
                 
                 {/* Center Text (Total) */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Jami</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                        {estimatedExpenses > 1000 ? `${(estimatedExpenses/1000).toFixed(1)}k` : estimatedExpenses}
                    </span>
                 </div>
             </div>

             <div className="space-y-4 mt-6">
                {expenseData.map((item, index) => {
                   const percent = estimatedExpenses > 0 ? Math.round((item.value / estimatedExpenses) * 100) : 0;
                   return (
                    <div key={index} className="flex justify-between items-center text-sm group">
                       <div className="flex items-center gap-3">
                          <span 
                            className="w-3 h-3 rounded-full shadow-sm transition-transform group-hover:scale-125" 
                            style={{ backgroundColor: item.color }}
                          ></span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                             {percent}%
                          </span>
                          <span className="font-bold text-slate-800 dark:text-white min-w-[70px] text-right">
                             {formatPrice(item.value)}
                          </span>
                       </div>
                    </div>
                   );
                })}
             </div>
         </div>
      </div>

      {/* Recent Transactions - LINKED TO ORDERS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
           <div className="flex items-center gap-2">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white">Tranzaksiyalar Tarixi</h3>
             {activeFilter !== 'all' && (
               <span className="flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300 animate-in fade-in slide-in-from-left-2">
                  {activeFilter === 'income' ? 'Faqat Kirim' : 'Faqat Qaytimlar/Xarajat'}
                  <button onClick={(e) => { e.stopPropagation(); setActiveFilter('all'); }} className="hover:text-red-500"><X size={12}/></button>
               </span>
             )}
           </div>
        </div>
        
        <div className={`overflow-x-auto transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-[400px]'}`}>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-medium sticky top-0 z-10 backdrop-blur-md">
              <tr>
                  <th className="p-4 pl-6">Tranzaksiya</th>
                  <th className="p-4">Sana</th>
                  <th className="p-4">To'lov Turi</th>
                  <th className="p-4 pr-6 text-right">Summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2.5 rounded-xl transition-colors
                          ${order.status === 'Cancelled' 
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}
                        `}>
                          {order.status === 'Cancelled' ? <TrendingDown size={18} /> : <CreditCard size={18} />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white text-sm">
                            {order.status === 'Cancelled' ? 'Qaytarilgan To\'lov' : 'Sotuv'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{order.product} - {order.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm font-medium">{order.date}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                      <span className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-xs">Visa/Click</span>
                    </td>
                    <td className={`p-4 pr-6 text-right font-bold text-sm ${order.status === 'Cancelled' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {order.status === 'Cancelled' ? '-' : '+'}{formatPrice(Number(order.price))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Ushbu filtrlash bo'yicha tranzaksiyalar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Modern Show All Button */}
        {filteredTransactions.length > 5 && (
           <div className="border-t border-slate-100 dark:border-slate-800 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-slate-900 dark:via-slate-900/50 pointer-events-none opacity-50 h-12 -top-12"></div>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-4 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 group hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                {isExpanded ? (
                    <>
                        Qisqartirish <ChevronUp size={16} className="group-hover:-translate-y-0.5 transition-transform"/>
                    </>
                ) : (
                    <>
                        Barchasini ko'rish ({filteredTransactions.length}) <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform"/>
                    </>
                )}
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default FinanceView;
