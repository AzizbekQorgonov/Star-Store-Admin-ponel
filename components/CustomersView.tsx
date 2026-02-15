import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Mail, Phone, Download, Plus, Trash2, Edit, X, Save, User, CheckCircle2, XCircle, MapPin, ChevronDown, Send, Globe } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Customer } from '../types';
import ConfirmationModal from './ConfirmationModal';

// Enhanced Country Codes Data with Flags
const COUNTRY_CODES = [
  { code: "+998", country: "UZ", label: "Uzbekistan", flag: "🇺🇿" },
  { code: "+1", country: "US", label: "United States", flag: "🇺🇸" },
  { code: "+7", country: "RU", label: "Russia", flag: "🇷🇺" },
  { code: "+7", country: "KZ", label: "Kazakhstan", flag: "🇰🇿" },
  { code: "+90", country: "TR", label: "Turkey", flag: "🇹🇷" },
  { code: "+82", country: "KR", label: "South Korea", flag: "🇰🇷" },
  { code: "+86", country: "CN", label: "China", flag: "🇨🇳" },
  { code: "+971", country: "AE", label: "UAE", flag: "🇦🇪" },
  { code: "+44", country: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "+49", country: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "FR", label: "France", flag: "🇫🇷" },
  { code: "+91", country: "IN", label: "India", flag: "🇮🇳" },
  { code: "+81", country: "JP", label: "Japan", flag: "🇯🇵" },
  { code: "+992", country: "TJ", label: "Tajikistan", flag: "🇹🇯" },
  { code: "+996", country: "KG", label: "Kyrgyzstan", flag: "🇰🇬" },
];

const CustomersView: React.FC = () => {
  const { addNotification, customers, upsertCustomer, deleteCustomer } = useStore();
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Customer Form Data
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '', // Full phone number stored here
    location: '',
    status: 'Active'
  });

  // Email Form Data
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: ''
  });

  // Derived state for splitting phone number in UI
  const [selectedCountryCode, setSelectedCountryCode] = useState("+998");
  const [phoneNumberBody, setPhoneNumberBody] = useState("");

  // Update phone splitter when formData changes (e.g. when editing)
  useEffect(() => {
    if (formData.phone) {
      const foundCode = COUNTRY_CODES.find(c => formData.phone?.startsWith(c.code));
      if (foundCode) {
        setSelectedCountryCode(foundCode.code);
        setPhoneNumberBody(formData.phone.replace(foundCode.code, '').trim());
      } else {
        // Fallback if code not found in list, keep default or try to guess
        setPhoneNumberBody(formData.phone); 
      }
    } else {
       setPhoneNumberBody("");
       setSelectedCountryCode("+998");
    }
  }, [formData.phone, isModalOpen]);

  // Actions
  const handleExport = () => {
    addNotification('info', "Mijozlar bazasi yuklanmoqda...");
    setTimeout(() => {
        addNotification('success', "Mijozlar ro'yxati PDF formatida yuklab olindi!");
    }, 1500);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
        isOpen: true,
        title: "Mijozni o'chirish",
        message: "Haqiqatan ham bu mijozni o'chirmoqchimisiz?",
        type: 'danger',
        onConfirm: () => {
            deleteCustomer(id);
            addNotification('success', "Mijoz muvaffaqiyatli o'chirildi");
        }
    });
  };

  // Open Email Modal
  const openEmailModal = (email: string) => {
    setEmailForm({ to: email, subject: '', message: '' });
    setIsEmailModalOpen(true);
  };

  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!emailForm.subject || !emailForm.message) {
        addNotification('warning', "Mavzu va xabar matnini kiriting");
        return;
    }
    
    // Simulate sending
    addNotification('info', `${emailForm.to} ga xat yuborilmoqda...`);
    setTimeout(() => {
        addNotification('success', "Email muvaffaqiyatli yuborildi!");
        setIsEmailModalOpen(false);
    }, 1500);
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData(customer);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '', 
        location: '',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addNotification('error', "Ism va Email majburiy!");
      return;
    }

    // Combine Code + Body for final storage
    const finalPhone = `${selectedCountryCode} ${phoneNumberBody.replace(/\s/g, '')}`;

    const dataToSave = { ...formData, phone: finalPhone };

    if (editingId !== null) {
      // Update
      const updatedCustomer = { ...dataToSave, id: editingId } as Customer;
      upsertCustomer(updatedCustomer);
      addNotification('success', "Mijoz ma'lumotlari yangilandi");
    } else {
      // Create
      const newCustomerId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Date.now().toString();
      const newCustomer: Customer = {
        ...dataToSave,
        id: newCustomerId,
        orders: 0,
        spent: 0,
        joinDate: new Date().toISOString().split('T')[0],
        status: formData.status || 'Active'
      } as Customer;
      upsertCustomer(newCustomer);
      addNotification('success', "Yangi mijoz qo'shildi");
    }
    setIsModalOpen(false);
  };

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' ? true : customer.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, filterStatus]);

  const formatLastSeen = (ts?: number) => {
    if (!ts) return "Noma'lum";
    const diff = Date.now() - ts;
    if (diff < 60_000) return "Hozirgina";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} daqiqa oldin`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} soat oldin`;
    return new Date(ts).toLocaleString();
  };

  const formatDuration = (seconds?: number) => {
    const total = Math.max(0, Number(seconds ?? 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h} soat ${m} daqiqa`;
    if (m > 0) return `${m} daqiqa ${s} soniya`;
    return `${s} soniya`;
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="O'chirish"
      />

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">Mijozlar Bazasi</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Do'koningizning ro'yxatdan o'tgan foydalanuvchilari (Jami: {customers.length})</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
          >
            <Download size={16} /> Eksport
          </button>
          <button 
            onClick={() => openModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
          >
            <Plus size={16} /> Mijoz Qo'shish
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ism yoki email orqali qidirish..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>
        <div className="flex items-center gap-2 relative">
           <Filter size={18} className="text-slate-500 absolute left-3 z-10 pointer-events-none" />
           <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value as any)}
             className="appearance-none pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
           >
             <option value="All" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">Barcha holatlar</option>
             <option value="Active" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">Faol</option>
             <option value="Inactive" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">Faol emas</option>
           </select>
           <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4">Mijoz</th>
                <th className="p-4">Aloqa</th>
                <th className="p-4">Buyurtmalar</th>
                <th className="p-4">Jami Savdo</th>
                <th className="p-4">Oxirgi Faollik</th>
                <th className="p-4">Saytda Vaqt</th>
                <th className="p-4">Holat</th>
                <th className="p-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 overflow-hidden">
                        {customer.avatar ? (
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.onerror = null;
                              img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'User')}&background=6366f1&color=ffffff`;
                            }}
                          />
                        ) : (
                          customer.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-white">{customer.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                           <MapPin size={10} /> {customer.location || 'Manzil yo\'q'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Mail size={14} className="text-slate-400" /> {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Phone size={14} className="text-slate-400" /> {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-semibold">{customer.orders} ta</span>
                  </td>
                  <td className="p-4 font-bold text-slate-800 dark:text-white">${customer.spent.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className={`inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full border ${
                        customer.isOnline ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${customer.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {customer.isOnline ? 'Online' : 'Offline'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{formatLastSeen(customer.lastSeenAt)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-200">{formatDuration(customer.totalTimeSeconds)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      customer.status === 'Active' 
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}>
                      {customer.status === 'Active' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {customer.status === 'Active' ? 'Faol' : 'Faol emas'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEmailModal(customer.email)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800" 
                        title="Email yuborish"
                      >
                        <Mail size={18} />
                      </button>
                      <button 
                        onClick={() => openModal(customer)}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800" 
                        title="Tahrirlash"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800" 
                        title="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))) : (
                <tr>
                   <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      Ma'lumot topilmadi. Qidiruvni o'zgartirib ko'ring.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
           <div 
             className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
             onClick={e => e.stopPropagation()}
           >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {editingId ? <Edit size={20} className="text-indigo-600"/> : <Plus size={20} className="text-green-600"/>}
                    {editingId ? "Mijoz ma'lumotlarini tahrirlash" : "Yangi mijoz qo'shish"}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">F.I.SH</label>
                    <div className="relative">
                       <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="text" 
                         required
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                         className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                         placeholder="Ism Familiya"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                        <div className="relative">
                           <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input 
                             type="email" 
                             required
                             value={formData.email}
                             onChange={e => setFormData({...formData, email: e.target.value})}
                             className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                             placeholder="example@mail.com"
                           />
                        </div>
                    </div>
                    {/* New Phone Number Input with Country Code and Flags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Telefon</label>
                        <div className="flex rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden">
                           <div className="relative border-r border-slate-200 dark:border-slate-700">
                               <select 
                                 value={selectedCountryCode}
                                 onChange={(e) => setSelectedCountryCode(e.target.value)}
                                 className="appearance-none h-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm pl-3 pr-7 py-2.5 outline-none cursor-pointer transition-colors w-[100px]"
                               >
                                  {COUNTRY_CODES.map((c) => (
                                    <option key={c.code} value={c.code} title={c.label} className="bg-white dark:bg-slate-800">
                                       {c.flag} {c.code}
                                    </option>
                                  ))}
                               </select>
                               <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                           </div>
                           <input 
                             type="tel" 
                             value={phoneNumberBody}
                             onChange={e => {
                                // Only allow numbers and spaces
                                const val = e.target.value.replace(/[^0-9\s]/g, '');
                                setPhoneNumberBody(val);
                             }}
                             className="flex-1 w-full pl-3 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none"
                             placeholder="90 123 45 67"
                           />
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Manzil</label>
                    <div className="relative">
                       <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="text" 
                         value={formData.location}
                         onChange={e => setFormData({...formData, location: e.target.value})}
                         className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                         placeholder="Toshkent, O'zbekiston"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                    <div className="flex gap-4">
                       <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <input 
                            type="radio" 
                            name="status" 
                            checked={formData.status === 'Active'} 
                            onChange={() => setFormData({...formData, status: 'Active'})}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                             <CheckCircle2 size={16} className="text-green-500" /> Faol
                          </span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <input 
                            type="radio" 
                            name="status" 
                            checked={formData.status === 'Inactive'} 
                            onChange={() => setFormData({...formData, status: 'Inactive'})}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                             <XCircle size={16} className="text-slate-400" /> Faol emas
                          </span>
                       </label>
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                    >
                      Bekor qilish
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Save size={18} />
                      {editingId ? "Yangilash" : "Saqlash"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* EMAIL COMPOSITION MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsEmailModalOpen(false)}>
          <div 
             className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
             onClick={e => e.stopPropagation()}
          >
             <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <Mail size={20} />
                   Xat Yuborish
                </h3>
                <button onClick={() => setIsEmailModalOpen(false)} className="text-white/80 hover:text-white">
                   <X size={20} />
                </button>
             </div>
             
             <form onSubmit={handleSendEmailSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kimga</label>
                    <input 
                      type="email" 
                      required
                      readOnly
                      value={emailForm.to}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mavzu</label>
                    <input 
                      type="text" 
                      required
                      value={emailForm.subject}
                      onChange={e => setEmailForm({...emailForm, subject: e.target.value})}
                      placeholder="Masalan: Maxsus taklif"
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Xabar</label>
                    <textarea 
                      required
                      rows={6}
                      value={emailForm.message}
                      onChange={e => setEmailForm({...emailForm, message: e.target.value})}
                      placeholder="Xabar matnini kiriting..."
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                 </div>
             </form>
             
             <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                 <button 
                    type="button" 
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                 >
                    Bekor qilish
                 </button>
                 <button 
                    onClick={handleSendEmailSubmit}
                    className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium shadow-md flex items-center gap-2 transition-all active:scale-95"
                 >
                    <Send size={18} />
                    Yuborish
                 </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomersView;
