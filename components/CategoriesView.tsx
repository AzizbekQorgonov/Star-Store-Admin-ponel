import React, { useState, useMemo } from 'react';
import { Plus, MoreVertical, Layers, ArrowRight, ArrowLeft, Search, Box, X, Save } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Category } from '../types';

const CategoriesView: React.FC = () => {
  const { categories, addCategory, products, formatPrice } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');

  // Filter products when drilling down
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(p => p.category === selectedCategory.name);
  }, [selectedCategory, products]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const newCategoryId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Date.now().toString();
    const newCategory: Category = {
      id: newCategoryId,
      name: newCatName,
      count: 0,
      image: newCatIcon
    };

    addCategory(newCategory);
    setNewCatName('');
    setNewCatIcon('📦');
    setIsAddModalOpen(false);
  };

  // Main View
  if (!selectedCategory) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-primary dark:text-white">Kategoriyalar</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Do'kon bo'limlarini boshqarish</p>
          </div>
          <button 
             onClick={() => setIsAddModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
          >
            <Plus size={20} /> Yangi Kategoriya
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id} 
              onClick={() => setSelectedCategory(category)}
              className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300">
                      {category.image}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{category.name}</h3>
                  <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {products.filter(p => p.category === category.name).length} ta mahsulot
                      </p>
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <ArrowRight size={14} />
                      </div>
                  </div>
                  
                  {/* Decorative Progress Bar */}
                  <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full group-hover:w-full transition-all duration-1000" 
                          style={{width: '30%'}}
                      ></div>
                  </div>
              </div>
            </div>
          ))}
          
          {/* Add New Placeholder Card */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="group border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all h-full min-h-[200px]"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-500 transition-colors">
               <Plus size={28} />
            </div>
            <span className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Yangi Kategoriya</span>
            <span className="text-xs text-slate-400 mt-1">Katalogingizni kengaytiring</span>
          </button>
        </div>

        {/* Add Category Modal (Glassmorphism) */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAddModalOpen(false)}>
            <div 
               className="w-full max-w-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-2xl rounded-2xl p-6 animate-in zoom-in-95 duration-300"
               onClick={e => e.stopPropagation()}
            >
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yangi Kategoriya</h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
               </div>
               
               <form onSubmit={handleAddCategory} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nomi</label>
                    <input 
                      type="text" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Masalan: Sport kiyimlari" 
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      autoFocus
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Belgi (Emoji)</label>
                    <div className="flex gap-2">
                       {['👕', '👟', '💻', '🏠', '⌚', '📚', '⚽', '🎮', '💄'].map(emoji => (
                          <button 
                            type="button"
                            key={emoji} 
                            onClick={() => setNewCatIcon(emoji)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${newCatIcon === emoji ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}
                          >
                             {emoji}
                          </button>
                       ))}
                    </div>
                 </div>
                 <button 
                    type="submit" 
                    disabled={!newCatName}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    Saqlash
                 </button>
               </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Drill Down View (Selected Category)
  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
       <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedCategory(null)}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
             <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-primary dark:text-white flex items-center gap-2">
               <span className="text-3xl">{selectedCategory.image}</span> {selectedCategory.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Ushbu kategoriyadagi barcha mahsulotlar</p>
          </div>
       </div>

       {/* Products Grid for this Category */}
       <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          {categoryProducts.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
               {categoryProducts.map(product => (
                 <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl border border-slate-200 dark:border-slate-700">
                       {product.image.startsWith('http') ? <img src={product.image} className="w-full h-full object-cover rounded-lg"/> : product.image}
                    </div>
                    <div className="flex-1">
                       <h4 className="font-bold text-slate-800 dark:text-white">{product.name}</h4>
                       <p className="text-xs text-slate-500">{product.brand}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(product.price)}</p>
                       <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {product.stock} dona
                       </span>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
               <Box size={48} className="mb-4 text-slate-300 dark:text-slate-700" />
               <p>Bu kategoriyada hali mahsulotlar yo'q</p>
               <button className="mt-4 text-indigo-600 font-medium hover:underline">Mahsulot qo'shish</button>
            </div>
          )}
       </div>
    </div>
  );
};

export default CategoriesView;
