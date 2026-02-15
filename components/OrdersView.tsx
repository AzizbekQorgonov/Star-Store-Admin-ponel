import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Eye, Truck, CheckCircle, XCircle, Clock, ChevronDown, LayoutList, Kanban, MoreHorizontal, X, MapPin, Mail, CreditCard, Printer, Package, User, Check, AlertTriangle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Barcha holatlar' },
  { value: 'Processing', label: 'Jarayonda' },
  { value: 'Delivered', label: 'Yetkazildi' },
  { value: 'Cancelled', label: 'Bekor qilindi' },
];

const OrdersView: React.FC = () => {
  const { addNotification, formatPrice, orders, updateOrderStatus, focusedOrderId, setFocusedOrderId } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now());
  const warningSentRef = useRef<Set<string>>(new Set());
  
  // Filtering & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-open modal if navigating from dashboard
  useEffect(() => {
    if (focusedOrderId) {
      const orderToOpen = orders.find(o => o.id === focusedOrderId);
      if (orderToOpen) {
        setSelectedOrder(orderToOpen);
      }
      // Reset focused ID so it doesn't reopen if we close and navigate back
      setFocusedOrderId(null);
    }
  }, [focusedOrderId, orders, setFocusedOrderId]);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' ? true : order.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getDeliveryMeta = (order: Order) => {
    if (!order.deliveryEta) return null;
    const diffMs = order.deliveryEta - now;
    const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return {
      daysLeft,
      isDueSoon: order.status === 'Processing' && daysLeft <= 3 && daysLeft >= 0,
      isLate: order.status === 'Processing' && diffMs < 0,
      label: new Date(order.deliveryEta).toLocaleString(),
    };
  };

  useEffect(() => {
    orders.forEach((order) => {
      const meta = getDeliveryMeta(order);
      if (!meta || !meta.isDueSoon) return;
      if (warningSentRef.current.has(order.id)) return;
      warningSentRef.current.add(order.id);
      addNotification('warning', `Buyurtma ${order.id} yetkazilishigacha ${meta.daysLeft} kun qoldi.`);
    });
  }, [orders, now]);

  const handleStatusChange = (id: string, newStatus: Order['status']) => {
    updateOrderStatus(id, newStatus);
    
    // Agar modal ochiq bo'lsa, undagi ma'lumotni ham yangilash
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    const message = newStatus === 'Delivered' ? 'Buyurtma yetkazildi deb belgilandi!' : 'Buyurtma bekor qilindi!';
    addNotification(newStatus === 'Delivered' ? 'success' : 'error', message);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Delivered': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"><CheckCircle size={12}/> Yetkazildi</span>;
      case 'Processing': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"><Truck size={12}/> Jarayonda</span>;
      case 'Cancelled': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"><XCircle size={12}/> Bekor qilindi</span>;
    }
  };

  const getOrderItems = (order: Order) => (Array.isArray(order.items) ? order.items : []);
  const getPrimaryItem = (order: Order) => getOrderItems(order)[0];

  // Kanban Columns Data
  const columns = [
    { id: 'Processing', title: 'Jarayonda', color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800', icon: <Truck className="text-blue-500" size={16} /> },
    { id: 'Delivered', title: 'Yetkazildi', color: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800', icon: <CheckCircle className="text-green-500" size={16} /> },
    { id: 'Cancelled', title: 'Bekor qilindi', color: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800', icon: <XCircle className="text-red-500" size={16} /> },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">Buyurtmalar Nazorati</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Barcha kiruvchi va chiquvchi buyurtmalar tarixi (Jami: {orders.length})</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
           <button 
             onClick={() => setViewMode('list')}
             className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
           >
             <LayoutList size={18} />
             Jadval
           </button>
           <button 
             onClick={() => setViewMode('board')}
             className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${viewMode === 'board' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
           >
             <Kanban size={18} />
             Doska (Kanban)
           </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ID, Ism yoki Mahsulot bo'yicha qidirish..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
          />
        </div>
        
        {viewMode === 'list' && (
          <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-3 px-4 py-2 min-w-[180px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 transition-all"
            >
                <span>{STATUS_OPTIONS.find(o => o.value === filterStatus)?.label}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {STATUS_OPTIONS.map(option => (
                        <div 
                            key={option.value}
                            onClick={() => {
                                setFilterStatus(option.value);
                                setIsDropdownOpen(false);
                            }}
                            className={`
                                flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors
                                ${filterStatus === option.value 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' 
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                            `}
                        >
                            {option.label}
                            {filterStatus === option.value && <Check size={14} className="text-indigo-600 dark:text-indigo-400"/>}
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors animate-in fade-in slide-in-from-bottom-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Mijoz</th>
                  <th className="p-4">Mahsulot</th>
                  <th className="p-4">Vaqt</th>
                  <th className="p-4">Yetkazish</th>
                  <th className="p-4">Summa</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Boshqarish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-300">{order.id}</td>
                    <td className="p-4 font-medium text-slate-800 dark:text-white">{order.customerName}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{order.product}</td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock size={14}/> {order.date}
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                      {(() => {
                        const meta = getDeliveryMeta(order);
                        if (!meta) return <span className="text-slate-400">Belgilanmagan</span>;
                        if (meta.isLate) return <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"><AlertTriangle size={12} /> Muddat o‘tgan</span>;
                        if (meta.isDueSoon) return <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertTriangle size={12} /> {meta.daysLeft} kun qoldi</span>;
                        return <span>{meta.label}</span>;
                      })()}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-white">{formatPrice(Number(order.price))}</td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" 
                          title="Ko'rish"
                        >
                          <Eye size={18} />
                        </button>
                        {order.status === 'Processing' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(order.id, 'Delivered')}
                              className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded bg-slate-50 dark:bg-slate-800 transition-colors" 
                              title="Yetkazildi deb belgilash"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(order.id, 'Cancelled')}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded bg-slate-50 dark:bg-slate-800 transition-colors" 
                              title="Bekor qilish"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      Hech narsa topilmadi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
           {columns.map(col => {
             const colOrders = filteredOrders.filter(o => o.status === col.id);
             return (
               <div key={col.id} className="flex flex-col h-full">
                  <div className={`p-4 rounded-t-xl border-t border-x ${col.color} flex items-center justify-between`}>
                     <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                        {col.icon}
                        {col.title}
                        <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs shadow-sm border border-slate-100 dark:border-slate-700">
                          {colOrders.length}
                        </span>
                     </div>
                     <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <MoreHorizontal size={18} />
                     </button>
                  </div>
                  <div className={`flex-1 p-3 bg-slate-50 dark:bg-slate-900/50 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-xl space-y-3 min-h-[500px]`}>
                     {colOrders.map(order => (
                       <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-grab active:cursor-grabbing group">
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-mono text-slate-400">{order.id}</span>
                             <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{order.date.split(',')[0]}</span>
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-white mb-1">{order.product}</h4>
                          {(() => {
                            const meta = getDeliveryMeta(order);
                            if (!meta?.isDueSoon) return null;
                            return (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 inline-flex items-center gap-1">
                                <AlertTriangle size={12} /> {meta.daysLeft} kun qoldi
                              </p>
                            );
                          })()}
                          <div className="flex items-center gap-2 mb-3">
                             <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                               {order.customerName.charAt(0)}
                             </div>
                             <span className="text-sm text-slate-600 dark:text-slate-400">{order.customerName}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-700/50">
                             <span className="font-bold text-slate-900 dark:text-white">{formatPrice(Number(order.price))}</span>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => setSelectedOrder(order)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-600"
                                >
                                   <Eye size={16} />
                                </button>
                                {col.id === 'Processing' && (
                                   <>
                                      <button 
                                        onClick={() => handleStatusChange(order.id, 'Delivered')}
                                        className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded text-green-500" title="Yetkazildi"
                                      >
                                         <CheckCircle size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleStatusChange(order.id, 'Cancelled')}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-500" title="Bekor qilish"
                                      >
                                         <XCircle size={16} />
                                      </button>
                                   </>
                                )}
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             )
           })}
        </div>
      )}

      {/* DETAILED ORDER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedOrder(null)}>
          <div 
             className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
             onClick={e => e.stopPropagation()}
          >
             {/* Modal Header */}
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">Buyurtma {selectedOrder.id}</h3>
                   {getStatusBadge(selectedOrder.status)}
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                   <X size={24} />
                </button>
             </div>

             {/* Modal Body */}
             <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* Left Column: Product Info */}
                   <div className="space-y-6">
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative">
                         <img 
                            src={getPrimaryItem(selectedOrder)?.image || selectedOrder.previewImage || 'https://placehold.co/800x450?text=Order'} 
                            alt={selectedOrder.product} 
                            className="w-full h-full object-cover"
                         />
                         <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                            {(getOrderItems(selectedOrder).reduce((acc, item) => acc + Number(item.quantity || 0), 0) || selectedOrder.itemsCount || 0)} dona
                         </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                         <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Package size={18} className="text-indigo-500"/>
                            Mahsulot Tafsilotlari
                         </h4>
                         {getOrderItems(selectedOrder).length > 0 ? (
                           <div className="space-y-2 text-sm">
                             {getOrderItems(selectedOrder).map((item, idx) => (
                               <div key={`${item.product_id || item.name}-${idx}`} className="rounded-lg border border-slate-200/70 dark:border-slate-700 p-2.5">
                                 <p className="font-medium text-slate-800 dark:text-white">{item.name}</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                   {item.color || '-'} / {item.size || '-'} / x{item.quantity}
                                 </p>
                                 <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{formatPrice(Number(item.price || 0))}</p>
                               </div>
                             ))}
                             <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 flex justify-between text-base font-bold">
                               <span className="text-slate-700 dark:text-slate-200">Jami:</span>
                               <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(Number(selectedOrder.price))}</span>
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-2 text-sm">
                             <div className="flex justify-between">
                               <span className="text-slate-500 dark:text-slate-400">Nomi:</span>
                               <span className="font-medium text-slate-800 dark:text-white">{selectedOrder.product}</span>
                             </div>
                             <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 flex justify-between text-base font-bold">
                               <span className="text-slate-700 dark:text-slate-200">Jami:</span>
                               <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(Number(selectedOrder.price))}</span>
                             </div>
                           </div>
                         )}
                      </div>
                   </div>

                   {/* Right Column: Customer & Shipping */}
                   <div className="space-y-6">
                      
                      {/* Customer Card */}
                      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                         <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <User size={18} className="text-indigo-500"/>
                            Mijoz Ma'lumotlari
                         </h4>
                         <div className="space-y-3">
                            <div className="flex items-start gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                  {selectedOrder.customerName.charAt(0)}
                                </div>
                               <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.customerName}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">ID: {Math.floor(Math.random() * 10000)}</p>
                               </div>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                               <Mail size={16} className="text-slate-400"/>
                               {selectedOrder.customerEmail || 'Email kiritilmagan'}
                            </div>
                         </div>
                      </div>

                      {/* Shipping Info */}
                      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                         <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <MapPin size={18} className="text-indigo-500"/>
                            Yetkazib berish manzili
                         </h4>
                         <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {selectedOrder.address?.line1 || 'Manzil yo‘q'}
                            {selectedOrder.address?.city ? `, ${selectedOrder.address.city}` : ''}
                            {selectedOrder.address?.postalCode ? `, ${selectedOrder.address.postalCode}` : ''}
                            {selectedOrder.address?.region ? `, ${selectedOrder.address.region}` : ''}
                         </p>
                         {(() => {
                           const meta = getDeliveryMeta(selectedOrder);
                           if (!meta) return null;
                           return (
                             <div className={`mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                               meta.isLate
                                 ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                                 : meta.isDueSoon
                                 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                                 : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                             }`}>
                               <Clock size={14} />
                               {meta.isLate
                                 ? 'Yetkazish muddati o‘tgan'
                                 : meta.isDueSoon
                                 ? `Yetkazishgacha ${meta.daysLeft} kun qoldi`
                                 : `ETA: ${meta.label}`}
                             </div>
                           );
                         })()}
                      </div>

                      {/* Payment Info */}
                       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                         <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <CreditCard size={18} className="text-indigo-500"/>
                            To'lov Turi
                         </h4>
                         <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Online to'lov</span>
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-1 rounded font-bold uppercase">To'langan</span>
                         </div>
                      </div>

                   </div>
                </div>
             </div>

             {/* Modal Footer Actions */}
             <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-end gap-3">
                
                <button 
                  onClick={() => addNotification('info', "Chek printerga yuborildi...")}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                >
                   <Printer size={16} /> Chek chiqarish
                </button>
                
                {selectedOrder.status === 'Processing' && (
                  <>
                     <button 
                        onClick={() => handleStatusChange(selectedOrder.id, 'Cancelled')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm"
                     >
                        <XCircle size={16} /> Bekor qilish
                     </button>
                     <button 
                        onClick={() => handleStatusChange(selectedOrder.id, 'Delivered')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md shadow-green-200 dark:shadow-none transition-colors font-medium text-sm"
                     >
                        <CheckCircle size={16} /> Qabul qilish / Yetkazildi
                     </button>
                  </>
                )}

                {selectedOrder.status !== 'Processing' && (
                   <button 
                     onClick={() => setSelectedOrder(null)}
                     className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                   >
                     Yopish
                   </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
