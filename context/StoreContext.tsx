import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Notification, User, Product, Order, Customer, Category, Coupon, DefectiveItem, SiteSection } from '../types';

// --- INITIAL DATA RESET TO ZERO/EMPTY ---
const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_CATEGORIES: Category[] = [];

const INITIAL_ORDERS: Order[] = [];

const INITIAL_COUPONS: Coupon[] = [];

const INITIAL_DEFECTIVE: DefectiveItem[] = [];
// --- MOCK DATA TUGADI ---

interface StoreContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  
  // Notification System
  notifications: Notification[]; // For Toasts
  inbox: Notification[]; // For Bell Icon History
  addNotification: (type: Notification['type'], message: string, title?: string) => void;
  removeNotification: (id: string | number) => void;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
  clearInbox: () => void;

  darkMode: boolean;
  toggleDarkMode: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  formatPrice: (amount: number) => string;
  
  // New Global Data
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  upsertProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<void>;
  deleteProducts: (ids: string[]) => Promise<void>;
  bulkUpdateProductCategory: (ids: string[], category: string) => Promise<void>;
  defectiveItems: DefectiveItem[];
  setDefectiveItems: React.Dispatch<React.SetStateAction<DefectiveItem[]>>;
  addDefectiveItem: (item: DefectiveItem) => Promise<void>;
  deleteDefectiveItem: (id: string) => Promise<void>;
  updateDefectiveStatus: (id: string, status: DefectiveItem['status']) => Promise<void>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  upsertCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addCategory: (category: Category) => Promise<void>;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  addCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;

  siteSections: SiteSection[];
  setSiteSections: React.Dispatch<React.SetStateAction<SiteSection[]>>;
  upsertSiteSection: (section: SiteSection) => Promise<void>;
  deleteSiteSection: (id: string) => Promise<void>;
  reorderSiteSections: (sections: SiteSection[]) => Promise<void>;
  
  // Navigation State for Orders
  focusedOrderId: string | null;
  setFocusedOrderId: (id: string | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const resolveApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) return envUrl;
  if (import.meta.env.PROD) return 'https://star-store-backend.onrender.com';
  return 'http://localhost:5000';
};

const API_BASE_URL = resolveApiBaseUrl();
const LIVE_REFRESH_MS = 15000;
const ADMIN_AUTH_TOKEN_KEY = 'admin_auth_token';

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

const apiRequest = async (path: string, options: ApiRequestOptions = {}) => {
  const { auth = true, headers, body, ...rest } = options;
  const finalHeaders = new Headers(headers || {});
  if (body !== undefined && !(body instanceof FormData) && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (auth && typeof window !== 'undefined') {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY) || '';
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body,
    headers: finalHeaders,
  });
  if (!response.ok) {
    let errorMessage = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.error) errorMessage = body.error;
    } catch {
      // no-op
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const mapBackendUserToAdminUser = (input: any): User => {
  const role = String(input?.role || 'editor').toLowerCase() === 'admin' ? 'admin' : 'editor';
  const name = String(input?.username || input?.email || 'Admin');
  const email = String(input?.email || '');
  const avatar = String(input?.avatar_url || '')
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff`;

  return {
    name,
    email,
    role,
    avatar,
    permissions:
      role === 'admin'
        ? ['Barcha huquqlar', 'Foydalanuvchilarni boshqarish', 'Moliyaviy hisobotlar', 'Tizim sozlamalari']
        : ["Mahsulotlarni ko'rish", "Buyurtmalarni tahrirlash", 'Mijozlar bilan ishlash'],
  };
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]); // Toast queue
  const [inbox, setInbox] = useState<Notification[]>([]); // Persistent history (Bell)
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Global Data States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [defectiveItems, setDefectiveItems] = useState<DefectiveItem[]>(INITIAL_DEFECTIVE);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [siteSections, setSiteSections] = useState<SiteSection[]>([]);
  
  // Navigation State
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);
  const lastLoadWarningRef = useRef<string>('');

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      if (typeof window === 'undefined') {
        if (mounted) setIsLoading(false);
        return;
      }

      const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY) || '';
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const data = await apiRequest('/me', { method: 'GET' });
        if (!data?.success || !data?.user) {
          throw new Error('Session is invalid');
        }
        const mapped = mapBackendUserToAdminUser(data.user);
        if (mapped.role !== 'admin') {
          throw new Error('Admin ruxsati yoq');
        }
        if (mounted) {
          setUser(mapped);
        }
      } catch {
        localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  // Currency State
  const [currency, setCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currency') || 'USD';
    }
    return 'USD';
  });

  // Exchange Rates (Mock - in real app fetch from API)
  const exchangeRates: Record<string, number> = {
    USD: 1,
    UZS: 12650, // 1 USD = 12650 UZS
    EUR: 0.92,
    RUB: 91.5
  };

  const formatPrice = (amount: number) => {
    const rate = exchangeRates[currency] || 1;
    const convertedAmount = amount * rate;

    return new Intl.NumberFormat(currency === 'UZS' ? 'uz-UZ' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'UZS' ? 0 : 2, // No decimals for UZS usually
    }).format(convertedAmount);
  };

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);
  
  // Dark mode logic
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Auth logic
  const login = async (identifier: string, password: string) => {
    try {
      const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
      const payload = { login: normalizedIdentifier, password: String(password || '') };
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify(payload),
      });

      if (!data?.success || !data?.user || !data?.token) {
        return { success: false, error: 'Login failed' };
      }

      const mappedUser = mapBackendUserToAdminUser(data.user);
      if (mappedUser.role !== 'admin') {
        return { success: false, error: 'Admin ruxsati yoq. ADMIN_EMAILS ni tekshiring.' };
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, String(data.token));
      }
      setUser(mappedUser);
      return { success: true, user: mappedUser };
    } catch (error) {
      return { success: false, error: (error as Error).message || 'Login failed' };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    }
    setUser(null);
    setProducts([]);
    setDefectiveItems([]);
    setOrders([]);
    setCustomers([]);
    setCategories([]);
    setCoupons([]);
    setSiteSections([]);
    addNotification('info', 'Tizimdan chiqildi.');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
      addNotification('success', 'Profil ma\'lumotlari yangilandi');
    }
  };

  // Notification logic
  const addNotification = (type: Notification['type'], message: string, title?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Determine title if not provided
    let finalTitle = title;
    if (!finalTitle) {
        switch(type) {
            case 'success': finalTitle = 'Muvaffaqiyatli'; break;
            case 'error': finalTitle = 'Xatolik'; break;
            case 'warning': finalTitle = 'Diqqat'; break;
            case 'order': finalTitle = 'Yangi Buyurtma'; break;
            case 'alert': finalTitle = 'Tizim Xabari'; break;
            default: finalTitle = 'Ma\'lumot';
        }
    }

    const newNotification: Notification = { 
        id, 
        type, 
        message, 
        title: finalTitle,
        time: 'Hozir', 
        read: false 
    };

    // 1. Add to Toast (Temporary)
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      removeNotification(id);
    }, 4000);

    // 2. Add to Inbox (Persistent History)
    setInbox(prev => [newNotification, ...prev]);
  };

  const mapProductFromDb = (row: any): Product => ({
    id: row.id,
    name: row.name,
    nameI18n: row.name_i18n || undefined,
    brand: row.brand,
    price: Number(row.price ?? 0),
    category: row.category,
    categoryI18n: row.category_i18n || undefined,
    audience: row.audience || 'unisex',
    sizes: row.sizes || [],
    sizeStock: row.size_stock || undefined,
    colors: row.colors || [],
    colorImages: row.color_images || undefined,
    colorHexes: row.color_hexes || undefined,
    image: row.image,
    gallery: row.gallery || [],
    material: row.material || undefined,
    season: row.season || undefined,
    fabricCare: row.fabric_care || undefined,
    fit: row.fit || undefined,
    stock: Number(row.stock ?? 0),
    hasCargo: Boolean(row.has_cargo),
    description: row.description || undefined,
    descriptionI18n: row.description_i18n || undefined,
  });

  const mapProductToDb = (product: Product) => ({
    id: product.id,
    name: product.name,
    name_i18n: product.nameI18n || null,
    brand: product.brand,
    price: product.price,
    category: product.category,
    category_i18n: product.categoryI18n || null,
    audience: product.audience || 'unisex',
    sizes: product.sizes,
    size_stock: product.sizeStock || null,
    colors: product.colors,
    color_images: product.colorImages || null,
    color_hexes: product.colorHexes || null,
    image: product.image,
    gallery: product.gallery || [],
    material: product.material || null,
    season: product.season || null,
    fabric_care: product.fabricCare || null,
    fit: product.fit || null,
    stock: product.stock,
    has_cargo: product.hasCargo,
    description: product.description || null,
    description_i18n: product.descriptionI18n || null,
  });

  const mapOrderFromDb = (row: any): Order => {
    const createdAt = row.created_at ? Number(row.created_at) : Date.now();
    return {
      id: row.id,
      customerName: row.customer_name || 'Mijoz',
      product: row.product_summary || row.product || 'Mahsulot',
      price: Number(row.total ?? 0),
      status: row.status || 'Processing',
      date: row.created_at ? new Date(row.created_at).toLocaleString() : 'Hozir',
      createdAt,
      deliveryEta: row.delivery_eta ? Number(row.delivery_eta) : createdAt + 7 * 24 * 60 * 60 * 1000,
      itemsCount: row.items_count ?? undefined,
      previewImage: row.preview_image ?? undefined,
      customerEmail: row.customer_email ?? undefined,
      items: Array.isArray(row.items) ? row.items : [],
      address: row.address || null,
    };
  };

  const mapOrderToDb = (order: Order) => ({
    id: order.id,
    customer_name: order.customerName,
    customer_email: order.customerEmail || null,
    product_summary: order.product,
    total: order.price,
    status: order.status,
    items_count: order.itemsCount || null,
    preview_image: order.previewImage || null,
    created_at: order.createdAt || null,
    delivery_eta: order.deliveryEta || null,
    items: order.items || [],
    address: order.address || null,
  });

  const mapCustomerFromDb = (row: any): Customer => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar:
      row.avatar_url ||
      row.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || 'User')}&background=6366f1&color=ffffff`,
    orders: Number(row.orders ?? 0),
    spent: Number(row.spent ?? 0),
    lastSeenAt: row.last_seen_at ? Number(row.last_seen_at) : undefined,
    totalTimeSeconds: Number(row.total_time_seconds ?? 0),
    isOnline: Boolean(row.is_online),
    status: row.status || 'Active',
    location: row.location || 'Unknown',
    joinDate: row.join_date || 'N/A',
  });

  const mapCustomerToDb = (customer: Customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    avatar_url: customer.avatar || null,
    orders: customer.orders,
    spent: customer.spent,
    last_seen_at: customer.lastSeenAt || null,
    total_time_seconds: Number(customer.totalTimeSeconds ?? 0),
    is_online: Boolean(customer.isOnline),
    status: customer.status,
    location: customer.location,
    join_date: customer.joinDate,
  });

  const mapCategoryFromDb = (row: any): Category => ({
    id: row.id,
    name: row.name,
    count: Number(row.count ?? 0),
    image: row.image || '',
  });

  const mapCategoryToDb = (category: Category) => ({
    id: category.id,
    name: category.name,
    count: category.count,
    image: category.image,
  });

  const mapCouponFromDb = (row: any): Coupon => ({
    id: row.id,
    code: row.code,
    discount: Number(row.discount ?? 0),
    description: row.description || '',
    status: row.status || 'active',
    color: row.color || 'from-emerald-400 to-teal-500',
  });

  const mapCouponToDb = (coupon: Coupon) => ({
    id: coupon.id,
    code: coupon.code,
    discount: coupon.discount,
    description: coupon.description,
    status: coupon.status,
    color: coupon.color,
  });

  const mapDefectiveFromDb = (row: any): DefectiveItem => ({
    id: row.id,
    productName: row.product_name,
    supplierName: row.supplier_name,
    cargoName: row.cargo_name,
    issueType: row.issue_type,
    quantity: Number(row.quantity ?? 0),
    price: Number(row.price ?? 0),
    status: row.status || 'Pending',
    date: row.date || 'Hozir',
    image: row.image || undefined,
  });

  const mapDefectiveToDb = (item: DefectiveItem) => ({
    id: item.id,
    product_name: item.productName,
    supplier_name: item.supplierName,
    cargo_name: item.cargoName,
    issue_type: item.issueType,
    quantity: item.quantity,
    price: item.price,
    status: item.status,
    date: item.date,
    image: item.image || null,
  });

  const mapSiteSectionFromDb = (row: any): SiteSection => ({
    id: row.id,
    type: row.type,
    orderIndex: Number(row.order_index ?? 0),
    page: row.page || 'home',
    enabled: Boolean(row.enabled),
    data: row.data || null,
  });

  const mapSiteSectionToDb = (section: SiteSection) => ({
    id: section.id,
    type: section.type,
    order_index: section.orderIndex,
    page: section.page || 'home',
    enabled: section.enabled,
    data: section.data || null,
  });

  const loadInitialData = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    const results = await Promise.allSettled([
      apiRequest('/products'),
      apiRequest('/orders'),
      apiRequest('/site-sections'),
      apiRequest('/customers'),
      apiRequest('/categories'),
      apiRequest('/coupons'),
      apiRequest('/defective-items')
    ]);

    const getData = (index: number) =>
      results[index].status === 'fulfilled' ? results[index].value : null;

    const getError = (index: number) =>
      results[index].status === 'rejected' ? (results[index].reason as Error)?.message || 'Unknown error' : null;

    const productsRes = getData(0);
    const ordersRes = getData(1);
    const sectionsRes = getData(2);
    const customersRes = getData(3);
    const categoriesRes = getData(4);
    const couponsRes = getData(5);
    const defectiveRes = getData(6);

    setProducts(Array.isArray(productsRes) ? productsRes.map(mapProductFromDb) : []);
    setOrders(Array.isArray(ordersRes) ? ordersRes.map(mapOrderFromDb) : []);
    setSiteSections(Array.isArray(sectionsRes) ? sectionsRes.map(mapSiteSectionFromDb) : []);
    setCustomers(Array.isArray(customersRes) ? customersRes.map(mapCustomerFromDb) : []);
    setCategories(Array.isArray(categoriesRes) ? categoriesRes.map(mapCategoryFromDb) : []);
    setCoupons(Array.isArray(couponsRes) ? couponsRes.map(mapCouponFromDb) : []);
    setDefectiveItems(Array.isArray(defectiveRes) ? defectiveRes.map(mapDefectiveFromDb) : []);

    const failed = [
      ['products', getError(0)],
      ['orders', getError(1)],
      ['site-sections', getError(2)],
      ['customers', getError(3)],
      ['categories', getError(4)],
      ['coupons', getError(5)],
      ['defective-items', getError(6)],
    ].filter(([, err]) => Boolean(err));

    if (failed.length > 0) {
      const summary = failed.map(([name, err]) => `${name}: ${err}`).join(' | ');
      if (lastLoadWarningRef.current !== summary) {
        lastLoadWarningRef.current = summary;
        addNotification('warning', `Ba'zi ma'lumotlar yuklanmadi: ${summary}`);
      }
    } else {
      lastLoadWarningRef.current = '';
    }

    if (!silent) setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadInitialData(false);
    const interval = setInterval(() => {
      loadInitialData(true);
    }, LIVE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadInitialData, user]);

  const upsertProduct = useCallback(async (product: Product) => {
    const translateText = async (text: string, target: 'en' | 'ru') => {
      if (!text) return text;
      try {
        const api = import.meta.env.VITE_TRANSLATE_API_URL || `${API_BASE_URL}/translate`;
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text, source: 'uz', target })
        });
        const json = await res.json();
        return json?.translatedText || text;
      } catch {
        return text;
      }
    };

    const ensureProductI18n = async (p: Product) => {
      const nameEn = await translateText(p.name, 'en');
      const nameRu = await translateText(p.name, 'ru');
      const descEn = p.description ? await translateText(p.description, 'en') : '';
      const descRu = p.description ? await translateText(p.description, 'ru') : '';
      const catEn = p.category ? await translateText(p.category, 'en') : '';
      const catRu = p.category ? await translateText(p.category, 'ru') : '';
      return {
        ...p,
        nameI18n: { en: nameEn, ru: nameRu },
        descriptionI18n: { en: descEn, ru: descRu },
        categoryI18n: { en: catEn, ru: catRu },
      };
    };

    const productWithI18n = await ensureProductI18n(product);
    const payload = mapProductToDb(productWithI18n);
    const exists = products.some(p => p.id === product.id);
    try {
      const data = await apiRequest(
        exists ? `/products/${encodeURIComponent(product.id)}` : '/products',
        {
          method: exists ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (data) {
        const mapped = mapProductFromDb(data);
        setProducts(prev => {
          const hasCurrent = prev.find(p => p.id === mapped.id);
          if (hasCurrent) return prev.map(p => p.id === mapped.id ? mapped : p);
          return [mapped, ...prev];
        });
      }
      return true;
    } catch (error) {
      addNotification('error', `Mahsulot saqlanmadi: ${(error as Error).message}`);
      return false;
    }
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      addNotification('error', `Mahsulot o'chirilmadi: ${(error as Error).message}`);
      return;
    }
  }, []);

  const deleteProducts = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })));
      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    } catch (error) {
      addNotification('error', `Mahsulotlar o'chirilmadi: ${(error as Error).message}`);
      return;
    }
  }, []);

  const bulkUpdateProductCategory = useCallback(async (ids: string[], category: string) => {
    if (ids.length === 0) return;
    try {
      const updates = products.filter(p => ids.includes(p.id)).map((p) => apiRequest(`/products/${encodeURIComponent(p.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapProductToDb({ ...p, category }))
      }));
      await Promise.all(updates);
      setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, category } : p));
    } catch (error) {
      addNotification('error', `Kategoriya o'zgarmadi: ${(error as Error).message}`);
      return;
    }
  }, [products]);

  const addDefectiveItem = useCallback(async (item: DefectiveItem) => {
    try {
      const data = await apiRequest('/defective-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapDefectiveToDb(item)),
      });
      if (data) {
        const mapped = mapDefectiveFromDb(data);
        setDefectiveItems(prev => [mapped, ...prev]);
      }
    } catch (error) {
      addNotification('error', `Brak yozuvi saqlanmadi: ${(error as Error).message}`);
    }
  }, []);

  const deleteDefectiveItem = useCallback(async (id: string) => {
    try {
      await apiRequest(`/defective-items/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setDefectiveItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      addNotification('error', `Brak yozuvi o'chirilmadi: ${(error as Error).message}`);
    }
  }, []);

  const updateDefectiveStatus = useCallback(async (id: string, status: DefectiveItem['status']) => {
    try {
      const data = await apiRequest(`/defective-items/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (data) {
        const mapped = mapDefectiveFromDb(data);
        setDefectiveItems(prev => prev.map(i => i.id === id ? mapped : i));
      }
    } catch (error) {
      addNotification('error', `Brak statusi yangilanmadi: ${(error as Error).message}`);
    }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    try {
      await apiRequest(`/orders/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (error) {
      addNotification('error', `Buyurtma holati yangilanmadi: ${(error as Error).message}`);
      return;
    }
  }, []);

  const upsertCustomer = useCallback(async (customer: Customer) => {
    try {
      const exists = customers.some(c => c.id === customer.id);
      const data = await apiRequest(exists ? `/customers/${encodeURIComponent(customer.id)}` : '/customers', {
        method: exists ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapCustomerToDb(customer)),
      });
      if (data) {
        const mapped = mapCustomerFromDb(data);
        setCustomers(prev => {
          const hasCurrent = prev.find(c => c.id === mapped.id);
          if (hasCurrent) return prev.map(c => c.id === mapped.id ? mapped : c);
          return [mapped, ...prev];
        });
      }
    } catch (error) {
      addNotification('error', `Mijoz saqlanmadi: ${(error as Error).message}`);
    }
  }, [customers]);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      await apiRequest(`/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      addNotification('error', `Mijoz o'chirilmadi: ${(error as Error).message}`);
    }
  }, []);

  const addCategory = useCallback(async (category: Category) => {
    try {
      const data = await apiRequest('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapCategoryToDb(category)),
      });
      if (data) {
        const mapped = mapCategoryFromDb(data);
        setCategories(prev => [mapped, ...prev.filter(c => c.id !== mapped.id)]);
      }
    } catch (error) {
      addNotification('error', `Kategoriya saqlanmadi: ${(error as Error).message}`);
    }
  }, []);

  const addCoupon = useCallback(async (coupon: Coupon) => {
    try {
      const data = await apiRequest('/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapCouponToDb(coupon)),
      });
      if (data) {
        const mapped = mapCouponFromDb(data);
        setCoupons(prev => [mapped, ...prev.filter(c => c.id !== mapped.id)]);
      }
    } catch (error) {
      addNotification('error', `Kupon saqlanmadi: ${(error as Error).message}`);
    }
  }, []);

  const deleteCoupon = useCallback(async (id: string) => {
    try {
      await apiRequest(`/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      addNotification('error', `Kupon o'chirilmadi: ${(error as Error).message}`);
    }
  }, []);

  const upsertSiteSection = useCallback(async (section: SiteSection) => {
    const payload = mapSiteSectionToDb(section);
    const exists = siteSections.some(s => s.id === section.id);
    try {
      const data = await apiRequest(
        exists ? `/site-sections/${encodeURIComponent(section.id)}` : '/site-sections',
        {
          method: exists ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (data) {
        const mapped = mapSiteSectionFromDb(data);
        setSiteSections(prev => {
          const hasCurrent = prev.find(s => s.id === mapped.id);
          if (hasCurrent) return prev.map(s => s.id === mapped.id ? mapped : s).sort((a, b) => a.orderIndex - b.orderIndex);
          return [...prev, mapped].sort((a, b) => a.orderIndex - b.orderIndex);
        });
      }
    } catch (error) {
      addNotification('error', `Bo'lim saqlanmadi: ${(error as Error).message}`);
      return;
    }
  }, [siteSections]);

  const deleteSiteSection = useCallback(async (id: string) => {
    try {
      await apiRequest(`/site-sections/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setSiteSections(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      addNotification('error', `Bo'lim o'chirilmadi: ${(error as Error).message}`);
      return;
    }
  }, []);

  const reorderSiteSections = useCallback(async (sections: SiteSection[]) => {
    try {
      const payloadSections = sections.map((section) => mapSiteSectionToDb(section));

      await apiRequest('/site-sections/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: payloadSections }),
      });

      const updatedById = new Map(sections.map((section) => [section.id, section]));
      setSiteSections((prev) =>
        [
          ...prev.map((section) => updatedById.get(section.id) || section),
          ...sections.filter((section) => !prev.some((existing) => existing.id === section.id)),
        ]
          .sort((a, b) => {
            const pageA = a.page || 'home';
            const pageB = b.page || 'home';
            if (pageA !== pageB) return pageA.localeCompare(pageB);
            return a.orderIndex - b.orderIndex;
          })
      );
    } catch (error) {
      addNotification('error', `Tartib saqlanmadi: ${(error as Error).message}`);
      return;
    }
  }, []);

  const removeNotification = (id: string | number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string | number) => {
    setInbox(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setInbox(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearInbox = () => {
      setInbox([]);
  };

  return (
    <StoreContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      updateUser,
      notifications,
      inbox,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearInbox,
      darkMode,
      toggleDarkMode,
      isSidebarOpen,
      setSidebarOpen,
      currency,
      setCurrency,
      formatPrice,
      products,
      setProducts,
      upsertProduct,
      deleteProduct,
      deleteProducts,
      bulkUpdateProductCategory,
      defectiveItems,
      setDefectiveItems,
      addDefectiveItem,
      deleteDefectiveItem,
      updateDefectiveStatus,
      orders,
      setOrders,
      updateOrderStatus,
      customers,
      setCustomers,
      upsertCustomer,
      deleteCustomer,
      categories,
      setCategories,
      addCategory,
      coupons,
      setCoupons,
      addCoupon,
      deleteCoupon,
      siteSections,
      setSiteSections,
      upsertSiteSection,
      deleteSiteSection,
      reorderSiteSections,
      focusedOrderId,
      setFocusedOrderId
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
