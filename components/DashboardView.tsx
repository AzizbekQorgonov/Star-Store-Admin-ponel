import React from 'react';
import { DollarSign, ShoppingCart, Users, AlertTriangle, Wallet, TrendingUp, Package, Tag, Download } from 'lucide-react';
import StatCard from './StatCard';
import RevenueChart from './RevenueChart';
import MetricCard from './MetricCard';
import OrdersTable from './OrdersTable';
import { ViewType } from '../types';
import { useStore } from '../context/StoreContext';

// Custom W Coin Icon Component
const WCoin = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M7 8l2.5 8 2.5-5 2.5 5 2.5-8" />
  </svg>
);

interface DashboardViewProps {
  setCurrentView: (view: ViewType) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentView }) => {
  const { addNotification, formatPrice, customers, orders, products, coupons, setFocusedOrderId } = useStore();

  // Calculate Real Statistics
  const totalRevenue = orders.reduce((acc, order) => {
    // Agar status Cancelled bo'lsa hisoblamaslik mumkin, hozircha hammasini hisoblaymiz
    return acc + Number(order.price);
  }, 0);

  const lowStockCount = products.filter(p => p.stock < 5).length;
  
  // Calculate average order value
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const handleDownloadReport = () => {
    addNotification('info', 'Hisobot tayyorlanmoqda...');
    
    // Generate CSV from Real Data
    const headers = "ID,Mijoz,Mahsulot,Narx,Status\n";
    const rows = orders.map(o => `${o.id},${o.customerName},${o.product},${o.price},${o.status}`).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "star_store_hisobot.csv");
    document.body.appendChild(link);
    
    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      addNotification('success', 'Hisobot yuklab olindi!');
    }, 1000);
  };
  
  // Handle clicking on a row in the Orders Table
  const handleOrderClick = (orderId: string) => {
    setFocusedOrderId(orderId);
    setCurrentView('orders');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary dark:text-white">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Xush kelibsiz, Admin! Bugungi ko'rsatkichlar.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 border border-white/10 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-sm backdrop-blur-sm"
          >
            <Download size={18} />
            Hisobot yuklash
          </button>
        </div>
      </div>

      {/* 1. Top Statistics Cards - Connected to Real Data */}
      {/* Responsive Grid: 1 col mobile, 2 cols tablet/laptop, 4 cols desktop XL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Jami Savdo" 
          value={formatPrice(totalRevenue)} 
          trend="0%" 
          trendDirection="up"
          icon={<WCoin />}
          colorClass="bg-emerald-500" 
          onClick={() => setCurrentView('finance')}
        />
        <StatCard 
          title="Buyurtmalar" 
          value={orders.length.toString()} 
          trend="0" 
          trendDirection="up"
          icon={<ShoppingCart />}
          colorClass="bg-blue-500" 
          onClick={() => setCurrentView('orders')}
        />
        <StatCard 
          title="Mijozlar" 
          value={customers.length.toString()} 
          trend="0%" 
          trendDirection="up"
          icon={<Users />}
          colorClass="bg-purple-600" 
          onClick={() => setCurrentView('customers')}
        />
          <StatCard 
          title="Ombor Holati" 
          value={lowStockCount > 0 ? `${lowStockCount} ta kam` : "Hammasi yetarli"} 
          trend={lowStockCount > 0 ? "Diqqat" : "Barqaror"} 
          trendDirection="up"
          icon={lowStockCount > 0 ? <AlertTriangle /> : <Package />}
          colorClass={lowStockCount > 0 ? "bg-red-500" : "bg-green-500"} 
          onClick={() => setCurrentView('products')}
        />
      </div>

      {/* 2. Chart Section & Specific Metrics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Chart takes up 2 columns on large screens */}
        <div className="xl:col-span-2 h-[420px]">
          <RevenueChart />
        </div>

        {/* Detailed Metrics Grid (Right side) */}
        <div className="xl:col-span-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 overflow-y-auto max-h-[420px] custom-scrollbar pr-1">
          <MetricCard 
            category="Moliya"
            title="Umumiy Tushum"
            value={formatPrice(totalRevenue)}
            description="Barcha sotilgan mollarning jami summasi"
            icon={<Wallet size={18} />}
            onClick={() => setCurrentView('finance')}
          />
          <MetricCard 
            category="Moliya"
            title="Sof Foyda"
            value={formatPrice(totalRevenue * 0.3)} // Mock 30% profit
            description="Xarajatlardan tashqari qolgan foyda (taxminiy 30%)"
            icon={<TrendingUp size={18} />}
            onClick={() => setCurrentView('finance')}
          />
          <MetricCard 
            category="Sotuv"
            title="Yangi Buyurtmalar"
            value={orders.filter(o => o.status === 'Processing').length.toString()}
            description="Hali ko'rib chiqilmagan zakazlar soni"
            icon={<ShoppingCart size={18} />}
            onClick={() => setCurrentView('orders')}
          />
          <MetricCard 
            category="Sotuv"
            title="O'rtacha Savdo"
            value={formatPrice(averageOrderValue)}
            description="Bitta chekning o'rtacha qiymati"
            icon={<DollarSign size={18} />}
            onClick={() => setCurrentView('orders')}
          />
          <MetricCard 
            category="Ombor"
            title="Tugayotgan Mahsulotlar"
            value={lowStockCount.toString()}
            description="Soni 5 tadan kam qolgan tovarlar"
            icon={<Package size={18} />}
            onClick={() => setCurrentView('products')}
          />
          <MetricCard 
            category="Mijoz"
            title="Yangi Ro'yxatdan o'tganlar"
            value={customers.filter(c => c.joinDate.includes('2024')).length.toString()}
            description="Bu yilgi yangi foydalanuvchilar"
            icon={<Users size={18} />}
            onClick={() => setCurrentView('customers')}
          />
            <MetricCard 
            category="Marketing"
            title="Faol Kuponlar"
            value={`${coupons.filter(c => c.status === 'active').length} ta`}
            description="Ayni damda ishlayotgan chegirma kodlari"
            icon={<Tag size={18} />}
            onClick={() => setCurrentView('marketing')}
          />
        </div>
      </div>

      {/* 3. Recent Orders Table - Now Interactive */}
      <OrdersTable onRowClick={handleOrderClick} />
    </div>
  );
};

export default DashboardView;