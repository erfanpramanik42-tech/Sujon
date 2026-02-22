
export interface GeoLocation {
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
}

export interface Area {
  id: string;
  name: string;
  assignedDay?: string; // e.g., 'Monday', 'Tuesday'
  isArchived?: boolean;
}

export interface StopPoint {
  location: GeoLocation;
  areaName: string;
  stopNumber: number;
  timestamp: number;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  subArea?: string;
  photo?: string; // base64
  location: GeoLocation;
  areaId: string;
  createdAt: number;
  isArchived?: boolean;
}

export interface Visit {
  shopId: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
}

export interface Product {
  id: string;
  name: string;
  weight?: string;
  price: number;
  discount?: number; // percentage
  stock: number;
  category?: string;
  status: 'Active' | 'Inactive';
  photo?: string; // base64
  createdAt: number;
  isArchived?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  discount: number;
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  dealerId?: string;
  dealerName?: string; // Snapshot of Company Name
  dealerProprietor?: string; // Logic Addition: Snapshot Proprietor
  dealerPhone?: string; // Logic Addition: Snapshot Phone
  dealerAddress?: string; // Snapshot of Address
  dealerDescription?: string; // Logic Addition: Snapshot Words
  signature?: string; // base64 string
  items: OrderItem[];
  subtotal: number;
  total: number;
  timestamp: number;
  date: string;
}

export interface Dealer {
  id: string;
  companyName: string;
  dealerName: string;
  address: string;
  phone: string;
  description: string;
  createdAt: number;
  isArchived?: boolean;
}

export interface SalesRoute {
  id: string;
  date: string;
  day?: string;
  customAreaName?: string;
  areaId: string;
  path: GeoLocation[];
  stops: StopPoint[];
  startTime: number;
  endTime?: number;
  isArchived?: boolean;
}

export type AppView = 'Dashboard' | 'Map' | 'Shops' | 'History' | 'Settings';

export interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}