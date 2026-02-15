import React from 'react';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';

interface OrdersTableProps {
  onRowClick?: (id: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ onRowClick }) => {
  const { formatPrice, orders } = useStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Delivered': return 'Yetkazildi';
      case 'Processing': return 'Jarayonda';
      case 'Cancelled': return 'Bekor qilindi';
      default: return status;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">So'nggi buyurtmalar</h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300">Barchasini ko'rish</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Buyurtma ID</th>
              <th className="p-4 font-medium">Mijoz Ismi</th>
              <th className="p-4 font-medium">Mahsulot</th>
              <th className="p-4 font-medium">Narx</th>
              <th className="p-4 font-medium">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.slice(0, 5).map((order) => (
              <tr 
                key={order.id} 
                onClick={() => onRowClick && onRowClick(order.id)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-300">{order.id}</td>
                <td className="p-4 text-sm font-semibold text-slate-800 dark:text-slate-100">{order.customerName}</td>
                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{order.product}</td>
                <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">{formatPrice(Number(order.price))}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;