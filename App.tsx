import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppView, Shop, Area, SalesRoute, GeoLocation, StopPoint, Visit, Product, Order, OrderItem, Dealer } from './types';
import { INITIAL_AREAS, INITIAL_SHOPS, TRANSLATIONS, DEMO_ROUTES } from './constants';
import { calculateDistance, getCurrentPosition } from './services/locationService';
import { MapComponent } from './components/MapComponent';
import { NotificationToast } from './components/NotificationToast';
import { VisualAnalytics } from './components/VisualAnalytics';
import { SmartRouteOptimizer } from './components/SmartRouteOptimizer';

// --- Helper: Translation Wrapper ---
const getT = (key: string, lang: 'en' | 'bn') => TRANSLATIONS[key]?.[lang] || key;

// --- Helper: Robust ID Generator ---
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

// --- Sub-Component: Location Picker Map ---
const LocationPickerMap = ({ 
  initialLocation, 
  onChange 
}: { 
  initialLocation: GeoLocation, 
  onChange: (loc: GeoLocation) => void 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const layersRef = useRef<{ street: any; satellite: any }>({ street: null, satellite: null });
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  useEffect(() => {
    if (!containerRef.current) return;
    // @ts-ignore
    const L = window.L;
    if (!L) return;

    mapInstance.current = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      rotate: true,
      touchRotate: true
    }).setView([initialLocation.lat, initialLocation.lng], 16);

    layersRef.current.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    layersRef.current.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');

    markerInstance.current = L.marker([initialLocation.lat, initialLocation.lng], {
      draggable: true
    }).addTo(mapInstance.current);

    markerInstance.current.on('dragend', (e: any) => {
      const latlng = e.target.getLatLng();
      onChange({ lat: latlng.lat, lng: latlng.lng });
    });

    mapInstance.current.on('click', (e: any) => {
      markerInstance.current.setLatLng(e.latlng);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // Manual Touch Rotation Gesture Logic
    let initialAngle = 0;
    let initialBearing = 0;
    const container = mapInstance.current.getContainer();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialAngle = Math.atan2(e.touches[1].pageY - e.touches[0].pageY, e.touches[1].pageX - e.touches[0].pageX) * 180 / Math.PI;
        initialBearing = mapInstance.current.getBearing();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const currentAngle = Math.atan2(e.touches[1].pageY - e.touches[0].pageY, e.touches[1].pageX - e.touches[0].pageX) * 180 / Math.PI;
        const delta = currentAngle - initialAngle;
        mapInstance.current.setBearing(initialBearing + delta);
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });

    setTimeout(() => mapInstance.current?.invalidateSize(), 300);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const toggleMapType = () => {
    const nextType = mapType === 'street' ? 'satellite' : 'street';
    setMapType(nextType);
    if (mapInstance.current && layersRef.current) {
      if (nextType === 'satellite') {
        layersRef.current.street.remove();
        layersRef.current.satellite.addTo(mapInstance.current);
      } else {
        layersRef.current.satellite.remove();
        layersRef.current.street.addTo(mapInstance.current);
      }
    }
  };

  useEffect(() => {
    if (mapInstance.current && markerInstance.current) {
      const currentMarkerPos = markerInstance.current.getLatLng();
      if (Math.abs(currentMarkerPos.lat - initialLocation.lat) > 0.0000001 || 
          Math.abs(currentMarkerPos.lng - initialLocation.lng) > 0.0000001) {
        markerInstance.current.setLatLng([initialLocation.lat, initialLocation.lng]);
        mapInstance.current.panTo([initialLocation.lat, initialLocation.lng]);
      }
    }
  }, [initialLocation.lat, initialLocation.lng]);

  return (
    <div className="relative group">
      <div ref={containerRef} className="h-48 w-full rounded-xl border border-slate-200 shadow-inner overflow-hidden" />
      <div className="absolute top-2 left-2 z-[1000] flex gap-1">
        <button 
          type="button"
          onClick={toggleMapType}
          className={`px-2 py-1 rounded-md text-[9px] font-black uppercase shadow-sm border transition-colors ${mapType === 'satellite' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/90 text-slate-600 border-slate-200'}`}
        >
          {mapType === 'street' ? 'Satellite' : 'Street'}
        </button>
      </div>
    </div>
  );
};

// --- Sub-Component: Stable Mini Map ---
const MiniMap = ({ location, label }: { location: GeoLocation; label?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const layersRef = useRef<{ street: any; satellite: any }>({ street: null, satellite: null });
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  useEffect(() => {
    if (!containerRef.current) return;
    // @ts-ignore
    const L = window.L;
    if (!L) return;
    
    mapInstance.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      rotate: true,
      touchRotate: true
    }).setView([location.lat, location.lng], 16);
    
    layersRef.current.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    layersRef.current.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
    
    const marker = L.marker([location.lat, location.lng]).addTo(mapInstance.current);
    if (label) {
      marker.bindTooltip(label, { permanent: true, direction: 'top', className: 'minimal-label' }).openTooltip();
    }

    let initialAngle = 0;
    let initialBearing = 0;
    const container = mapInstance.current.getContainer();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialAngle = Math.atan2(e.touches[1].pageY - e.touches[0].pageY, e.touches[1].pageX - e.touches[0].pageX) * 180 / Math.PI;
        initialBearing = mapInstance.current.getBearing();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const currentAngle = Math.atan2(e.touches[1].pageY - e.touches[0].pageY, e.touches[1].pageX - e.touches[0].pageX) * 180 / Math.PI;
        const delta = currentAngle - initialAngle;
        mapInstance.current.setBearing(initialBearing + delta);
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });

    setTimeout(() => mapInstance.current?.invalidateSize(), 300);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [location.lat, location.lng, label]);

  const toggleMapType = () => {
    const nextType = mapType === 'street' ? 'satellite' : 'street';
    setMapType(nextType);
    if (mapInstance.current && layersRef.current) {
      if (nextType === 'satellite') {
        layersRef.current.street.remove();
        layersRef.current.satellite.addTo(mapInstance.current);
      } else {
        layersRef.current.satellite.remove();
        layersRef.current.street.addTo(mapInstance.current);
      }
    }
  };

  return (
    <div className="relative">
      <div ref={containerRef} className="h-32 w-full rounded-xl border border-slate-200 mt-4 shadow-inner" />
      <button 
        type="button" 
        onClick={toggleMapType}
        className={`absolute top-6 left-2 z-[1000] px-2 py-1 rounded-md text-[8px] font-black uppercase shadow-sm border transition-colors ${mapType === 'satellite' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/90 text-slate-600 border-slate-200'}`}
      >
        {mapType === 'street' ? 'Satellite' : 'Street'}
      </button>
    </div>
  );
};

// --- Sub-Component: Header ---
const Header = ({ title, location, lang, onLangToggle, isTracking, onTrackingToggle, onKebabToggle, showKebab, t }: any) => (
  <header className="sticky top-0 z-50 bg-indigo-700 text-white p-4 shadow-lg">
    <div className="flex justify-between items-center max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {location && (
          <p className="text-[10px] text-indigo-200 font-mono">
            GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onLangToggle}
          className="text-xs bg-indigo-600 px-3 py-1 rounded-full border border-indigo-400 font-bold"
        >
          {lang === 'en' ? 'বাংলা' : 'EN'}
        </button>
        <button 
          onClick={onTrackingToggle}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md ${isTracking ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
        >
          {isTracking ? t('trackingOn') : t('trackingOff')}
        </button>
        {showKebab && (
          <button 
            onClick={onKebabToggle}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all ml-1 active:scale-95"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="7.5" cy="7.5" r="2.5" />
              <circle cx="16.5" cy="7.5" r="2.5" />
              <circle cx="7.5" cy="16.5" r="2.5" />
              <circle cx="16.5" cy="16.5" r="2.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  </header>
);

// --- Sub-Component: Navbar ---
const Navbar = ({ view, setView, t }: any) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe-area z-[100]">
    <div className="flex justify-around items-center h-16 max-w-4xl mx-auto px-2">
      {(['Dashboard', 'Map', 'Shops', 'History', 'Settings'] as AppView[]).map(v => (
        <button 
          key={v}
          onClick={() => setView(v)}
          className={`flex flex-col items-center gap-1 transition-colors ${view === v ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-1 rounded-lg ${view === v ? 'bg-indigo-50' : ''}`}>
            {v === 'Dashboard' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 00-1.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>}
            {v === 'Map' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" /></svg>}
            {v === 'Shops' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>}
            {v === 'History' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
            {v === 'Settings' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">{t(v.toLowerCase())}</span>
        </button>
      ))}
    </div>
  </nav>
);

// --- Main App Component ---
const App: React.FC = () => {
  const currentDayName = useMemo(() => {
    const dayIndex = new Date().getDay();
    return WEEKDAYS[dayIndex];
  }, []);

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [shops, setShops] = useState<Shop[]>(() => {
    const saved = localStorage.getItem('fieldpro_shops');
    return saved ? JSON.parse(saved) : INITIAL_SHOPS;
  });
  const [areas, setAreas] = useState<Area[]>(() => {
    const saved = localStorage.getItem('fieldpro_areas');
    return saved ? JSON.parse(saved) : INITIAL_AREAS;
  });
  const [routes, setRoutes] = useState<SalesRoute[]>(() => {
    const saved = localStorage.getItem('fieldpro_routes');
    return saved ? JSON.parse(saved) : DEMO_ROUTES;
  });
  const [visits, setVisits] = useState<Visit[]>(() => {
    const saved = localStorage.getItem('fieldpro_visits');
    return saved ? JSON.parse(saved) : [];
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('fieldpro_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('fieldpro_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [dealers, setDealers] = useState<Dealer[]>(() => {
    const saved = localStorage.getItem('fieldpro_dealers');
    return saved ? JSON.parse(saved) : [];
  });

  const [detectionRange, setDetectionRange] = useState<number>(() => {
    const saved = localStorage.getItem('fieldpro_range');
    return saved ? Number(saved) : 1;
  });
  const [nearbyRange, setNearbyRange] = useState<number>(() => {
    const saved = localStorage.getItem('fieldpro_nearby_range');
    return saved ? Number(saved) : 20;
  });

  const [view, setView] = useState<AppView>('Dashboard');
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [activeRoute, setActiveRoute] = useState<SalesRoute | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [viewingRoute, setViewingRoute] = useState<SalesRoute | null>(null);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [isManagingCatalog, setIsManagingCatalog] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Logic Fix: Added state for Order detail and history toggling
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [historyTab, setHistoryTab] = useState<'routes' | 'orders'>('routes');

  // --- Kalman Filter Logic State ---
  const kalmanStateRef = useRef<{ lat: number; lng: number; variance: number }>({ lat: 0, lng: 0, variance: -1 });

  const applyKalmanFilter = (newLat: number, newLng: number, accuracy: number) => {
    const state = kalmanStateRef.current;
    if (state.variance < 0) {
      kalmanStateRef.current = { lat: newLat, lng: newLng, variance: accuracy * accuracy };
      return { lat: newLat, lng: newLng };
    } else {
      const q = 0.000001; 
      const r = accuracy * accuracy; 
      state.variance += q;
      const k = state.variance / (state.variance + r);
      state.lat += k * (newLat - state.lat);
      state.lng += k * (newLng - state.lng);
      state.variance = (1 - k) * state.variance;
      return { lat: state.lat, lng: state.lng };
    }
  };

  const [isEditingDealer, setIsEditingDealer] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Partial<Dealer> | null>(null);
  const [showDealersList, setShowDealersList] = useState(false);

  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('All');
  const [catalogSort, setCatalogSort] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  const [showOrderSystem, setShowOrderSystem] = useState(false);
  const [orderShop, setOrderShop] = useState<Shop | null>(null);
  const [orderCart, setOrderCart] = useState<OrderItem[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderTab, setOrderTab] = useState<'taking' | 'history'>('taking');

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSmartRoute, setShowSmartRoute] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.filter(p => !p.isArchived).map(p => p.category || 'General')));
    return ['All', ...cats.sort()];
  }, [products]);

  const filteredCatalogProducts = useMemo(() => {
    let result = products.filter(p => !p.isArchived);
    if (catalogSearch) {
      result = result.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()));
    }
    if (selectedCatalogCategory !== 'All') {
      result = result.filter(p => p.category === selectedCatalogCategory);
    }
    return result.sort((a, b) => {
      if (catalogSort === 'name') return a.name.localeCompare(b.name);
      const priceA = a.price - (a.price * (a.discount || 0) / 100);
      const priceB = b.price - (b.price * (b.discount || 0) / 100);
      return catalogSort === 'price_asc' ? priceA - priceB : priceB - priceA;
    });
  }, [products, catalogSearch, selectedCatalogCategory, catalogSort]);

  const orderFilteredProducts = useMemo(() => {
    let result = products.filter(p => !p.isArchived && p.status === 'Active');
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      return result
        .map(p => {
          const name = p.name.toLowerCase();
          const category = (p.category || '').toLowerCase();
          let score = 0;
          if (name === q) score = 100;
          else if (name.startsWith(q)) score = 80;
          else if (name.includes(' ' + q)) score = 60;
          else if (name.includes(q)) score = 40;
          else if (category.includes(q)) score = 20;
          return { ...p, _score: score };
        })
        .filter(p => (p as any)._score > 0)
        .sort((a, b) => (b as any)._score - (a as any)._score || a.name.localeCompare(b.name));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, orderSearch]);

  const [productDragX, setProductDragX] = useState(0);
  const isDraggingProduct = useRef(false);
  const productTouchStartX = useRef(0);

  const handleProductTouchStart = (e: React.TouchEvent) => {
    isDraggingProduct.current = true;
    productTouchStartX.current = e.touches[0].clientX;
    setProductDragX(0);
  };

  const handleProductTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingProduct.current) return;
    const currentX = e.touches[0].clientX;
    setProductDragX(currentX - productTouchStartX.current);
  };

  const handleProductTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingProduct.current) return;
    isDraggingProduct.current = false;
    const diff = productDragX;
    const threshold = window.innerWidth * 0.22; 
    const currentIndex = filteredCatalogProducts.findIndex(p => p.id === viewingProduct?.id);
    if (diff < -threshold && currentIndex < filteredCatalogProducts.length - 1) {
      setViewingProduct(filteredCatalogProducts[currentIndex + 1]);
    } else if (diff > threshold && currentIndex > 0) {
      setViewingProduct(filteredCatalogProducts[currentIndex - 1]);
    }
    setProductDragX(0);
  };
  
  const [viewingShop, setViewingShop] = useState<Shop | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; shopName: string; ownerName: string }>({
    show: false, shopName: '', ownerName: ''
  });

  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [routeSaveForm, setRouteSaveForm] = useState({ day: '', areaName: '' });

  const activeAreas = useMemo(() => areas.filter(a => !a.isArchived), [areas]);
  const activeRoutes = useMemo(() => routes.filter(r => !r.isArchived), [routes]);
  const activeShops = useMemo(() => shops.filter(s => !s.isArchived && activeAreas.some(a => a.id === s.areaId)), [shops, activeAreas]);
  
  useEffect(() => {
    if (viewingShop) {
      const updated = activeShops.find(s => s.id === viewingShop.id);
      if (updated) setViewingShop(updated);
    }
  }, [activeShops]);

  const activeProducts = useMemo(() => {
    return products
      .filter(p => !p.isArchived)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const activeDealers = useMemo(() => {
    return dealers.filter(d => !d.isArchived).sort((a, b) => b.createdAt - a.createdAt);
  }, [dealers]);

  const dashboardAreas = useMemo(() => {
    return activeAreas.filter(a => a.assignedDay === currentDayName);
  }, [activeAreas, currentDayName]);

  const alertedShopsRef = useRef<Set<string>>(new Set());
  const lastStopCheckLocRef = useRef<GeoLocation | null>(null);
  const staticTimeCounterRef = useRef<number>(0);
  const shopsRef = useRef(activeShops);
  const areasRef = useRef(activeAreas);
  const isTrackingRef = useRef(isTracking);
  const activeRouteRef = useRef(activeRoute);

  useEffect(() => { shopsRef.current = activeShops; }, [activeShops]);
  useEffect(() => { areasRef.current = activeAreas; }, [activeAreas]);
  useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);
  useEffect(() => { activeRouteRef.current = activeRoute; }, [activeRoute]);

  useEffect(() => {
    if (view !== 'Settings') {
      setIsManagingCatalog(false);
      setIsEditingProduct(false);
    }
  }, [view]);

  const [isEditingShop, setIsEditingShop] = useState(false);
  const [isManagingAreas, setIsManagingAreas] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDay, setNewAreaDay] = useState(currentDayName);
  const [editingShop, setEditingShop] = useState<Partial<Shop> | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Shop | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productPhotoRef = useRef<HTMLInputElement>(null);

  const t = useCallback((key: string) => getT(key, lang), [lang]);

  const isVisitedToday = useCallback((shopId: string) => {
    return visits.some(v => v.shopId === shopId && v.date === todayIso);
  }, [visits, todayIso]);

  const toggleVisit = (shopId: string) => {
    setVisits(prev => {
      const exists = prev.some(v => v.shopId === shopId && v.date === todayIso);
      if (exists) {
        return prev.filter(v => !(v.shopId === shopId && v.date === todayIso));
      } else {
        return [...prev, { shopId, timestamp: Date.now(), date: todayIso }];
      }
    });
  };

  const handleInputFocus = (e: React.FocusEvent<any>) => {
    const target = e.currentTarget;
    setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
  };

  const shopsWithDistances = useMemo(() => {
    if (!currentLocation) return [];
    return activeShops.map(shop => ({ 
      ...shop, distance: calculateDistance(currentLocation, shop.location) 
    }));
  }, [activeShops, currentLocation]);

  const nearbyShops = useMemo(() => {
    return shopsWithDistances
      .filter(shop => shop.distance <= nearbyRange)
      .sort((a, b) => a.distance - b.distance);
  }, [shopsWithDistances, nearbyRange]);

  const atShop = useMemo(() => {
    const withinRange = shopsWithDistances.filter(shop => shop.distance <= detectionRange);
    if (withinRange.length === 0) return undefined;
    return [...withinRange].sort((a, b) => a.distance - b.distance)[0];
  }, [shopsWithDistances, detectionRange]);

  useEffect(() => {
    getCurrentPosition().then(pos => {
      const initialLoc = { 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed
      };
      setCurrentLocation(initialLoc);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem('fieldpro_shops', JSON.stringify(shops));
    localStorage.setItem('fieldpro_areas', JSON.stringify(areas));
    localStorage.setItem('fieldpro_routes', JSON.stringify(routes));
    localStorage.setItem('fieldpro_visits', JSON.stringify(visits));
    localStorage.setItem('fieldpro_products', JSON.stringify(products));
    localStorage.setItem('fieldpro_orders', JSON.stringify(orders));
    localStorage.setItem('fieldpro_dealers', JSON.stringify(dealers));
    localStorage.setItem('fieldpro_range', String(detectionRange));
    localStorage.setItem('fieldpro_nearby_range', String(nearbyRange));
  }, [shops, areas, routes, visits, products, orders, dealers, detectionRange, nearbyRange]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const smoothed = applyKalmanFilter(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 10);
        const newLoc = { 
          lat: smoothed.lat, 
          lng: smoothed.lng,
          heading: pos.coords.heading,
          speed: pos.coords.speed
        };
        setCurrentLocation(newLoc);
        shopsRef.current.forEach(shop => {
          const dist = calculateDistance(newLoc, shop.location);
          if (dist < 40) { 
            if (!alertedShopsRef.current.has(shop.id)) {
              setAlertInfo({ show: true, shopName: shop.name, ownerName: shop.ownerName });
              alertedShopsRef.current.add(shop.id);
            }
          } else if (dist > 100) {
            alertedShopsRef.current.delete(shop.id);
          }
        });
        if (isTrackingRef.current && activeRouteRef.current) {
          const lastPoint = activeRouteRef.current.path[activeRouteRef.current.path.length - 1];
          const displacement = lastPoint ? calculateDistance(newLoc, lastPoint) : 100;
          if (displacement >= 3) {
            setActiveRoute(prev => prev ? ({ ...prev, path: [...prev.path, newLoc] }) : null);
          }
          if (lastStopCheckLocRef.current) {
            const staticDist = calculateDistance(newLoc, lastStopCheckLocRef.current);
            if (staticDist < 15) {
              staticTimeCounterRef.current += 1;
              if (staticTimeCounterRef.current === 3) {
                const shopsByD = shopsRef.current.map(s => ({...s, d: calculateDistance(newLoc, s.location)})).sort((a,b)=>a.d-b.d);
                const near = shopsByD[0];
                const areaName = near && near.d < 100 
                  ? areasRef.current.find(a => a.id === near.areaId)?.name || 'Point'
                  : 'Field Point';
                setActiveRoute(prev => {
                  if (!prev) return null;
                  const newStop: StopPoint = {
                    location: newLoc,
                    areaName: areaName,
                    stopNumber: prev.stops.length + 1,
                    timestamp: Date.now()
                  };
                  return { ...prev, stops: [...prev.stops, newStop] };
                });
              }
            } else {
              staticTimeCounterRef.current = 0;
              lastStopCheckLocRef.current = newLoc;
            }
          } else {
            lastStopCheckLocRef.current = newLoc;
          }
        }
      },
      (err) => console.error('Watch error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const toggleTracking = () => {
    if (!isTracking) {
      const start = currentLocation || { lat: 23.8103, lng: 90.4125 };
      kalmanStateRef.current = { lat: start.lat, lng: start.lng, variance: -1 };
      const newRoute: SalesRoute = {
        id: generateId(),
        date: new Date().toLocaleDateString(),
        areaId: selectedAreaId !== 'all' ? selectedAreaId : 'General',
        path: [start],
        stops: [],
        startTime: Date.now(),
        isArchived: false
      };
      setActiveRoute(newRoute);
      setViewingRoute(null);
      setIsTracking(true);
      staticTimeCounterRef.current = 0;
      lastStopCheckLocRef.current = start;
    } else {
      setIsSavingRoute(true);
      setRouteSaveForm({ day: '', areaName: '' });
      setIsTracking(false);
    }
  };

  const confirmSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoute) return;
    const finalRoute: SalesRoute = {
      ...activeRoute,
      day: routeSaveForm.day,
      customAreaName: routeSaveForm.areaName,
      endTime: Date.now(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      isArchived: false
    };
    setRoutes(prev => [finalRoute, ...prev]);
    setActiveRoute(null);
    setIsSavingRoute(false);
    setViewingRoute(null);
  };

  const deleteRoute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const confirmMsg = lang === 'en' ? 'Delete this route history?' : 'এই রুট হিস্টোরিটি মুছে ফেলতে চান?';
    if (window.confirm(confirmMsg)) {
      setRoutes(prev => prev.map(r => r.id === id ? { ...r, isArchived: true } : r));
      if (viewingRoute?.id === id) setViewingRoute(null);
    }
  };

  const deleteArea = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const areaShopsCount = activeShops.filter(s => s.areaId === id).length;
    const confirmMsg = lang === 'en' 
      ? `Deleting area affects ${areaShopsCount} shops. Continue?` 
      : `এই এলাকাটি মুছে ফেললে ${areaShopsCount}টি দোকান প্রভাবিত হবে। নিশ্চিত কি?`;
    if (window.confirm(confirmMsg)) {
      setAreas(prev => prev.map(a => a.id === id ? { ...a, isArchived: true } : a));
      if (selectedAreaId === id) setSelectedAreaId('all');
    }
  };

  const initAddShop = useCallback(async () => {
    let loc = { lat: 23.8103, lng: 90.4125 };
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 6000 });
      loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e) {
      if (currentLocation) loc = { lat: currentLocation.lat, lng: currentLocation.lng };
    }
    setEditingShop({ location: { lat: Number(loc.lat), lng: Number(loc.lng) } }); 
    setIsEditingShop(true);
  }, [currentLocation]);

  const saveShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop || !editingShop.name) return;
    const finalLocData = editingShop.location 
      ? { lat: Number(editingShop.location.lat), lng: Number(editingShop.location.lng) }
      : (currentLocation ? { lat: Number(currentLocation.lat), lng: Number(currentLocation.lng) } : { lat: 23.8103, lng: 90.4125 });
    const finalShop: Shop = {
      id: editingShop.id || generateId(),
      name: editingShop.name || '',
      ownerName: editingShop.ownerName || '',
      phone: editingShop.phone || '',
      subArea: editingShop.subArea || '',
      photo: editingShop.photo,
      areaId: editingShop.areaId || (activeAreas.length > 0 ? activeAreas[0].id : ''),
      location: finalLocData, 
      createdAt: editingShop.createdAt || Date.now(),
      isArchived: false
    };
    if (editingShop.id) {
      setShops(prev => prev.map(s => s.id === editingShop.id ? finalShop : s));
    } else {
      setShops(prev => [finalShop, ...prev]);
    }
    setIsEditingShop(false);
    setEditingShop(null);
  };

  const addArea = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newAreaName.trim();
    if (!name) return;
    const isDuplicate = activeAreas.some(a => 
      a.name.toLowerCase() === name.toLowerCase() && a.assignedDay === newAreaDay
    );
    if (isDuplicate) {
      alert(lang === 'en' ? "Area already exists for this day." : "এই দিনের জন্য এই এলাকাটি ইতিমধ্যে বিদ্যমান।");
      return;
    }
    const newArea: Area = { 
      id: generateId(), 
      name: name, 
      assignedDay: newAreaDay,
      isArchived: false 
    };
    setAreas(prev => [...prev, newArea]);
    setNewAreaName('');
  };

  const updateAreaDetails = (id: string, name: string, day: string) => {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, name, assignedDay: day } : a));
  };

  const captureCurrentLocation = async () => {
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
      const validatedLoc = { 
        lat: Number(pos.coords.latitude), 
        lng: Number(pos.coords.longitude)
      };
      setEditingShop(prev => ({ ...prev, location: validatedLoc }));
    } catch (err) { alert("GPS retrieval failed."); }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingShop(prev => ({ ...prev, photo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const saveProduct = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const name = editingProduct.name?.trim();
    const price = Number(editingProduct.price);
    const stock = Number(editingProduct.stock || 0);
    const discount = Number(editingProduct.discount || 0);
    if (!name || isNaN(price)) return;
    const finalProduct: Product = {
      id: editingProduct.id || generateId(),
      name: name,
      weight: editingProduct.weight?.trim() || '',
      price: Math.max(0, price),
      discount: Math.min(100, Math.max(0, discount)),
      stock: Math.max(0, stock),
      category: editingProduct.category?.trim() || 'General',
      status: editingProduct.status || 'Active',
      photo: editingProduct.photo,
      createdAt: editingProduct.createdAt || Date.now(),
      isArchived: false
    };
    setProducts(prev => {
      const exists = prev.some(p => p.id === finalProduct.id);
      return exists 
        ? prev.map(p => p.id === finalProduct.id ? finalProduct : p)
        : [finalProduct, ...prev];
    });
    setIsEditingProduct(false);
    setEditingProduct(null);
  }, [editingProduct]);

  const deleteProduct = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('confirmDeleteProduct'))) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p));
    }
  }, [t]);

  const handleProductPhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingProduct(prev => ({ ...prev, photo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  }, []);

  const saveDealer = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealer) return;
    const companyName = editingDealer.companyName?.trim();
    const dealerName = editingDealer.dealerName?.trim();
    const address = editingDealer.address?.trim();
    const phone = editingDealer.phone?.trim();
    if (!companyName || !dealerName || !phone) {
      alert("Please fill in required fields.");
      return;
    }
    const finalDealer: Dealer = {
      id: editingDealer.id || generateId(),
      companyName,
      dealerName,
      address: address || '',
      phone,
      description: editingDealer.description?.trim() || '',
      createdAt: editingDealer.createdAt || Date.now(),
      isArchived: false
    };
    setDealers(prev => {
      const exists = prev.some(d => d.id === finalDealer.id);
      return exists 
        ? prev.map(d => d.id === finalDealer.id ? finalDealer : d)
        : [finalDealer, ...prev];
    });
    setIsEditingDealer(false);
    setEditingDealer(null);
    alert(lang === 'en' ? "Dealer saved successfully!" : "ডিলার তথ্য সংরক্ষিত হয়েছে!");
  }, [editingDealer, lang]);

  const deleteDealer = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(lang === 'en' ? 'Delete this dealer?' : 'এই ডিলার তথ্যটি মুছতে চান?')) {
      setDealers(prev => prev.map(d => d.id === id ? { ...d, isArchived: true } : d));
    }
  }, [lang]);

  const calculateFinalPrice = (price: number, discount: number = 0) => {
    return price - (price * discount / 100);
  };

  const filteredShopsList = useMemo(() => {
    return activeShops.filter(shop => {
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArea = selectedAreaId === 'all' || shop.areaId === selectedAreaId;
      return matchesSearch && matchesArea;
    });
  }, [activeShops, searchQuery, selectedAreaId]);

  const startNavigation = (shop: Shop) => {
    setNavigationTarget(shop);
    setView('Map');
    setViewingShop(null);
    setViewingRoute(null);
  };

  const handleExportData = () => {
    const backupData = {
      version: "1.2.9", 
      timestamp: Date.now(),
      shops,
      areas,
      routes,
      visits,
      products,
      orders,
      dealers,
      settings: { detectionRange, nearbyRange, lang }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fieldpro_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (!importedData.shops || !importedData.areas || !importedData.routes) {
          throw new Error("Invalid file structure.");
        }
        const mergeById = <T extends { id?: string; shopId?: string; date?: string }>(existing: T[], imported: T[]) => {
          const getKey = (item: any) => item.id || `${item.shopId}-${item.date}`;
          const existingKeys = new Set(existing.map(item => getKey(item)));
          const newItems = imported.filter(item => !existingKeys.has(getKey(item)));
          return [...existing, ...newItems];
        };
        setShops(mergeById(shops, importedData.shops));
        setAreas(mergeById(areas, importedData.areas));
        setRoutes(mergeById(routes, importedData.routes));
        if (importedData.visits) setVisits(mergeById(visits, importedData.visits));
        if (importedData.products) setProducts(mergeById(products, importedData.products));
        if (importedData.orders) setOrders(mergeById(orders, importedData.orders));
        if (importedData.dealers) setDealers(mergeById(dealers, importedData.dealers));
        alert(lang === 'en' ? "Import successful!" : "ইম্পোর্ট সফল হয়েছে!");
      } catch (err: any) { alert("Import failed."); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const isInRideMode = !!(navigationTarget && view === 'Map');

  const quickAccessItems = [
    { id: 'catalog', key: 'productCatalog', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: 'orders', key: 'orderTaking', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v10m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
    { id: 'summary', key: 'dailySummary', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'dealers', key: 'dealerDistributor', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { id: 'analytics', key: 'analytics', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'routes', key: 'smartRoute', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
  ];

  const addToCart = (product: Product) => {
    setOrderCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        discount: product.discount || 0
      }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setOrderCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartSummary = useMemo(() => {
    const subtotal = orderCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = orderCart.reduce((acc, item) => {
      const discountedPrice = item.price - (item.price * item.discount / 100);
      return acc + (discountedPrice * item.quantity);
    }, 0);
    return { subtotal, total };
  }, [orderCart]);

  const confirmOrder = () => {
    if (!orderShop || orderCart.length === 0) return;
    const validationErrorItem = orderCart.find(item => {
      const prod = products.find(p => p.id === item.productId);
      return !prod || prod.stock < item.quantity;
    });
    if (validationErrorItem) {
      alert(`Order Failed: Insufficient stock for ${validationErrorItem.productName}.`);
      return;
    }
    setProducts(current => current.map(p => {
      const ordered = orderCart.find(item => item.productId === p.id);
      return ordered ? { ...p, stock: Math.max(0, p.stock - ordered.quantity) } : p;
    }));
    
    // Logic: Explicitly snapshot full dealer metadata into order fields for historical durability
    const activeDealer = dealers.find(d => !d.isArchived);
    const newOrder: Order = {
      id: generateId(),
      shopId: orderShop.id,
      shopName: orderShop.name,
      dealerId: activeDealer?.id,
      dealerName: activeDealer?.companyName || 'Official Distributor',
      dealerProprietor: activeDealer?.dealerName,
      dealerPhone: activeDealer?.phone,
      dealerAddress: activeDealer?.address,
      dealerDescription: activeDealer?.description,
      items: [...orderCart],
      subtotal: cartSummary.subtotal,
      total: cartSummary.total,
      timestamp: Date.now(),
      date: todayIso
    };
    setOrders(prev => [newOrder, ...prev]);
    setOrderCart([]);
    setOrderTab('history');
    alert(lang === 'en' ? "Order placed successfully!" : "অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
  };

  const shareOrderSummary = (order: Order) => {
    const itemsText = order.items.map(i => `- ${i.productName}: ${i.quantity} x ৳${i.price - (i.price * i.discount / 100)}`).join('\n');
    const text = `*FieldPro Order Summary*\n\n*Shop:* ${order.shopName}\n*Date:* ${order.date}\n\n*Items:*\n${itemsText}\n\n*Total:* ৳${order.total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const deleteOrder = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Delete this order?' : 'মুছে ফেলতে চান?')) {
      setOrders(prev => prev.filter(o => o.id !== id));
      if (selectedOrderForDetail?.id === id) setSelectedOrderForDetail(null);
    }
  };

  // Logic: Switched to UTF-8 Plain Text Report system to bypass browser/mobile binary parsing bugs 
  // that often misinterpret generated PDFs as "Encrypted" or "Password Protected".
  const handleDownloadPDF = (order: Order) => {
    const company = order.dealerName || 'FieldPro Sales';
    const proprietor = order.dealerProprietor || 'Official Distributor';
    const address = order.dealerAddress || 'Warehouse Center';
    const phone = order.dealerPhone || 'N/A';
    const note = order.dealerDescription || '';
    
    const itemsList = order.items.map(i => `${i.productName} (x${i.quantity}) - ৳${i.price * i.quantity}`).join('\n');
    const reportText = `[ ${company} ]\n${proprietor}\n${address}\nPhone: ${phone}\n${note ? `Note: ${note}\n` : ''}\n----------------------------\nINVOICE: ${order.id.slice(-6)}\nDATE: ${order.date}\nCUSTOMER: ${order.shopName}\n----------------------------\nSUMMARY:\n${itemsList}\n----------------------------\nTOTAL: ৳${order.total}\n----------------------------\nSystem Generated Receipt`;
    
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${order.id.slice(-6)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Logic helper: Updates the rendering sequence to use a 2-column grid for paired shop metadata
  const renderOrderDetail = (order: Order) => {
    const shop = shops.find(s => s.id === order.shopId);
    const area = areas.find(a => a.id === shop?.areaId);

    return (
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 animate-fadeIn text-left">
        {/* Hierarchy 1, 2 & 3: Dealer Information Header */}
        <div className="text-center py-4 border-b border-slate-50 space-y-2">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7" /></svg>
          </div>
          <h2 className="text-xl font-black text-indigo-700 uppercase tracking-tight">{order.dealerName || 'Official Distributor'}</h2>
          <div className="flex flex-col gap-1 opacity-90">
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{order.dealerProprietor || 'Proprietor'} • {order.dealerPhone || 'N/A'}</p>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight max-w-[90%] mx-auto">{order.dealerAddress || 'Warehouse Base'}</p>
          </div>
          {order.dealerDescription && (
            <p className="text-[10px] text-indigo-400 font-medium italic pt-2 px-6 leading-snug">"{order.dealerDescription}"</p>
          )}
        </div>

        {/* Hierarchy 4: Shop Information (Algorithm: Grid-Based Paired Rendering) */}
        <div className="bg-slate-50/80 p-5 rounded-3xl space-y-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Partner Information</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-[12px] font-bold text-slate-700">
            {/* Pair 1: Shop & Owner */}
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 font-black uppercase text-[8px] tracking-tighter">দোকান:</span>
              <span className="truncate">{order.shopName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 font-black uppercase text-[8px] tracking-tighter">মালিক:</span>
              <span className="truncate">{shop?.ownerName || 'সুজন আলী'}</span>
            </div>
            {/* Pair 2: Mobile & Address */}
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 font-black uppercase text-[8px] tracking-tighter">মোবাইল:</span>
              <span className="truncate">{shop?.phone || '০১৯৬৭৬'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 font-black uppercase text-[8px] tracking-tighter">ঠিকানা:</span>
              <span className="truncate">{area?.name || 'কল্যানপুর'}</span>
            </div>
            {/* Row 3: Sub-Area Spanning */}
            <div className="col-span-2 flex flex-col gap-0.5 border-t border-slate-100/50 pt-2">
              <span className="text-slate-400 font-black uppercase text-[8px] tracking-tighter">সাব-এরিয়া:</span>
              <span className="truncate">{shop?.subArea || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Hierarchy 5: Order Summary Items */}
        <div className="space-y-3 px-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Summary</p>
          <div className="space-y-2">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                <span>{it.productName} (x{it.quantity})</span>
                <span className="font-bold text-slate-800">৳{it.price * it.quantity}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-900 uppercase">Grand Total</span>
            <span className="text-2xl font-black text-indigo-600 leading-none">৳{order.total}</span>
          </div>
        </div>

        {/* Actions Logic */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
          <button onClick={() => handleDownloadPDF(order)} className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-3xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3" /></svg>
            Download
          </button>
          <button onClick={() => deleteOrder(order.id)} className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-3xl bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest active:scale-95 border border-rose-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isInRideMode ? 'h-screen pb-0' : 'pb-24'} flex flex-col overflow-hidden`}>
      {!isInRideMode && !viewingRoute && !showCatalog && !viewingProduct && !showOrderSystem && !showDealersList && !showAnalytics && !showSmartRoute && (
        <Header title={t('appTitle')} location={currentLocation} lang={lang} 
          onLangToggle={() => setLang(l => l === 'en' ? 'bn' : 'en')}
          isTracking={isTracking} onTrackingToggle={toggleTracking} 
          onKebabToggle={() => setShowQuickAccess(true)}
          showKebab={true}
          t={t}
        />
      )}
      
      <NotificationToast show={alertInfo.show} title={t('nearbyAlert')}
        message={<><span className="font-black underline decoration-white/20">{alertInfo.shopName}</span>{` (${alertInfo.ownerName}) ${t('within100m')}`}</>}
        onClose={() => setAlertInfo(prev => ({ ...prev, show: false }))}
      />

      <main className={`flex-1 flex flex-col ${isInRideMode || viewingRoute || viewingProduct || showOrderSystem || showDealersList || showAnalytics || showSmartRoute ? 'h-full p-0 overflow-hidden' : 'p-4 max-w-4xl mx-auto w-full'} relative`}>
        {view === 'Dashboard' && (
          <div className="space-y-6 animate-fadeIn flex-1 overflow-y-auto pb-4 scrollbar-hide">
            <div className="grid grid-cols-2 gap-4 flex-shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">{t('shops')}</p>
                <p className="text-3xl font-black text-indigo-600">{activeShops.length}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">{t('routes')}</p>
                <p className="text-3xl font-black text-rose-500">{activeRoutes.length}</p>
              </div>
            </div>

            <div className="space-y-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                  <span>{lang === 'en' ? 'Current Spot' : 'বর্তমান অবস্থান'}</span>
                </h4>
                <div className="flex items-center gap-2 bg-indigo-50/80 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter w-12">{detectionRange}m Range</span>
                  <input type="range" min="1" max="50" value={detectionRange} onChange={(e) => setDetectionRange(Number(e.target.value))} className="w-16 h-1 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
              </div>
              
              {atShop ? (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-5 shadow-lg shadow-emerald-100/50 animate-pulse-subtle flex gap-4 cursor-pointer" onClick={() => setViewingShop(atShop)}>
                  <div className="w-20 h-20 rounded-2xl bg-white flex-shrink-0 overflow-hidden border border-emerald-100 shadow-inner">
                    {atShop.photo ? <img src={atShop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-emerald-200"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{lang === 'en' ? `Identified at ${detectionRange}m:` : `${detectionRange} মিটারে শনাক্ত:`}</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 leading-tight truncate">{atShop.name}</h2>
                      {isVisitedToday(atShop.id) && <span className="bg-emerald-500 text-white rounded-full p-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold text-slate-600">{atShop.ownerName}</p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="bg-emerald-200 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">{activeAreas.find(a => a.id === atShop.areaId)?.name}</span>
                        {atShop.subArea && <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">{atShop.subArea}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? `Scanning within ${detectionRange}m...` : `${detectionRange} মিটার রেঞ্জে খোঁজা হচ্ছে...`}</p></div>
              )}
            </div>

            <div className="bg-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden shadow-xl flex-shrink-0">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase tracking-tight opacity-70">Field Areas ({currentDayName})</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dashboardAreas.length > 0 ? dashboardAreas.map(area => (
                    <button key={area.id} onClick={() => { setSelectedAreaId(area.id); setView('Shops'); }} className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium border border-white/20 text-left outline-none">{area.name}</button>
                  )) : <p className="text-[10px] font-bold text-white/50 italic">No areas assigned for {currentDayName}</p>}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
            </div>

            <div className="space-y-3 flex-1 min-h-0 flex flex-col">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700 flex items-center gap-2"><span>{t('nearbyShops')}</span>{nearbyShops.length > 0 && <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-black">{nearbyShops.length}</span>}</h4>
                <div className="flex items-center gap-2 bg-indigo-50/80 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm"><span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter w-14">{nearbyRange}m Range</span><input type="range" min="10" max="500" step="10" value={nearbyRange} onChange={(e) => setNearbyRange(Number(e.target.value))} className="w-20 h-1 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" /></div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1">
                <div className="h-full overflow-y-auto p-3 space-y-3 scrollbar-hide">
                  {nearbyShops.length > 0 ? nearbyShops.map(shop => (
                    <div key={shop.id} className="p-3 rounded-xl flex items-center gap-3 border border-slate-50 hover:border-indigo-100 bg-slate-50/30 transition-colors cursor-pointer" onClick={() => setViewingShop(shop)}>
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden relative">
                        {shop.photo ? <img src={shop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg></div>}
                        {isVisitedToday(shop.id) && <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm border border-white/20"><svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-800 leading-tight truncate flex items-center gap-1.5">{shop.name}</p>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex-shrink-0">{Math.round((shop as any).distance)}m</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-slate-500 truncate">{shop.ownerName}</p>
                          <div className="flex gap-1 items-center overflow-hidden">
                            <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1 py-0.5 rounded uppercase flex-shrink-0">{activeAreas.find(a => a.id === shop.areaId)?.name}</span>
                            {shop.subArea && <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-1 py-0.5 rounded uppercase truncate">{shop.subArea}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : <div className="py-8 text-center"><p className="text-xs font-bold text-slate-400 italic">No shops within {nearbyRange}m.</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'Map' && (
          <div className="absolute inset-0 z-0">
            <MapComponent 
              currentLocation={currentLocation} 
              shops={activeShops} 
              areas={activeAreas} 
              activeRoute={activeRoute} 
              navigationTarget={navigationTarget} 
              onStopNavigation={() => setNavigationTarget(null)} 
              onShopClick={(shop) => setViewingShop(shop)}
              t={t} 
            />
          </div>
        )}

        {view === 'Shops' && (
          <div className="flex flex-col h-full gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="relative flex-1"><input type="text" placeholder={t('search')} className="w-full bg-white rounded-2xl py-3.5 pl-11 pr-4 text-sm shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><svg className="w-5 h-5 absolute left-3.5 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
              <div className="flex gap-2">
                <button onClick={() => setIsManagingAreas(true)} className="bg-white text-slate-600 p-3.5 rounded-2xl shadow-sm border border-slate-200 transition-all active:scale-95"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                <button onClick={initAddShop} className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg transition-all active:scale-95"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 5a1 1 0 011-1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" /></svg></button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button onClick={() => setSelectedAreaId('all')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedAreaId === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>All Areas</button>
              {activeAreas.map(area => (<button key={area.id} onClick={() => setSelectedAreaId(area.id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedAreaId === area.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>{area.name}</button>))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-24 scrollbar-hide">
              {filteredShopsList.length > 0 ? filteredShopsList.map(shop => (
                <div key={shop.id} onClick={() => setViewingShop(shop)} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex gap-4 transition-all hover:shadow-md group cursor-pointer relative">
                   <div className="w-20 h-20 rounded-2xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 relative">
                     {shop.photo ? <img src={shop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg></div>}
                     {isVisitedToday(shop.id) && <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center"><div className="bg-emerald-500 text-white rounded-full p-1 shadow-lg border-2 border-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div></div>}
                   </div>
                   <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-900 leading-tight truncate group-hover:text-indigo-600 transition-colors">{shop.name}</h5>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-medium text-slate-500 truncate">{shop.ownerName}</p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[8px] font-black text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{activeAreas.find(a => a.id === shop.areaId)?.name}</span>
                        {shop.subArea && <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{shop.subArea}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={(e) => { e.stopPropagation(); startNavigation(shop); }} className="flex-1 bg-indigo-50 text-indigo-600 text-[10px] font-black py-2 rounded-xl uppercase tracking-wider">Navigate</button>
                      <button onClick={(e) => { e.stopPropagation(); setOrderShop(shop); setOrderTab('history'); setShowOrderSystem(true); }} className="px-4 bg-slate-50 text-slate-400 py-2 rounded-xl">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingShop(shop); setIsEditingShop(true); }} className="px-4 bg-slate-50 text-slate-400 py-2 rounded-xl">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {isVisitedToday(shop.id) && <div className="absolute top-4 right-4 text-emerald-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">{t('visited')}</div>}
                </div>
              )) : <div className="col-span-full py-20 text-center"><p className="text-slate-400 font-bold">{t('noShops')}</p></div>}
            </div>
          </div>
        )}

        {view === 'History' && (
          <div className="h-full flex flex-col relative animate-fadeIn pb-24 overflow-hidden">
            {/* Logic: History Tab Toggle */}
            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full max-w-xs mx-auto mb-4 shrink-0">
              <button onClick={() => { setHistoryTab('routes'); setSelectedOrderForDetail(null); }} className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-xl transition-all ${historyTab === 'routes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Routes</button>
              <button onClick={() => { setHistoryTab('orders'); setSelectedOrderForDetail(null); }} className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-xl transition-all ${historyTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Orders</button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {selectedOrderForDetail ? (
                <div className="animate-fadeIn p-4">
                  <button onClick={() => setSelectedOrderForDetail(null)} className="mb-4 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase bg-white px-5 py-2.5 rounded-full border border-indigo-100 shadow-sm transition-all active:scale-95">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M15 19l-7-7 7-7" /></svg> Back to List
                  </button>
                  {renderOrderDetail(selectedOrderForDetail)}
                </div>
              ) : historyTab === 'routes' ? (
                <div className="space-y-4 pb-8">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2 px-4 text-left">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('history')}
                  </h4>
                  <div className="px-4 space-y-4">
                    {activeRoutes.length > 0 ? activeRoutes.map(route => (
                      <div key={route.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-all active:scale-[0.98]" onClick={() => setViewingRoute(route)}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex flex-col flex-1 text-left">
                            <span className="text-sm font-black text-slate-800">{route.customAreaName || 'Trip'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{route.day ? `${route.day}, ` : ''}{route.date}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="flex gap-1.5 mr-1">
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{route.path.length} Pts</span>
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">{route.stops?.length || 0} Stops</span>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => deleteRoute(route.id, e)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : <div className="py-20 text-center text-slate-400">No route history yet.</div>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pb-8">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2 px-4 text-left">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                    </svg>
                    Recent Orders
                  </h4>
                  <div className="px-4 space-y-4">
                    {orders.length > 0 ? orders.map(order => (
                      <div key={order.id} onClick={() => setSelectedOrderForDetail(order)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer transition-all active:scale-[0.98]">
                        <div className="text-left">
                          <p className="text-[10px] font-black text-indigo-400 leading-none mb-1">{order.date}</p>
                          <h5 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{order.shopName}</h5>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 leading-none mb-1">৳{order.total}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase">#{order.id.slice(-5).toUpperCase()}</p>
                        </div>
                      </div>
                    )) : <div className="py-20 text-center text-slate-400">No orders placed yet.</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'Settings' && (
          <div className="flex flex-col h-full gap-6 animate-fadeIn pb-24 overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center">
               <h4 className="font-bold text-slate-700 flex items-center gap-2">
                 <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 000 6z" />
                 </svg>
                 {isManagingCatalog ? t('catalogSection') : t('settings')}
               </h4>
               {isManagingCatalog && (
                 <button onClick={() => setIsManagingCatalog(false)} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">Back</button>
               )}
            </div>

            {isManagingCatalog ? (
              <div className="space-y-6">
                 <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 px-6">
                    <p className="text-xs font-bold text-indigo-700">Total Products: {activeProducts.length}</p>
                    <button onClick={() => { setEditingProduct({ status: 'Active' }); setIsEditingProduct(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all active:scale-95">{t('addProduct')}</button>
                 </div>
                 <div className="space-y-3">
                    {activeProducts.length > 0 ? activeProducts.map(product => {
                      const finalPrice = calculateFinalPrice(product.price, product.discount);
                      return (
                        <div key={product.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100">
                            {product.photo ? <img src={product.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg></div>}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <h6 className="font-bold text-slate-800 truncate">{product.name}</h6>
                              {product.status === 'Inactive' && <span className="bg-slate-100 text-slate-400 text-[8px] px-1 rounded uppercase">Disabled</span>}
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">৳{finalPrice}</span>
                              {product.discount > 0 && <span className="text-[8px] text-slate-400 line-through font-bold">৳{product.price}</span>}
                              {product.weight && <span className="text-[9px] font-bold text-slate-400 border-l pl-2 border-slate-200">{product.weight}</span>}
                              <span className="text-[9px] font-bold text-emerald-600 ml-auto">Qty: {product.stock}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingProduct(product); setIsEditingProduct(true); }} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            <button onClick={(e) => deleteProduct(product.id, e)} className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:text-rose-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </div>
                      );
                    }) : <div className="py-20 text-center text-slate-300 italic text-sm">Catalog is empty. Add products to start.</div>}
                 </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <button 
                    onClick={() => setIsManagingCatalog(true)}
                    className="w-full bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-800 text-sm">{t('catalogSection')}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{activeProducts.length} Registered Items</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>

                  <button 
                    onClick={() => { setEditingDealer({}); setIsEditingDealer(true); }}
                    className="w-full bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-800 text-sm">Add Dealer</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{activeDealers.length} Current Dealers</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <div className="bg-indigo-700 rounded-3xl p-6 text-white shadow-xl space-y-5 relative overflow-hidden">
                  <div className="relative z-10">
                    <h5 className="font-black text-xs uppercase tracking-widest opacity-70 mb-4 px-2 text-left">Data Management</h5>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleExportData}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98]"
                      >
                        <div className="text-left">
                          <p className="font-bold text-sm">Export Local Backup</p>
                          <p className="text-[10px] opacity-60">Saves shops, areas & route history as JSON</p>
                        </div>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 9l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>

                      <button 
                        onClick={handleImportClick}
                        className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98]"
                      >
                        <div className="text-left">
                          <p className="font-bold text-sm">Import Local Backup</p>
                          <p className="text-[10px] opacity-80">Merge external file with existing data</p>
                        </div>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l3 3m-3-3L9 7" /></svg>
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
                </div>

                <div className="bg-slate-100 p-6 rounded-3xl text-center space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">App Information</p>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">FieldPro Sales Assistant v1.2.4<br/>Data is stored strictly on this device.</p>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* --- Dealer List Overlay (From Quick Access) --- */}
      {showDealersList && (
        <div className="fixed inset-0 z-[4500] bg-slate-50 flex flex-col animate-fadeIn overflow-hidden">
          <header className="bg-indigo-700 text-white p-4 shadow-lg flex items-center gap-4 shrink-0">
            <button 
              onClick={() => setShowDealersList(false)} 
              className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="text-lg font-black uppercase tracking-tight">{t('dealerDistributor')}</h3>
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">{activeDealers.length} Registered Partners</p>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {activeDealers.length > 0 ? (
              activeDealers.map(dealer => (
                <div key={dealer.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-3 group text-left">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{dealer.companyName}</p>
                      <h4 className="text-lg font-black text-slate-800 leading-tight">{dealer.dealerName}</h4>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setEditingDealer(dealer); setIsEditingDealer(true); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                       <button onClick={(e) => deleteDealer(dealer.id, e)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9m0 0l-1.414-1.414m1.414 1.414L15.828 18.07M12 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{dealer.address}</span>
                  </div>
                  
                  <a href={`tel:${dealer.phone}`} className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-indigo-600 font-black text-xs active:bg-indigo-50 transition-all border border-slate-100">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    {dealer.phone}
                  </a>
                  
                  {dealer.description && (
                    <div className="pt-2 border-t border-slate-50">
                      <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed line-clamp-2">"{dealer.description}"</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No dealers registered yet</p>
                <button onClick={() => { setShowDealersList(false); setView('Settings'); setEditingDealer({}); setIsEditingDealer(true); }} className="text-indigo-600 font-black text-xs uppercase underline decoration-indigo-200">Go to Settings to add dealer</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Visual Analytics Dashboard --- */}
      {showAnalytics && (
        <VisualAnalytics 
          orders={orders}
          shops={shops}
          visits={visits}
          areas={areas}
          products={products}
          onClose={() => setShowAnalytics(false)}
          lang={lang}
        />
      )}

      {/* --- Smart Route Optimizer --- */}
      {showSmartRoute && (
        <SmartRouteOptimizer 
          currentLocation={currentLocation}
          shops={shops}
          areas={areas}
          onClose={() => setShowSmartRoute(false)}
          onStartNavigation={(shop) => {
            startNavigation(shop);
            setShowSmartRoute(false);
          }}
          lang={lang}
          t={t}
        />
      )}

      {/* --- Add Dealer Form Overlay --- */}
      {isEditingDealer && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-scaleUp my-auto">
            <div className="px-6 py-5 bg-indigo-700 text-white flex justify-between items-center">
               <div className="text-left">
                 <h3 className="text-sm font-black uppercase tracking-tight">{editingDealer?.id ? 'Edit Dealer' : 'Add New Dealer'}</h3>
                 <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest">Business Partner Info</p>
               </div>
               <button onClick={() => setIsEditingDealer(false)} className="transition-all active:scale-90 p-2 hover:bg-white/10 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={saveDealer} className="p-6 space-y-5 text-left">
               <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name*</label>
                    <input required type="text" placeholder="e.g. Acme Corp Dist." className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all" value={editingDealer?.companyName || ''} onChange={e => setEditingDealer(prev => ({ ...prev, companyName: e.target.value }))} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dealer Name*</label>
                    <input required type="text" placeholder="e.g. John Doe" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all" value={editingDealer?.dealerName || ''} onChange={e => setEditingDealer(prev => ({ ...prev, dealerName: e.target.value }))} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                    <input type="text" placeholder="Full street address..." className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all" value={editingDealer?.address || ''} onChange={e => setEditingDealer(prev => ({ ...prev, address: e.target.value }))} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number*</label>
                    <input required type="tel" placeholder="01XXX-XXXXXX" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all" value={editingDealer?.phone || ''} onChange={e => setEditingDealer(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea rows={3} placeholder="Short note about the business..." className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all resize-none" value={editingDealer?.description || ''} onChange={e => setEditingDealer(prev => ({ ...prev, description: e.target.value }))} />
                  </div>
               </div>

               <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-xs">{t('save')}</button>
                  <button type="button" onClick={() => setIsEditingDealer(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs">{t('cancel')}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Product Catalog Browsing Overlay --- */}
      {showCatalog && (
        <div className={`fixed inset-0 z-[2000] bg-slate-50 flex flex-col animate-fadeIn ${viewingProduct ? 'hidden' : ''}`}>
          <header className="bg-indigo-700 text-white p-4 shadow-lg flex items-center gap-4">
            <button onClick={() => setShowCatalog(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="text-lg font-black uppercase tracking-tight">{t('productCatalog')}</h3>
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">{activeProducts.length} Items Available</p>
            </div>
            <div className="flex items-center gap-2">
              <select 
                className="bg-indigo-600 text-xs font-black p-2 rounded-lg outline-none border border-indigo-400"
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as any)}
              >
                <option value="name">Name</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
              </select>
            </div>
          </header>

          <div className="bg-white border-b border-slate-200 p-4 space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full bg-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold border border-transparent focus:bg-white focus:border-indigo-50 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
              <svg className="w-5 h-5 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCatalogCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCatalogCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            {filteredCatalogProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredCatalogProducts.map(product => {
                  const finalPrice = calculateFinalPrice(product.price, product.discount);
                  return (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col active:scale-95 transition-all group"
                      onClick={() => setViewingProduct(product)}
                    >
                      <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                        {product.photo ? (
                          <img src={product.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                        {product.discount > 0 && (
                          <div className="absolute top-3 left-3 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg uppercase">
                            {product.discount}% OFF
                          </div>
                        )}
                        {product.stock <= 0 && (
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-white/90 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col text-left">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 truncate">{product.category}</p>
                        <h5 className="font-bold text-slate-800 text-xs leading-tight mb-2 flex-1 line-clamp-2">{product.name}</h5>
                        <div className="flex items-end justify-between gap-1">
                          <div className="flex flex-col">
                            {product.discount > 0 && <span className="text-[9px] text-slate-400 line-through font-bold">৳{product.price}</span>}
                            <span className="text-sm font-black text-indigo-600">৳{finalPrice}</span>
                          </div>
                          {product.weight && <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-100 px-1.5 py-0.5 rounded-md">{product.weight}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No products match your criteria</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Swipeable Product Detail presentation logic */}
      {viewingProduct && (() => {
        const currentIndex = filteredCatalogProducts.findIndex(p => p.id === viewingProduct.id);
        if (currentIndex === -1) return null;
        return (
          <div className="fixed inset-0 z-[3000] bg-white flex flex-col animate-fadeIn overflow-hidden">
            <div className="absolute top-0 left-0 right-0 p-4 z-40 pointer-events-none flex justify-end">
              <button 
                onClick={() => setViewingProduct(null)} 
                className="bg-black/10 backdrop-blur-md text-slate-800 p-3 rounded-full pointer-events-auto active:scale-90 transition-all border border-black/5 shadow-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div 
              className="flex-1 flex touch-none"
              style={{
                width: `${filteredCatalogProducts.length * 100}vw`,
                transform: `translateX(calc(-${currentIndex * 100}vw + ${productDragX}px))`,
                transition: isDraggingProduct.current ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onTouchStart={handleProductTouchStart}
              onTouchMove={handleProductTouchMove}
              onTouchEnd={handleProductTouchEnd}
            >
              {filteredCatalogProducts.map((p) => (
                <div key={p.id} className="w-screen h-full flex flex-col bg-white overflow-hidden relative">
                  <div className="flex-[0.8] w-full bg-slate-50 flex items-center justify-center overflow-hidden">
                     {p.photo ? (
                        <img src={p.photo} className="w-full h-full object-contain select-none" alt={p.name} draggable={false} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Photo Placeholder</p>
                        </div>
                      )}
                  </div>
                  <div className="flex-[0.2] bg-white px-8 py-6 flex flex-col justify-center border-t border-slate-50 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] text-left">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-slate-900 leading-tight mb-1 truncate">{p.name}</h2>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.weight || 'Standard Size'}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{p.category || 'General'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                         {p.discount > 0 && <span className="text-xs font-black text-slate-400 line-through font-bold opacity-70 mb-0.5">৳{p.price}</span>}
                         <span className="text-2xl font-black text-indigo-600">৳{calculateFinalPrice(p.price, p.discount)}</span>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                       <div className="flex gap-1.5">
                          {filteredCatalogProducts.map((dot) => (
                            <div key={dot.id} className={`h-1 rounded-full transition-all duration-300 ${dot.id === p.id ? 'w-6 bg-indigo-500' : 'w-1 bg-slate-200'}`} />
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* --- Minimalist Order System Overlay --- */}
      {showOrderSystem && (
        <div className="fixed inset-0 z-[4000] bg-white flex flex-col animate-fadeIn overflow-hidden">
          <header className="bg-white border-b border-slate-100 p-4 flex items-center gap-4 shrink-0 shadow-sm">
            <button 
              onClick={() => { setShowOrderSystem(false); setOrderCart([]); setOrderShop(null); setSelectedOrderForDetail(null); }} 
              className="p-2 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">{t('orderTaking')}</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{orderShop ? orderShop.name : "Select Shop"}</p>
            </div>
            {orderShop && !selectedOrderForDetail && (
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button onClick={() => setOrderTab('taking')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${orderTab === 'taking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Order</button>
                <button onClick={() => setOrderTab('history')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${orderTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Recent</button>
              </div>
            )}
          </header>

          {!orderShop ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 text-left">Target Shop</p>
               <div className="space-y-3">
                 {activeShops.map(shop => (
                   <button key={shop.id} onClick={() => setOrderShop(shop)} className="w-full bg-slate-50 p-5 rounded-[2rem] border border-transparent hover:border-indigo-100 flex items-center justify-between group active:scale-[0.98] transition-all">
                     <div className="flex flex-col text-left">
                       <span className="font-bold text-slate-800 text-sm">{shop.name}</span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{shop.ownerName}</span>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></div>
                   </button>
                 ))}
               </div>
            </div>
          ) : selectedOrderForDetail ? (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
               <div className="mb-4 text-left"><button onClick={() => setSelectedOrderForDetail(null)} className="text-[10px] font-black text-indigo-600 uppercase bg-white px-5 py-2.5 rounded-full border border-indigo-100 shadow-sm transition-all active:scale-95">Back to history</button></div>
               {renderOrderDetail(selectedOrderForDetail)}
            </div>
          ) : orderTab === 'taking' ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
               <div className="bg-white p-4 space-y-3 shrink-0">
                 <div className="relative">
                   <input type="text" placeholder="Search products..." className="w-full bg-slate-50 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:bg-white border-2 border-transparent focus:border-indigo-50 transition-all outline-none" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
                   <svg className="w-4 h-4 absolute left-4 top-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setOrderSearch(cat === 'All' ? '' : cat)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${orderSearch === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{cat}</button>
                    ))}
                 </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                 {orderFilteredProducts.length > 0 ? (
                   <div className="grid grid-cols-1 gap-2">
                     {orderFilteredProducts.map(p => {
                       const inCart = orderCart.find(item => item.productId === p.id);
                       return (
                         <div key={p.id} className="bg-white p-3 rounded-[1.5rem] border border-slate-50 shadow-sm flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center text-slate-200">
                             {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg>}
                           </div>
                           <div className="flex-1 min-w-0 text-left">
                             <h6 className="font-bold text-slate-800 text-xs truncate">{p.name}</h6>
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-indigo-600">৳{calculateFinalPrice(p.price, p.discount)}</span>
                               <span className="text-[8px] text-slate-400 font-bold uppercase">{p.weight}</span>
                             </div>
                           </div>
                           {inCart ? (
                             <div className="flex items-center bg-indigo-50 rounded-xl overflow-hidden border border-indigo-100">
                               <button onClick={() => updateCartQty(p.id, -1)} className="p-2 text-indigo-600 active:bg-indigo-100"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg></button>
                               <span className="w-6 text-center text-[11px] font-black text-indigo-700">{inCart.quantity}</span>
                               <button onClick={() => updateCartQty(p.id, 1)} className="p-2 text-indigo-600 active:bg-indigo-100"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
                             </div>
                           ) : (
                             <button onClick={() => addToCart(p)} className="bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 ) : ( <div className="py-20 text-center text-slate-300 italic text-sm">No products found.</div> )}
               </div>
               {orderCart.length > 0 && (
                 <div className="bg-white border-t border-slate-100 p-6 pb-8 space-y-4 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)] animate-slideUp text-left">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Order Value</span>
                        <span className="text-3xl font-black text-slate-900 leading-none">৳{cartSummary.total}</span>
                      </div>
                      <button onClick={() => setOrderCart([])} className="text-[9px] font-black text-rose-400 uppercase border border-rose-100 px-3 py-1.5 rounded-lg active:bg-rose-50">Reset Cart</button>
                    </div>
                    <button onClick={confirmOrder} className="w-full bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-xs">Confirm Order</button>
                 </div>
               )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 scrollbar-hide">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 text-left">Orders for {orderShop.name}</p>
              {orders.filter(o => o.shopId === orderShop.id).length > 0 ? (
                orders.filter(o => o.shopId === orderShop.id).map(order => (
                  <div key={order.id} onClick={() => setSelectedOrderForDetail(order)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 text-left active:scale-[0.98] transition-all cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{order.date}</span>
                        <h5 className="font-black text-slate-800 text-sm">Order #{order.id.slice(-5)}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-indigo-600 leading-none">৳{order.total}</span>
                        <p className="text-[8px] text-slate-400 font-bold">{order.items.length} items</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 space-y-1">
                       {order.items.slice(0, 3).map((it, idx) => (
                         <div key={idx} className="flex justify-between text-[10px] font-medium text-slate-600">
                           <span>{it.productName} x {it.quantity}</span>
                           <span>৳{it.price * it.quantity}</span>
                         </div>
                       ))}
                       {order.items.length > 3 && <p className="text-[9px] text-indigo-400 font-bold italic pt-1">+ {order.items.length - 3} more items</p>}
                    </div>
                  </div>
                ))
              ) : ( <div className="py-20 text-center text-slate-300 italic text-sm">No recent orders for this shop.</div> )}
            </div>
          )}
        </div>
      )}

      {showQuickAccess && (
        <div className="fixed inset-0 z-[1000] animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowQuickAccess(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.35)] p-6 pb-12 animate-slideUp max-h-[85vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16m-7 6h7" /></svg></div>
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t('quickAccess')}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select an operation</p>
                </div>
              </div>
              <button onClick={() => setShowQuickAccess(false)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-full transition-all active:scale-90 border border-slate-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2">
              {quickAccessItems.map(item => (
                <button key={item.id} className="flex flex-col items-center gap-3 p-4 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all active:scale-95 group shadow-sm" onClick={() => {
                    if (item.id === 'catalog') setShowCatalog(true);
                    else if (item.id === 'orders') { setOrderTab('taking'); setShowOrderSystem(true); }
                    else if (item.id === 'dealers') setShowDealersList(true);
                    else if (item.id === 'analytics') setShowAnalytics(true);
                    else if (item.id === 'routes') setShowSmartRoute(true);
                    setShowQuickAccess(false);
                  }}>
                  <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">{item.icon}</div>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center leading-tight">{t(item.key)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isEditingProduct && (
        <div className="fixed inset-0 z-[2500] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-scaleUp my-auto">
            <div className="px-6 py-4 bg-indigo-700 text-white flex justify-between items-center">
               <div className="text-left">
                 <h3 className="text-sm font-black uppercase tracking-tight">{editingProduct?.id ? t('editProduct') : t('addProduct')}</h3>
                 <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest">Management System</p>
               </div>
               <button onClick={() => setIsEditingProduct(false)} className="transition-all active:scale-90 p-2 hover:bg-white/10 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={saveProduct} className="p-6 space-y-5 text-left">
               <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                    <input type="file" accept="image/*" className="hidden" ref={productPhotoRef} onChange={handleProductPhotoUpload} />
                    <button type="button" onClick={() => productPhotoRef.current?.click()} className="w-16 h-16 bg-white rounded-2xl shadow-sm border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-600 transition-all active:scale-95 overflow-hidden">
                       {editingProduct?.photo ? <img src={editingProduct.photo} className="w-full h-full object-cover" /> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    </button>
                    <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Product Image</p><button type="button" onClick={() => productPhotoRef.current?.click()} className="text-[11px] font-bold text-slate-500 underline decoration-slate-300">Tap to upload photo</button></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('productName')}*</label><input required type="text" placeholder="e.g. Master Soap Bar" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all" value={editingProduct?.name || ''} onChange={e => setEditingProduct(prev => ({ ...prev, name: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category*</label><input required type="text" placeholder="e.g. Hygiene" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" value={editingProduct?.category || ''} onChange={e => setEditingProduct(prev => ({ ...prev, category: e.target.value }))} /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight/Unit</label><input type="text" placeholder="e.g. 150g" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" value={editingProduct?.weight || ''} onChange={e => setEditingProduct(prev => ({ ...prev, weight: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('price')} (৳)*</label><input required type="number" placeholder="0.00" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" value={editingProduct?.price || ''} onChange={e => setEditingProduct(prev => ({ ...prev, price: Number(e.target.value) }))} /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount (%)</label><input type="number" placeholder="0" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" value={editingProduct?.discount || ''} onChange={e => setEditingProduct(prev => ({ ...prev, discount: Number(e.target.value) }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Qty</label><input type="number" placeholder="0" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" value={editingProduct?.stock || ''} onChange={e => setEditingProduct(prev => ({ ...prev, stock: Number(e.target.value) }))} /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label><button type="button" onClick={() => setEditingProduct(prev => ({ ...prev, status: prev?.status === 'Active' ? 'Inactive' : 'Active' }))} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${editingProduct?.status === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-200 border-slate-300 text-slate-500'}`}>{editingProduct?.status || 'Active'}</button></div>
                  </div>
               </div>
               {editingProduct?.price && (editingProduct?.discount || 0) > 0 && (
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex justify-between items-center px-6"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Final Sales Price</span><span className="text-sm font-black text-indigo-700">৳{calculateFinalPrice(Number(editingProduct.price), Number(editingProduct.discount || 0))}</span></div>
               )}
               <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-xs">{t('save')}</button>
                  <button type="button" onClick={() => setIsEditingProduct(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs">{t('cancel')}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {viewingRoute && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col animate-fadeIn">
          <div className="relative flex-1">
            <MapComponent currentLocation={currentLocation} shops={activeShops} areas={activeAreas} activeRoute={viewingRoute} t={t} />
            <button onClick={() => setViewingRoute(null)} className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md text-slate-700 p-2.5 rounded-xl shadow-xl border border-white/20 flex items-center gap-2 transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7 7-7" /></svg><span className="text-xs font-black uppercase tracking-widest">{t('cancel')}</span></button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-2xl flex flex-col items-center min-w-[180px]"><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Viewing Route</span><span className="text-sm font-bold truncate max-w-full">{viewingRoute.customAreaName || viewingRoute.date}</span></div>
          </div>
        </div>
      )}

      {isSavingRoute && (
        <div className="fixed inset-0 z-[800] bg-slate-900/70 backdrop-blur-md p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight">Save Your Route</h3>
              <button onClick={() => { setIsSavingRoute(false); setActiveRoute(null); }} className="transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={confirmSaveRoute} className="p-6 space-y-5 text-left">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Automatic Date</span><span className="font-bold text-slate-700">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg></div>
              </div>
              <div className="space-y-4">
                <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Day of Week</label><input required type="text" placeholder="e.g. Saturday" className="w-full bg-slate-50 rounded-2xl px-5 py-4 border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={routeSaveForm.day} onChange={e => setRouteSaveForm(prev => ({ ...prev, day: e.target.value }))} /></div>
                <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Trip / Area Name</label><input required type="text" placeholder="e.g. Uttara Sec-4 Trip" className="w-full bg-slate-50 rounded-2xl px-5 py-4 border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={routeSaveForm.areaName} onChange={e => setRouteSaveForm(prev => ({ ...prev, areaName: e.target.value }))} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 hover:bg-emerald-700 uppercase tracking-widest">Save Trip</button>
                <button type="button" onClick={() => { setIsSavingRoute(false); setActiveRoute(null); }} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition-all active:scale-95 hover:bg-slate-200 uppercase tracking-widest">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isManagingAreas && (
        <div className="fixed inset-0 z-[700] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center overflow-y-auto items-start md:items-center">
          <div className="bg-white w-full max-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-4 md:my-auto">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-lg font-bold uppercase">{lang === 'en' ? 'Manage Areas' : 'এলাকা ব্যবস্থাপনা'}</h3><button onClick={() => setIsManagingAreas(false)} className="transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="p-6 space-y-6 text-left">
              <form onSubmit={addArea} className="space-y-3">
                <label className="block text-xs font-black text-slate-500 uppercase">Add New Area</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. Uttara Section 4" className="flex-1 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200" value={newAreaName} onFocus={handleInputFocus} onChange={e => setNewAreaName(e.target.value)} />
                    <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl transition-all active:scale-95"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg></button>
                  </div>
                  <select className="w-full bg-slate-50 rounded-xl px-4 py-2 text-xs font-bold border border-slate-200" value={newAreaDay} onChange={e => setNewAreaDay(e.target.value)}>{WEEKDAYS.map(day => <option key={day} value={day}>{day}</option>)}</select>
                </div>
              </form>
              <div className="max-h-[250px] overflow-y-auto space-y-2 scrollbar-hide">
                {activeAreas.map(area => (
                  <div key={area.id} className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center justify-between"><input type="text" className="bg-transparent font-bold text-slate-700 flex-1 outline-none focus:bg-white px-1 rounded" value={area.name} onChange={(e) => updateAreaDetails(area.id, e.target.value, area.assignedDay || '')} /><button type="button" onClick={(e) => deleteArea(area.id, e)} className="text-rose-50 p-2 transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div>
                    <select className="bg-transparent text-[10px] font-black uppercase text-indigo-500 outline-none w-fit" value={area.assignedDay} onChange={(e) => updateAreaDetails(area.id, area.name, e.target.value)}>{WEEKDAYS.map(day => <option key={day} value={day}>{day}</option>)}</select>
                  </div>
                ))}
              </div>
              <button onClick={() => setIsManagingAreas(false)} className="w-full bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl transition-all active:scale-95">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {viewingShop && (
        <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-lg rounded-[3.5rem] overflow-hidden shadow-2xl animate-scaleUp my-auto relative">
            <button onClick={() => setViewingShop(null)} className="absolute top-4 right-4 z-20 bg-black/20 backdrop-blur-md text-white p-2 rounded-full transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <div className="h-64 w-full bg-slate-100 relative overflow-hidden">
              {viewingShop.photo ? <img src={viewingShop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-200"><svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
              <div className="absolute bottom-16 left-8 flex items-center gap-2"><span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full border border-indigo-400/50 uppercase tracking-widest shadow-lg">{activeAreas.find(a => a.id === viewingShop.areaId)?.name}</span>{viewingShop.subArea && <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/30 uppercase tracking-widest">{viewingShop.subArea}</span>}<span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/30 uppercase tracking-widest">Verified</span></div>
            </div>
            <div className="bg-white px-8 pb-10 pt-16 -mt-12 rounded-t-[3.5rem] relative z-10 shadow-[0_-35px_70px_-15px_rgba(0,0,0,0.35)] text-left">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3"><h2 className="text-3xl font-black text-slate-900 leading-tight mb-1">{viewingShop.name}</h2>{isVisitedToday(viewingShop.id) && <span className="bg-emerald-500 text-white rounded-full p-1.5 shadow-lg animate-scaleUp"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></span>}</div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Partner</span></div>
                </div>
                <a href={`tel:${viewingShop.phone}`} className="bg-emerald-500 text-white p-5 rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-90 hover:bg-emerald-600"><svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></a>
              </div>
              <div className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('ownerName')}</p><p className="text-lg font-bold text-slate-700 leading-tight truncate">{viewingShop.ownerName}</p></div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('mobile')}</p><p className="text-lg font-bold text-slate-700 leading-tight truncate">{viewingShop.phone}</p></div>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => toggleVisit(viewingShop.id)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border shadow-md active:scale-95 ${isVisitedToday(viewingShop.id) ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-900 border-slate-800 text-white'}`}>{isVisitedToday(viewingShop.id) ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg> {t('unmarkVisited')}</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> {t('markVisited')}</>}</button>
                   <button onClick={() => { setOrderShop(viewingShop); setOrderTab('taking'); setShowOrderSystem(true); setViewingShop(null); }} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase rounded-2xl shadow-sm active:scale-95 transition-all">Take Order</button>
                 </div>
                 <div className="rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner"><MiniMap location={viewingShop.location} label={viewingShop.name} /></div>
              </div>
              <button onClick={() => startNavigation(viewingShop)} className="w-full mt-8 bg-indigo-600 text-white font-black py-5 rounded-[1.8rem] shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-indigo-700"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9m0 0l-1.414-1.414m1.414 1.414L15.828 18.07M12 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{t('getDirections')}</button>
            </div>
          </div>
        </div>
      )}

      {isEditingShop && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center overflow-y-auto items-start md:items-center">
          <div className="bg-white w-full max-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-4 md:my-8">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-lg font-bold uppercase">{editingShop?.id ? t('editShop') : t('addShop')}</h3><button onClick={() => setIsEditingShop(false)} className="transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form onSubmit={saveShop} className="p-6 space-y-4 text-left">
              <div><label className="block text-xs font-black text-slate-500 uppercase mb-1">{t('shopName')}</label><input required type="text" className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.name || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black text-slate-500 uppercase mb-1">{t('ownerName')}</label><input required type="text" className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.ownerName || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, ownerName: e.target.value }))} /></div>
                <div><label className="block text-xs font-black text-slate-500 uppercase mb-1">{t('mobile')}</label><input required type="tel" className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.phone || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, phone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black text-slate-500 uppercase mb-1">{t('area')}</label><select required className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.areaId || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, areaId: e.target.value }))}><option value="">{t('selectArea')}</option>{activeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                <div><label className="block text-xs font-black text-slate-500 uppercase mb-1">{t('subArea')}</label><input type="text" placeholder="e.g. Block C" className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.subArea || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, subArea: e.target.value }))} /></div>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex justify-between items-center mb-3"><label className="block text-xs font-black text-indigo-900 uppercase">{t('map')} Location</label><button type="button" onClick={captureCurrentLocation} className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95">Current GPS</button></div>
                {editingShop?.location && <p className="text-[10px] text-indigo-400 font-mono mb-2">Lat: {editingShop.location.lat.toFixed(6)}, Lng: {editingShop.location.lng.toFixed(6)}</p>}
                <LocationPickerMap initialLocation={editingShop?.location || { lat: 23.8103, lng: 90.4125 }} onChange={(newLoc) => setEditingShop(prev => ({ ...prev, location: { lat: Number(newLoc.lat), lng: Number(newLoc.lng) } }))} />
              </div>
              <div><label className="block text-xs font-black text-slate-500 uppercase mb-1">{t('photo')}</label><div className="flex items-center gap-4"><input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handlePhotoUpload} /><label htmlFor="photo-upload" className="bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-black border border-indigo-100 cursor-pointer transition-all active:scale-95 hover:bg-indigo-100 uppercase tracking-widest">Capture Photo</label>{editingShop?.photo && <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg overflow-hidden border border-indigo-200"><img src={editingShop.photo} className="w-full h-full object-cover" /></div><span className="text-[10px] text-emerald-500 font-black uppercase">✓ OK</span></div>}</div></div>
              <div className="pt-2 flex gap-3"><button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 hover:bg-indigo-700">{t('save')}</button><button type="button" onClick={() => setIsEditingShop(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl transition-all active:scale-95 hover:bg-slate-200">{t('cancel')}</button></div>
            </form>
          </div>
        </div>
      )}

      {!isInRideMode && !viewingRoute && !showCatalog && !viewingProduct && !showOrderSystem && !showDealersList && !showAnalytics && !showSmartRoute && <Navbar view={view} setView={setView} t={t} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-subtle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.01); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-scaleUp { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-subtle { animation: pulse-subtle 3s infinite ease-in-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: #4f46e5; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); margin-top: -5px; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: #e0e7ff; border-radius: 1px; }
        .minimal-label { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .minimal-label:before { border-top-color: rgba(15, 23, 42, 0.85); }
      `}</style>
    </div>
  );
};

export default App;