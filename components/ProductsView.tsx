import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, ChevronDown, Check, Square, CheckSquare, Truck, PackageCheck, Save, Minus, DollarSign, Image as ImageIcon, UploadCloud, Link as LinkIcon, Sparkles, Loader2, Coins, Palette, Layers, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, RefreshCcw, Camera, Package, AlertTriangle, Building, Briefcase, FileWarning } from 'lucide-react';
import { Product, DefectiveItem } from '../types';
import { useStore } from '../context/StoreContext';
import ConfirmationModal from './ConfirmationModal';
import BlurImage from './BlurImage';
import { imageLimitLabel, resolveImageUrl, validateImageFile } from '../utils/image';
import { uploadImageToCloudinary } from '../services/upload';

const PREDEFINED_COLORS = [
  { name: 'Oq', hex: '#FFFFFF', border: 'border-slate-200' },
  { name: 'Qora', hex: '#000000', border: 'border-slate-900' },
  { name: 'Qizil', hex: '#EF4444', border: 'border-red-500' },
  { name: 'Ko\'k', hex: '#3B82F6', border: 'border-blue-500' },
  { name: 'Yashil', hex: '#22C55E', border: 'border-green-500' },
  { name: 'Sariq', hex: '#EAB308', border: 'border-yellow-500' },
  { name: 'Pushti', hex: '#EC4899', border: 'border-pink-500' },
  { name: 'Binafsha', hex: '#A855F7', border: 'border-purple-500' },
  { name: 'Jigarrang', hex: '#78350F', border: 'border-amber-800' },
  { name: 'Kulrang', hex: '#6B7280', border: 'border-gray-500' },
  { name: 'Kumush (Silver)', hex: '#C0C0C0', border: 'border-slate-300' },
  { name: 'Oltin (Gold)', hex: '#FFD700', border: 'border-yellow-400' },
  { name: 'Titanium', hex: '#8E8E93', border: 'border-slate-400' },
  { name: 'To\'q Ko\'k (Navy)', hex: '#1e3a8a', border: 'border-blue-900' },
  { name: 'Yalpiz (Mint)', hex: '#6ee7b7', border: 'border-emerald-300' },
  { name: 'Bej (Beige)', hex: '#f5f5dc', border: 'border-stone-200' },
];

const CATEGORY_OPTIONS = ["Elektronika", "Kiyim-kechak", "Poyabzal", "Uy-ro'zg'or", "Aksessuarlar", "Kitoblar", "Oziq-ovqat", "Kosmetika"];

const ProductsView: React.FC = () => {
  const { 
    addNotification, 
    formatPrice, 
    currency, 
    products, 
    defectiveItems, 
    upsertProduct, 
    deleteProduct, 
    deleteProducts, 
    bulkUpdateProductCategory,
    addDefectiveItem,
    deleteDefectiveItem,
    updateDefectiveStatus
  } = useStore();
  
  // TABS STATE: 'products' or 'defective'
  const [activeTab, setActiveTab] = useState<'products' | 'defective'>('products');

  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  
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

  // Custom Select State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Bulk Operations State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState('');

  // Form States
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', price: 0, brand: '', category: 'Elektronika', audience: 'unisex', hasCargo: true, image: '', description: '', colorImages: {}, colorHexes: {}, stock: 0
  });
  
  // Defective Item Form Data
  const [defectiveFormData, setDefectiveFormData] = useState<Partial<DefectiveItem>>({
      productName: '', supplierName: '', cargoName: '', issueType: '', quantity: 1, price: 0, status: 'Pending'
  });

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeStock, setSizeStock] = useState<Record<string, number>>({});
  
  // Active context for Image Upload (null = main image, string = color specific)
  const [activeColorContext, setActiveColorContext] = useState<string | null>(null); 

  const [colorSearch, setColorSearch] = useState('');
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  // --- FILTER & SORT STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockStatus, setStockStatus] = useState('all'); 
  const [cargoFilter, setCargoFilter] = useState('all'); 
  const [sortBy, setSortBy] = useState('newest'); 

  // Derived values for dropdowns
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);
  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand))), [products]);

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      // 1. Search
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Category & Brand
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
      const matchesBrand = selectedBrand ? product.brand === selectedBrand : true;
      
      // 3. Price
      const matchesMinPrice = priceRange.min ? product.price >= Number(priceRange.min) : true;
      const matchesMaxPrice = priceRange.max ? product.price <= Number(priceRange.max) : true;
      
      // 4. Stock
      let matchesStock = true;
      if (stockStatus === 'low') matchesStock = product.stock > 0 && product.stock < 20;
      else if (stockStatus === 'out') matchesStock = product.stock === 0;
      else if (stockStatus === 'in_stock') matchesStock = product.stock >= 20;

      // 5. Cargo
      let matchesCargo = true;
      if (cargoFilter === 'paid') matchesCargo = product.hasCargo === true;
      else if (cargoFilter === 'free') matchesCargo = product.hasCargo === false;

      return matchesSearch && matchesCategory && matchesBrand && matchesMinPrice && matchesMaxPrice && matchesStock && matchesCargo;
    });

    // 6. Sorting
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'stock_asc': return a.stock - b.stock;
        default: return String(b.id).localeCompare(String(a.id)); // 'newest'
      }
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, priceRange, stockStatus, cargoFilter, sortBy]);

  // Operations
  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Mahsulotni o'chirish",
      message: "Haqiqatan ham ushbu mahsulotni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.",
      type: 'danger',
      onConfirm: () => {
        deleteProduct(id);
        addNotification('success', "Mahsulot o'chirildi!");
      }
    });
  };

  const handleEdit = (product: Product) => {
    setEditMode(product.id);
    setFormData({ ...product, audience: product.audience || 'unisex' });
    setSelectedColors(product.colors || []);
    setSelectedSizes(product.sizes || []);
    setSizeStock(product.sizeStock || {});
    setActiveColorContext(null);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ name: '', price: 0, brand: '', category: 'Elektronika', audience: 'unisex', hasCargo: true, image: '', description: '', colorImages: {}, colorHexes: {}, stock: 0 });
    setSelectedColors([]);
    setSelectedSizes([]);
    setSizeStock({});
    setActiveColorContext(null);
    setEditMode(null);
    setShowAddForm(false);
  };
  
  const resetDefectiveForm = () => {
    setDefectiveFormData({
        productName: '', supplierName: '', cargoName: '', issueType: '', quantity: 1, price: 0, status: 'Pending'
    });
    setShowAddForm(false);
  };

  // Image Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      const imageError = validateImageFile(file);
      if (imageError) {
        addNotification('error', imageError);
        return;
      }

      setIsUploadingImage(true);
      try {
        const result = await uploadImageToCloudinary(file, 'products');

        // If a specific color context is active, save image for THAT color
        if (activeColorContext) {
          setFormData(prev => ({
            ...prev,
            colorImages: {
              ...(prev.colorImages || {}),
              [activeColorContext]: result
            }
          }));
          setFormData(prev => (prev.image ? prev : { ...prev, image: result }));
          addNotification('success', `${activeColorContext} rangi uchun rasm yuklandi`);
        } else {
          setFormData(prev => ({ ...prev, image: result }));
          addNotification('success', "Asosiy rasm yuklandi");
        }
      } catch (error) {
        addNotification('error', (error as Error).message || "Rasm yuklanmadi");
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Update Image URL manually
  const handleImageUrlChange = (url: string) => {
      if (activeColorContext) {
          setFormData(prev => ({
                ...prev,
                colorImages: {
                    ...(prev.colorImages || {}),
                    [activeColorContext]: url
                }
          }));
          if (!formData.image) setFormData(prev => ({ ...prev, image: url }));
      } else {
          setFormData(prev => ({ ...prev, image: url }));
      }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      addNotification('warning', "Iltimos, nom va narxni kiriting!");
      return;
    }

    if (editMode !== null) {
      const nextProduct = { 
        ...formData, 
        id: editMode, 
        colors: selectedColors, 
        sizes: selectedSizes,
        sizeStock,
        stock: Number(formData.stock), 
        hasCargo: Boolean(formData.hasCargo) 
      } as Product;
      const ok = await upsertProduct(nextProduct);
      if (ok) {
        addNotification('success', "Mahsulot yangilandi!");
        resetForm();
      }
    } else {
       const newProductId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Date.now().toString();
       const newProduct = {
          ...formData,
          id: newProductId,
          stock: Number(formData.stock) || 0,
          hasCargo: Boolean(formData.hasCargo),
          image: formData.image || "📦",
          colors: selectedColors,
          sizes: selectedSizes,
          sizeStock,
        } as Product;
       const ok = await upsertProduct(newProduct);
       if (ok) {
         addNotification('success', "Yangi mahsulot qo'shildi!");
         resetForm();
       }
    }
  };
  
  const handleSaveDefective = () => {
      if (!defectiveFormData.productName || !defectiveFormData.supplierName) {
          addNotification('warning', "Mahsulot nomi va ta'minotchi (kompaniya) kiritilishi shart!");
          return;
      }
      
      const newDefectiveId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Date.now().toString();
      const newItem: DefectiveItem = {
          id: newDefectiveId,
          productName: defectiveFormData.productName || '',
          supplierName: defectiveFormData.supplierName || '',
          cargoName: defectiveFormData.cargoName || '',
          issueType: defectiveFormData.issueType || '',
          quantity: Number(defectiveFormData.quantity) || 1,
          price: Number(defectiveFormData.price) || 0,
          status: defectiveFormData.status || 'Pending',
          date: new Date().toLocaleDateString()
      };
      
      addDefectiveItem(newItem);
      addNotification('success', "Brak tovar ro'yxatga qo'shildi!");
      resetDefectiveForm();
  };
  
  const handleDeleteDefective = (id: string) => {
      setConfirmModal({
        isOpen: true,
        title: "Brak tovarni o'chirish",
        message: "Bu yozuvni o'chirishni tasdiqlaysizmi?",
        type: 'danger',
        onConfirm: () => {
          deleteDefectiveItem(id);
          addNotification('success', "O'chirildi");
        }
      });
  };
  
  const handleStatusChangeDefective = (id: string, status: DefectiveItem['status']) => {
      updateDefectiveStatus(id, status);
      addNotification('success', "Status yangilandi!");
  };

  // AI Generation Function
  const generateProductDetails = async () => {
    if (!formData.name) {
      addNotification('warning', 'Iltimos, avval mahsulot nomini kiriting');
      return;
    }

    setIsGenerating(true);
    try {
      const name = String(formData.name || '').trim();
      const lower = name.toLowerCase();

      const categoryGuess =
        CATEGORY_OPTIONS.find((category) => lower.includes(category.toLowerCase())) ||
        (lower.includes('phone') || lower.includes('iphone') || lower.includes('laptop') ? 'Elektronika' :
        lower.includes('shirt') || lower.includes('hoodie') || lower.includes('dress') ? "Kiyim-kechak" :
        lower.includes('shoe') || lower.includes('kross') ? 'Poyabzal' :
        lower.includes('book') ? 'Kitoblar' : 'Aksessuarlar');

      const baseBrand = name.split(' ')[0] || 'Generic';
      const brandGuess = baseBrand.length <= 2 ? 'Generic' : baseBrand;
      const priceEstimate =
        lower.includes('iphone') || lower.includes('laptop') ? 799 :
        lower.includes('watch') ? 249 :
        lower.includes('shoe') ? 120 : 49;

      const suggested = PREDEFINED_COLORS.slice(0, 4);
      const colorNames = suggested.map((c) => c.name);
      const newColorImages: Record<string, string> = {};
      const newColorHexes: Record<string, string> = {};

      for (const color of suggested) {
        const bgHex = color.hex.replace('#', '');
        const textHex = ['Oq', 'Kumush (Silver)', 'Sariq', 'Bej (Beige)'].includes(color.name) ? '000000' : 'ffffff';
        const encodedText = encodeURIComponent(`${name}\n(${color.name})`);
        newColorHexes[color.name] = color.hex;
        newColorImages[color.name] = `https://placehold.co/600x600/${bgHex}/${textHex}?text=${encodedText}`;
      }

      setSelectedColors((prev) => Array.from(new Set([...prev, ...colorNames])));
      setFormData((prev) => ({
        ...prev,
        brand: prev.brand || brandGuess,
        category: prev.category || categoryGuess,
        description:
          prev.description ||
          `${name} uchun qisqa tavsif: zamonaviy dizayn, kundalik foydalanish uchun qulay va sifatli tanlov.`,
        price: prev.price || priceEstimate,
        colorImages: { ...(prev.colorImages || {}), ...newColorImages },
        colorHexes: { ...(prev.colorHexes || {}), ...newColorHexes },
        image: prev.image || newColorImages[colorNames[0]],
      }));

      if (colorNames.length > 0) {
        setActiveColorContext(colorNames[0]);
      }

      addNotification('success', "Xavfsiz rejimda lokal tavsiyalar yaratildi.");
    } catch (error) {
      console.error("AI Error:", error);
      addNotification('error', 'AI xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Bulk Selection Logic
  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: "Ommaviy o'chirish",
      message: `Rostdan ham ${selectedProductIds.length} ta mahsulotni o'chirmoqchimisiz?`,
      type: 'danger',
      onConfirm: () => {
        deleteProducts(selectedProductIds);
        setSelectedProductIds([]);
        addNotification('success', 'Mahsulotlar muvaffaqiyatli o\'chirildi');
      }
    });
  };

  const handleBulkCategoryUpdate = () => {
    if (!bulkCategoryTarget) {
      addNotification('warning', "Kategoriyani tanlang!");
      return;
    }
    bulkUpdateProductCategory(selectedProductIds, bulkCategoryTarget);
    addNotification('success', `${selectedProductIds.length} ta mahsulot kategoriyasi o'zgartirildi.`);
    setIsBulkCategoryModalOpen(false);
    setSelectedProductIds([]);
    setBulkCategoryTarget('');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange({ min: '', max: '' });
    setStockStatus('all');
    setCargoFilter('all');
    setSortBy('newest');
  };

  // Color logic helpers
  const filteredColors = useMemo(() => {
    return PREDEFINED_COLORS.filter(c => 
      c.name.toLowerCase().includes(colorSearch.toLowerCase())
    );
  }, [colorSearch]);
  
  const toggleColor = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
        setSelectedColors(selectedColors.filter(c => c !== colorName));
        if (activeColorContext === colorName) setActiveColorContext(null);
    } else {
        setSelectedColors([...selectedColors, colorName]);
        setActiveColorContext(colorName); 
    }
    setColorSearch('');
  };
  
  const removeColor = (colorName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedColors(selectedColors.filter(c => c !== colorName));
      if (activeColorContext === colorName) setActiveColorContext(null);
  };

  const toggleSize = (sizeName: string) => {
    if (selectedSizes.includes(sizeName)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== sizeName));
      setSizeStock((prev) => {
        const next = { ...prev };
        delete next[sizeName];
        return next;
      });
      return;
    }

    setSelectedSizes([...selectedSizes, sizeName]);
    setSizeStock((prev) => ({ ...prev, [sizeName]: Number(prev[sizeName] ?? 0) }));
  };

  const currentPreviewImage = useMemo(() => {
      if (activeColorContext && formData.colorImages && formData.colorImages[activeColorContext]) {
          return formData.colorImages[activeColorContext];
      }
      return formData.image;
  }, [activeColorContext, formData.colorImages, formData.image]);

  const isImageString = (str?: string) => {
    return str?.startsWith('http') || str?.startsWith('data:image');
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

      {/* TABS HEADER */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
         <button 
           onClick={() => setActiveTab('products')}
           className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
         >
            Barcha Mahsulotlar
         </button>
         <button 
           onClick={() => setActiveTab('defective')}
           className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'defective' ? 'bg-red-50 dark:bg-red-900/20 shadow-sm text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
         >
            <AlertTriangle size={16} /> Brak (Yaroqsiz) Tovarlar
         </button>
      </div>
      
      {/* =======================
          VIEW 1: PRODUCTS
      ======================== */}
      {activeTab === 'products' && (
      <>
      {/* Bulk Action Bar (Floating) */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-slate-700">
           <span className="font-semibold text-sm">{selectedProductIds.length} ta tanlandi</span>
           <div className="h-4 w-px bg-slate-700"></div>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsBulkCategoryModalOpen(true)}
                className="flex items-center gap-2 hover:text-indigo-300 transition-colors text-sm font-medium"
              >
                <Layers size={16} /> Kategoriya o'zgartirish
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 hover:text-red-400 transition-colors text-sm font-medium"
              >
                <Trash2 size={16} /> O'chirish
              </button>
           </div>
           <button onClick={() => setSelectedProductIds([])} className="ml-2 hover:bg-slate-800 rounded-full p-1">
             <X size={16} />
           </button>
        </div>
      )}

      {/* Bulk Category Modal */}
      {isBulkCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsBulkCategoryModalOpen(false)}>
          <div 
             className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 animate-in zoom-in-95 duration-300"
             onClick={e => e.stopPropagation()}
          >
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Kategoriyani o'zgartirish</h3>
             <p className="text-sm text-slate-500 mb-4">
               Tanlangan {selectedProductIds.length} ta mahsulot uchun yangi kategoriya tanlang.
             </p>
             
             <div className="space-y-4">
               <div className="relative">
                 <select 
                   value={bulkCategoryTarget} 
                   onChange={(e) => setBulkCategoryTarget(e.target.value)}
                   className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                 >
                    <option value="" disabled>Tanlang...</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{c}</option>)}
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
               </div>
               
               <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => setIsBulkCategoryModalOpen(false)}
                   className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium"
                 >
                   Bekor qilish
                 </button>
                 <button 
                   onClick={handleBulkCategoryUpdate}
                   className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                 >
                   Saqlash
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">Mahsulotlar va Ombor Boshqaruvi</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Do'kondagi barcha mahsulotlar va ularning zaxira holati (Jami: {products.length})</p>
        </div>
        <button 
          onClick={() => {
             resetForm();
             setShowAddForm(!showAddForm);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Plus size={20} />
          <span>Yangi Mahsulot</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-indigo-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {editMode ? <Edit size={20} className="text-indigo-600"/> : <Plus size={20} className="text-green-600"/>}
              {editMode ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
            </h3>
            <button 
               onClick={generateProductDetails}
               disabled={isGenerating || !formData.name}
               className={`
                 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                 ${isGenerating || !formData.name 
                   ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500' 
                   : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 shadow-sm'}
               `}
               title="Nomini yozing va AI yordamida to'ldiring"
            >
               {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
               {isGenerating ? 'AI o\'ylamoqda...' : 'AI bilan to\'ldirish'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mahsulot nomi</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Masalan: iPhone 15, Nike Air Max" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Narx (Asosiy Valyuta: $)</label>
                   {/* Custom Modern Transparent Spinbox */}
                   <div className="relative group flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-900/30 transition-all overflow-hidden">
                      <div className="pl-3 text-slate-400 pointer-events-none">
                         <DollarSign size={16} />
                      </div>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full pl-2 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        placeholder="0.00" 
                       />
                       
                       {/* Subtle Spin Buttons on the Right */}
                       <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-slate-200 dark:border-slate-700 w-8">
                          <button
                              type="button"
                              onClick={() => setFormData(p => ({...p, price: Number(p.price || 0) + 10}))}
                              className="flex-1 bg-white/50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors active:bg-indigo-100"
                          >
                              <Plus size={10} strokeWidth={3} />
                          </button>
                          <div className="h-[1px] bg-slate-200 dark:bg-slate-700"></div>
                          <button
                              type="button"
                              onClick={() => setFormData(p => ({...p, price: Math.max(0, Number(p.price || 0) - 10)}))}
                              className="flex-1 bg-white/50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors active:bg-indigo-100"
                          >
                              <Minus size={10} strokeWidth={3} />
                          </button>
                       </div>
                   </div>
                   <p className="text-[10px] text-slate-400 mt-1">*Hisob-kitoblar uchun narxlar AQSh dollarida saqlanadi.</p>
                   <div className="mt-2 flex items-center gap-2">
                     <button
                       type="button"
                       onClick={() => setFormData((p) => ({ ...p, price: Math.round((Number(p.price || 0) * 1.3) * 100) / 100 }))}
                       className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                     >
                       +30% Cargo
                     </button>
                     <span className="text-[10px] text-slate-400">Ichki komissiya qo'shish (xaridorga alohida ko'rsatilmaydi)</span>
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Brend</label>
                   <input 
                     type="text" 
                     value={formData.brand}
                     onChange={e => setFormData({...formData, brand: e.target.value})}
                     className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                     placeholder="Apple" 
                    />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Custom Category Dropdown */}
                <div className="relative" ref={categoryDropdownRef}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategoriya</label>
                  <button 
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-left flex justify-between items-center transition-colors hover:border-indigo-400"
                  >
                    {formData.category || "Tanlang..."}
                    <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <div 
                          key={cat}
                          onClick={() => {
                            setFormData({...formData, category: cat});
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`
                            px-4 py-2.5 cursor-pointer text-sm transition-colors flex items-center justify-between
                            ${formData.category === cat 
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}
                          `}
                        >
                          {cat}
                          {formData.category === cat && <Check size={14} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kimlar uchun</label>
                  <div className="relative">
                    <select
                      value={formData.audience || 'unisex'}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value as Product['audience'] })}
                      className="appearance-none w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white hover:border-indigo-400 transition-colors pr-9"
                    >
                      <option value="unisex">Unisex</option>
                      <option value="male">Erkaklar (Male)</option>
                      <option value="female">Ayollar (Female)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                
                {/* Cargo Toggle */}
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kargo Xizmati</label>
                   <div className="flex items-center h-[42px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.hasCargo} 
                          onChange={(e) => setFormData({...formData, hasCargo: e.target.checked})} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {formData.hasCargo ? "Mavjud (Pullik)" : "Mavjud emas (Bepul)"}
                        </span>
                      </label>
                   </div>
                </div>
              </div>

              {/* Description Field */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tavsif (Description)</label>
                 <textarea
                   value={formData.description}
                   onChange={e => setFormData({...formData, description: e.target.value})}
                   className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-sm"
                   placeholder="Mahsulot haqida qisqacha ma'lumot..."
                 />
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ombor Zaxirasi</label>
                  
                  {/* Modern Stock Spin Box */}
                   <div className="relative group flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-900/30 transition-all overflow-hidden">
                      <div className="pl-3 text-slate-400 pointer-events-none">
                         <Package size={16} />
                      </div>
                      <input 
                        type="number"
                        value={formData.stock || 0}
                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                        className="w-full pl-2 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                       />
                       
                       <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-slate-200 dark:border-slate-700 w-8">
                          <button
                              type="button"
                              onClick={() => setFormData(p => ({...p, stock: Number(p.stock || 0) + 1}))}
                              className="flex-1 bg-white/50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors active:bg-indigo-100"
                          >
                              <Plus size={10} strokeWidth={3} />
                          </button>
                          <div className="h-[1px] bg-slate-200 dark:bg-slate-700"></div>
                          <button
                              type="button"
                              onClick={() => setFormData(p => ({...p, stock: Math.max(0, Number(p.stock || 0) - 1)}))}
                              className="flex-1 bg-white/50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors active:bg-indigo-100"
                          >
                              <Minus size={10} strokeWidth={3} />
                          </button>
                       </div>
                   </div>

                  <p className="text-xs text-slate-500 mt-1">
                      {Number(formData.stock) < 5 ? <span className="text-red-500 font-bold">Kam qolgan!</span> : <span className="text-green-500">Yetarli</span>}
                  </p>
              </div>

            </div>
            
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">O'lchamlar (Sizes)</label>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <label key={size} className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleSize(size)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedSizes.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    O'lcham bo'yicha qoldiq soni
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSizes.map((size) => (
                      <div key={size} className="flex items-center gap-2">
                        <span className="w-10 text-xs font-semibold text-slate-500">{size}</span>
                        <input
                          type="number"
                          min={0}
                          value={Number(sizeStock[size] ?? 0)}
                          onChange={(e) =>
                            setSizeStock((prev) => ({
                              ...prev,
                              [size]: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Yangilangan Rang Tanlash qismi (Enhanced Color Picker) */}
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mavjud ranglar</label>
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                     Rangni tanlab, unga mos rasmni yuklang
                  </span>
                </div>
                
                {/* Selected Colors Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedColors.length > 0 ? (
                    selectedColors.map(colorName => {
                        const colorData = PREDEFINED_COLORS.find(c => c.name.toLowerCase() === colorName.toLowerCase());
                        const customHex = formData.colorHexes?.[colorName];
                        const isActive = activeColorContext === colorName;
                        
                        // Use predefined hex OR custom hex from AI/Input OR default gray
                        const bgStyle = colorData 
                            ? { backgroundColor: colorData.hex } 
                            : (customHex ? { backgroundColor: customHex } : { backgroundColor: '#cbd5e1' });
                        
                        return (
                        <div 
                           key={colorName} 
                           onClick={() => setActiveColorContext(isActive ? null : colorName)}
                           className={`
                             cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all animate-in fade-in zoom-in-95
                             ${isActive 
                               ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 scale-105' 
                               : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}
                           `}
                        >
                            <span 
                              className="w-4 h-4 rounded-full border border-black/10 shadow-sm" 
                              style={bgStyle}
                            ></span>
                            <span className="text-sm font-medium">{colorName}</span>
                            <button 
                               onClick={(e) => removeColor(colorName, e)} 
                               className={`ml-1 p-0.5 rounded-full ${isActive ? 'hover:bg-white/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                              <X size={14} />
                            </button>
                        </div>
                        );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic mb-1 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 w-full text-center">
                       Hozircha rang tanlanmagan. Ro'yxatdan qo'shing yoki AI dan so'rang.
                    </p>
                  )}
                </div>

                {/* Dropdown Input Area */}
                <div className="relative" ref={colorDropdownRef}>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Palette size={18} />
                    </div>
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" 
                      placeholder="Rang qidirish va qo'shish..." 
                      value={colorSearch}
                      onChange={(e) => {
                        setColorSearch(e.target.value);
                        setShowColorDropdown(true);
                      }}
                      onFocus={() => setShowColorDropdown(true)}
                    />
                    <div 
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" 
                      onClick={() => setShowColorDropdown(!showColorDropdown)}
                    >
                        <ChevronDown size={16} className={`text-slate-400 hover:text-slate-600 transition-transform ${showColorDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {showColorDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto p-2 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                      {filteredColors.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1">
                            {filteredColors.map(color => {
                              const isSelected = selectedColors.includes(color.name);
                              return (
                                <div 
                                    key={color.name} 
                                    onClick={() => !isSelected && toggleColor(color.name)}
                                    className={`
                                      group flex items-center justify-between p-2 rounded-lg transition-all border border-transparent
                                      ${isSelected 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 cursor-default opacity-60' 
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer hover:border-slate-100 dark:hover:border-slate-700'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className={`w-8 h-8 rounded-full border-2 ${color.border} shadow-sm group-hover:scale-110 transition-transform relative`} 
                                            style={{backgroundColor: color.hex}}
                                        >
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{color.name}</p>
                                            <p className="text-xs text-slate-400 font-mono uppercase">{color.hex}</p>
                                        </div>
                                    </div>
                                    {isSelected ? (
                                       <Check size={16} className="text-indigo-500" />
                                    ) : (
                                       <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                            <Plus size={16} />
                                       </div>
                                    )}
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <Search size={18} />
                            </div>
                            <p className="text-sm">Bunday rang topilmadi</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Functional Image Upload Section */}
              <div className={`transition-all duration-300 rounded-xl p-4 border ${activeColorContext ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-500/50 shadow-md' : 'border-transparent'}`}>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                     Mahsulot Rasmi {activeColorContext ? `(${activeColorContext} rang uchun)` : '(Asosiy)'}
                  </label>
                  {activeColorContext ? (
                     <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        {activeColorContext} tahrirlanmoqda
                     </span>
                  ) : (
                     <span className="text-xs text-slate-400">Asosiy rasm barcha ranglar uchun umumiy bo'ladi</span>
                  )}
                </div>
                
                {/* 1. URL Input */}
                <div className="mb-3 relative">
                  <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 size={16} ${activeColorContext ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <input 
                    type="text" 
                    value={activeColorContext && formData.colorImages && formData.colorImages[activeColorContext] ? formData.colorImages[activeColorContext] : (!activeColorContext && formData.image && !formData.image.startsWith('data:') ? formData.image : '')}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder={activeColorContext ? `${activeColorContext} rang uchun rasm URL manzili...` : "Asosiy rasm URL manzili..."} 
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-all
                      ${activeColorContext 
                        ? 'border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 focus:ring-indigo-500' 
                        : 'border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-indigo-500'
                      }
                    `}
                  />
                </div>

                {/* 2. File Upload Area */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                  disabled={isUploadingImage}
                />
                
                <div className="flex gap-4">
                   <div 
                      onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                      className={`
                        flex-1 border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-2
                        ${activeColorContext 
                          ? 'border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}
                      `}
                   >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeColorContext ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500'}`}>
                         <UploadCloud size={20} />
                      </div>
                      <span className={`text-xs ${activeColorContext ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                        {isUploadingImage
                          ? 'Yuklanmoqda...'
                          : `${activeColorContext ? `${activeColorContext} rang rasmini yuklash` : 'Kompyuterdan yuklash'} (max ${imageLimitLabel})`}
                      </span>
                   </div>

                   {/* 3. Image Preview */}
                   {(currentPreviewImage || formData.image) && (
                     <div className="w-28 h-28 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 relative group overflow-hidden shadow-sm">
                        {isImageString(currentPreviewImage) ? (
                            <BlurImage src={resolveImageUrl(currentPreviewImage || formData.image)} alt="Preview" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-md transition-transform group-hover:scale-105" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-3xl bg-slate-50 dark:bg-slate-900 rounded-md">
                             {currentPreviewImage || formData.image}
                           </div>
                        )}
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             if(activeColorContext) {
                                setFormData(prev => {
                                    const next = {...prev};
                                    if(next.colorImages) delete next.colorImages[activeColorContext];
                                    return next;
                                });
                             } else {
                                setFormData({...formData, image: ''});
                             }
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 hover:scale-100"
                        >
                           <X size={12} />
                        </button>
                        {activeColorContext && (
                           <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 text-white text-[9px] text-center py-0.5 backdrop-blur-sm">
                              {activeColorContext}
                           </div>
                        )}
                     </div>
                   )}
                </div>
              </div>

            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={resetForm} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Bekor qilish</button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2"
            >
              <Save size={18} />
              {editMode ? "Yangilash" : "Saqlash"}
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Nomi, brend yoki kategoriya bo'yicha qidiruv..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          
          {/* Sorting Dropdown */}
          <div className="relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">
                <ArrowUpDown size={18} />
             </div>
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
               className="appearance-none pl-10 pr-10 py-2.5 h-full bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer transition-colors"
             >
                <option value="newest" className="bg-white dark:bg-slate-900">Eng yangi</option>
                <option value="price_asc" className="bg-white dark:bg-slate-900">Narx: Arzonroq</option>
                <option value="price_desc" className="bg-white dark:bg-slate-900">Narx: Qimmatroq</option>
                <option value="name_asc" className="bg-white dark:bg-slate-900">Nomi: A-Z</option>
                <option value="stock_asc" className="bg-white dark:bg-slate-900">Ombor: Kam qolgan</option>
             </select>
             <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors shadow-sm ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filter</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Extended Filter Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg animate-in fade-in slide-in-from-top-2 z-10">
             <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                <SlidersHorizontal size={18} /> Kengaytirilgan Filterlar
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Category */}
                <div className="relative">
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Kategoriya</label>
                   <div className="relative">
                      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="appearance-none w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none pr-8 transition-colors">
                          <option value="" className="bg-white dark:bg-slate-800">Barcha kategoriyalar</option>
                          {categories.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                   </div>
                </div>

                {/* 2. Brand */}
                <div className="relative">
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Brend</label>
                   <div className="relative">
                      <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="appearance-none w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none pr-8 transition-colors">
                          <option value="" className="bg-white dark:bg-slate-800">Barcha brendlar</option>
                          {brands.map(b => <option key={b} value={b} className="bg-white dark:bg-slate-800">{b}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                   </div>
                </div>

                {/* 3. Price Range */}
                 <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Narx ({currency})</label>
                   <div className="flex gap-2 items-center">
                     <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input 
                          type="number" 
                          placeholder="Min" 
                          value={priceRange.min} 
                          onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} 
                          className="w-full pl-5 p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                     </div>
                     <span className="text-slate-400">-</span>
                     <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input 
                          type="number" 
                          placeholder="Max" 
                          value={priceRange.max} 
                          onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} 
                          className="w-full pl-5 p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                     </div>
                   </div>
                </div>

                {/* 4. Stock Status */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Ombor Holati</label>
                    <div className="relative">
                      <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} className="appearance-none w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none pr-8 transition-colors">
                          <option value="all" className="bg-white dark:bg-slate-800">Hammasi</option>
                          <option value="in_stock" className="bg-white dark:bg-slate-800">Mavjud (&gt;20)</option>
                          <option value="low" className="bg-white dark:bg-slate-800">Kam qolgan (&lt;20)</option>
                          <option value="out" className="bg-white dark:bg-slate-800">Tugagan (0)</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                   </div>
                </div>

                {/* 5. Cargo Filter */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Kargo / Yetkazib berish</label>
                    <div className="relative">
                      <select value={cargoFilter} onChange={(e) => setCargoFilter(e.target.value)} className="appearance-none w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none pr-8 transition-colors">
                          <option value="all" className="bg-white dark:bg-slate-800">Hammasi</option>
                          <option value="paid" className="bg-white dark:bg-slate-800">Pullik Kargo</option>
                          <option value="free" className="bg-white dark:bg-slate-800">Bepul Yetkazib berish</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                   </div>
                </div>

                {/* Clear Button */}
                <div className="flex items-end lg:col-start-4">
                   <button 
                     onClick={clearFilters} 
                     className="w-full py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-900/20 dark:text-slate-300 dark:hover:text-red-400 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                   >
                     <RefreshCcw size={16} /> Tozalash
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 w-12">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-indigo-600">
                     {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={20} className="text-indigo-600"/> : <Square size={20}/>}
                  </button>
                </th>
                <th className="p-4">Rasm</th>
                <th className="p-4">Nomi</th>
                <th className="p-4">Kategoriya</th>
                <th className="p-4">Jins</th>
                <th className="p-4 cursor-pointer hover:text-indigo-600 flex items-center gap-1 group" onClick={() => setSortBy(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}>
                   Narx
                   <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </th>
                <th className="p-4">Kargo</th>
                <th className="p-4">Omborda</th>
                <th className="p-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <tr key={product.id} className={`transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                      <td className="p-4">
                         <button onClick={() => toggleSelectProduct(product.id)} className="flex items-center justify-center">
                            {isSelected ? <CheckSquare size={20} className="text-indigo-600"/> : <Square size={20} className="text-slate-300 hover:text-slate-400"/>}
                         </button>
                      </td>
                      <td className="p-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                          {isImageString(product.image) ? (
                            <BlurImage src={resolveImageUrl(product.image)} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          ) : (
                            <span>{product.image}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800 dark:text-white">
                        <div>{product.name}</div>
                        <div className="text-xs text-slate-400">{product.brand}</div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{product.category}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 capitalize">{product.audience || 'unisex'}</td>
                      <td className="p-4 font-bold text-slate-800 dark:text-white">{formatPrice(product.price)}</td>
                      <td className="p-4">
                        {product.hasCargo ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" title="Pullik yetkazib berish">
                            <Truck size={14} /> +$
                          </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full" title="Bepul yetkazib berish">
                            <PackageCheck size={14} /> Free
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock < 5 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : (product.stock < 20 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')}`}>
                          {product.stock} dona
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Hech narsa topilmadi. Filtrlarni o'zgartirib ko'ring.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* =======================
          VIEW 2: DEFECTIVE ITEMS
      ======================== */}
      {activeTab === 'defective' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                 <div>
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle /> Yaroqsiz (Brak) Tovarlar
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Buzuq yoki qaytarilgan tovarlarni ro'yxatga olish</p>
                 </div>
                 <button 
                  onClick={() => {
                     resetDefectiveForm();
                     setShowAddForm(!showAddForm);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                >
                  <Plus size={20} />
                  <span>Brak qo'shish</span>
                </button>
              </div>

              {/* Add Defective Item Form */}
              {showAddForm && (
                 <div className="bg-red-50/50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30 mb-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Yangi yozuv qo'shish</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mahsulot nomi</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={defectiveFormData.productName}
                                    onChange={e => setDefectiveFormData({...defectiveFormData, productName: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                    placeholder="Masalan: iPhone 15 ekran singan"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Yetkazib beruvchi (Kompaniya)</label>
                             <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={defectiveFormData.supplierName}
                                    onChange={e => setDefectiveFormData({...defectiveFormData, supplierName: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                    placeholder="Masalan: Apple Distribution LLC"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kargo Firmasi</label>
                             <div className="relative">
                                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={defectiveFormData.cargoName}
                                    onChange={e => setDefectiveFormData({...defectiveFormData, cargoName: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                    placeholder="Masalan: Silk Road Cargo"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Muammo turi / Sabab</label>
                             <div className="relative">
                                <FileWarning className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={defectiveFormData.issueType}
                                    onChange={e => setDefectiveFormData({...defectiveFormData, issueType: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                    placeholder="Siniq, rangi boshqa, ishlamayapti..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Soni</label>
                                <input 
                                    type="number" 
                                    value={defectiveFormData.quantity}
                                    onChange={e => setDefectiveFormData({...defectiveFormData, quantity: Number(e.target.value)})}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zarar Summasi ($)</label>
                                <input 
                                    type="number" 
                                    value={defectiveFormData.price}
                                    onChange={e => setDefectiveFormData({...defectiveFormData, price: Number(e.target.value)})}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg">Bekor qilish</button>
                        <button onClick={handleSaveDefective} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md">Saqlash</button>
                    </div>
                 </div>
              )}

              {/* Defective Items Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm uppercase tracking-wider">
                                <th className="p-4">Mahsulot</th>
                                <th className="p-4">Kompaniya (Supplier)</th>
                                <th className="p-4">Kargo</th>
                                <th className="p-4">Muammo</th>
                                <th className="p-4">Soni / Summa</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {defectiveItems.length > 0 ? (
                                defectiveItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-4 font-medium text-slate-800 dark:text-white">
                                            {item.productName}
                                            <div className="text-xs text-slate-400">{item.date}</div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                            <Building size={14} className="text-slate-400"/> {item.supplierName}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            <span className="flex items-center gap-2"><Truck size={14} className="text-slate-400"/> {item.cargoName}</span>
                                        </td>
                                        <td className="p-4 text-red-500 text-sm">{item.issueType}</td>
                                        <td className="p-4 font-bold">
                                            {item.quantity} dona / {formatPrice(item.price)}
                                        </td>
                                        <td className="p-4">
                                            <select 
                                                value={item.status}
                                                onChange={(e) => handleStatusChangeDefective(item.id, e.target.value as any)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer outline-none appearance-none transition-all
                                                    ${item.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : 
                                                      item.status === 'Returned' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 
                                                      'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}
                                                `}
                                            >
                                                <option value="Pending">Kutilmoqda</option>
                                                <option value="Returned">Qaytarildi</option>
                                                <option value="Solved">Hal qilindi</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleDeleteDefective(item.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        Brak tovarlar ro'yxati bo'sh.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ProductsView;
