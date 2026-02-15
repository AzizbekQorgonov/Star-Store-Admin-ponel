import React from 'react';

export type ViewType = 'dashboard' | 'products' | 'orders' | 'categories' | 'marketing' | 'settings' | 'finance' | 'customers' | 'activity' | 'site-builder';

export interface Order {
  id: string;
  customerName: string;
  product: string;
  price: number;
  status: 'Delivered' | 'Processing' | 'Cancelled';
  date: string;
  createdAt?: number;
  deliveryEta?: number | null;
  itemsCount?: number;
  previewImage?: string;
  customerEmail?: string;
  items?: Array<{
    product_id?: string;
    name: string;
    price: number;
    size?: string;
    color?: string;
    quantity: number;
    image?: string;
  }>;
  address?: {
    line1?: string;
    city?: string;
    postalCode?: string;
    region?: 'tashkent' | 'region' | 'international';
    eta_from?: number;
    eta_to?: number;
  } | null;
}

export interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
}

export interface MetricCardProps {
  category: string;
  title: string;
  description: string;
  value: string;
  icon?: React.ReactNode;
  onClick?: () => void; // Added for navigation
}

export interface Product {
  id: string;
  name: string;
  nameI18n?: Record<string, string>;
  brand: string;
  price: number;
  category: string;
  categoryI18n?: Record<string, string>;
  audience?: 'male' | 'female' | 'unisex';
  sizes: string[];
  sizeStock?: Record<string, number>;
  colors: string[];
  colorImages?: Record<string, string>; // Map color name to image URL
  colorHexes?: Record<string, string>;  // New field: Map color name to HEX code (for AI generated custom colors)
  image: string;
  gallery?: string[];
  material?: string;
  season?: string;
  fabricCare?: string;
  fit?: string;
  stock: number;
  hasCargo: boolean; 
  description?: string; 
  descriptionI18n?: Record<string, string>;
}

export interface DefectiveItem {
  id: string;
  productName: string;
  supplierName: string; // Qaysi kompaniyadan olingan
  cargoName: string;    // Qaysi kargo olib kelgan
  issueType: string;    // Muammo turi (Siniq, rangi boshqa...)
  quantity: number;
  price: number;        // Zarar summasi
  status: 'Pending' | 'Returned' | 'Solved'; // Holati: Kutilmoqda, Qaytarildi, Hal qilindi
  date: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
  image: string;
}

// New Types for Advanced Features
export interface Notification {
  id: string | number;
  type: 'success' | 'error' | 'info' | 'warning' | 'order' | 'alert';
  title?: string;
  message: string;
  time?: string;
  read?: boolean;
  targetView?: ViewType; // Qaysi sahifaga o'tishi kerak
  targetId?: string;     // Aniq bir element ID si (masalan, buyurtma ID)
  duration?: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  status: 'success' | 'failed';
  icon?: string; // Icon type text
}

export interface User {
  name: string;
  email: string; // Added email
  role: 'admin' | 'editor';
  avatar: string;
  permissions?: string[]; // Added permissions list for display
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  lastSeenAt?: number;
  totalTimeSeconds?: number;
  isOnline?: boolean;
  orders: number;
  spent: number;
  status: 'Active' | 'Inactive';
  location: string;
  joinDate: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  description: string;
  status: 'active' | 'expired';
  color: string;
}

export interface SiteSection {
  id: string;
  type: string;
  orderIndex: number;
  page?: string;
  enabled: boolean;
  data: Record<string, any> | null;
}

