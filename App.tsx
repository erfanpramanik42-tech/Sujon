import React, { Component, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { registerPlugin } from '@capacitor/core';
import { Search, Map, Plus, Pencil, Settings2, MapPin, DollarSign, Users, ChevronRight, Play, Pause, Navigation, Phone, Trash2, Download, Upload, Database, RefreshCw } from 'lucide-react';

const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');
import { AppView, Shop, Area, SalesRoute, GeoLocation, StopPoint, Visit, Product, Order, OrderItem, Dealer, ReplacementItem, Payment, Target, Expense, UserProfile, NotificationPreferences, Place, CompetitorTrack } from './types';
import { INITIAL_AREAS, INITIAL_SHOPS, INITIAL_PRODUCTS, TRANSLATIONS, DEMO_ROUTES, WEEKDAYS } from './constants';
import { DashboardView } from './components/DashboardView';
import { ShopsView } from './components/ShopsView';
import { CompetitorsView } from './components/CompetitorsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { OrderSystemOverlay } from './components/OrderSystemOverlay';
import { ShopDetailModal } from './components/ShopDetailModal';
import { AreaManagementModal } from './components/AreaManagementModal';
import { calculateDistance, getCurrentPosition } from './services/locationService';
import { getBatchRoadDistances } from './services/distanceService';
import { MapComponent } from './components/MapComponent';
import { NotificationToast } from './components/NotificationToast';
import { VisualAnalytics } from './components/VisualAnalytics';
import { SmartRouteOptimizer } from './components/SmartRouteOptimizer';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LocationPickerMap, MiniMap } from './components/MapUtils';

declare global {
  interface Window {
    Capacitor: any;
  }
}

// --- Helper: Translation Wrapper ---
const getT = (key: string, lang: 'en' | 'bn') => TRANSLATIONS[key]?.[lang] || key;

// --- Helper: Robust ID Generator ---
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// --- Main App Component ---
const App: React.FC = () => {
  const currentDayName = useMemo(() => {
    const dayIndex = new Date().getDay();
    return WEEKDAYS[dayIndex];
  }, []);

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [lang, setLang] = useState<'en' | 'bn'>(() => {
    return (localStorage.getItem('fieldpro_lang') as 'en' | 'bn') || 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_lang', lang);
    } catch (e) {
      console.warn("Failed to save lang to localStorage:", e);
    }
  }, [lang]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('fieldpro_theme') === 'dark';
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_notification_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          orderConfirmation: parsed.orderConfirmation ?? true,
          targetReminder: parsed.targetReminder ?? true,
          newShopDetection: parsed.newShopDetection ?? true
        };
      }
    } catch (e) {
      console.error("Error loading notification prefs:", e);
    }
    return {
      orderConfirmation: true,
      targetReminder: true,
      newShopDetection: true
    };
  });

  useEffect(() => {
    localStorage.setItem('fieldpro_notification_prefs', JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  useEffect(() => {
    localStorage.setItem('fieldpro_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_user_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error loading user profile:", e);
    }
    return { name: '', employeeId: '', designation: '', phone: '' };
  });

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.warn("Failed to save user profile to localStorage:", e);
    }
  }, [userProfile]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);

  const userPhotoRef = useRef<HTMLInputElement>(null);
  const handleUserProfilePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const [shops, setShops] = useState<Shop[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_shops');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_SHOPS;
      }
    } catch (e) {
      console.error("Error loading shops:", e);
    }
    return INITIAL_SHOPS;
  });
  const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_places');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading places:", e);
    }
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_places', JSON.stringify(places));
    } catch (e) {
      console.warn("Failed to save places to localStorage:", e);
    }
  }, [places]);

  const [areas, setAreas] = useState<Area[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_areas');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_AREAS;
      }
    } catch (e) {
      console.error("Error loading areas:", e);
    }
    return INITIAL_AREAS;
  });
  const [routes, setRoutes] = useState<SalesRoute[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_routes');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : DEMO_ROUTES;
      }
    } catch (e) {
      console.error("Error loading routes:", e);
    }
    return DEMO_ROUTES;
  });
  const [visits, setVisits] = useState<Visit[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_visits');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading visits:", e);
    }
    return [];
  });
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_PRODUCTS;
      }
    } catch (e) {
      console.error("Error loading products:", e);
    }
    return INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading orders:", e);
    }
    return [];
  });
  const [competitorTracks, setCompetitorTracks] = useState<CompetitorTrack[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_competitor_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading competitor tracks:", e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_competitor_tracks', JSON.stringify(competitorTracks));
    } catch (e) {
      console.warn("Failed to save competitor tracks to localStorage:", e);
    }
  }, [competitorTracks]);

  const [dealers, setDealers] = useState<Dealer[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_dealers');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading dealers:", e);
    }
    return [];
  });

  const [detectionRange, setDetectionRange] = useState<number>(() => {
    const saved = localStorage.getItem('fieldpro_range');
    return saved ? Number(saved) : 20; // Increased default to 20m
  });
  const [nearbyRange, setNearbyRange] = useState<number>(() => {
    const saved = localStorage.getItem('fieldpro_nearby_range');
    return saved ? Number(saved) : 100; // Increased default to 100m
  });

  const [view, setView] = useState<AppView>(() => {
    const saved = localStorage.getItem('fieldpro_view');
    return (saved as AppView) || 'Dashboard';
  });
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [lastLocationUpdateTime, setLastLocationUpdateTime] = useState<number>(0);
  const [isTracking, setIsTracking] = useState(() => {
    return localStorage.getItem('fieldpro_is_tracking') === 'true';
  });

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_view', view);
    } catch (e) {
      console.warn("Failed to save view to localStorage:", e);
    }
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_is_tracking', String(isTracking));
    } catch (e) {
      console.warn("Failed to save tracking state to localStorage:", e);
    }
  }, [isTracking]);
  const wakeLockRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Logic: Background Tracking Persistence (Wake Lock & Silent Audio)
  useEffect(() => {
    const requestWakeLock = async () => {
      // Try Capacitor KeepAwake first if available
      try {
        if (isTracking) {
          await KeepAwake.keepAwake();
        } else {
          await KeepAwake.allowSleep();
        }
      } catch (e) {
        console.warn('Capacitor KeepAwake not available or failed:', e);
      }

      // Try Web Wake Lock API as fallback
      if ('wakeLock' in navigator && isTracking) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.message.includes('permissions policy')) {
            console.warn('Wake Lock disallowed by policy. Using fallbacks (Audio/Capacitor).');
          } else {
            console.error('Wake Lock error:', err);
          }
        }
      }
    };

    const playSilentAudio = () => {
      if (isTracking) {
        if (!audioRef.current) {
          audioRef.current = new Audio('https://github.com/anars/blank-audio/raw/master/10-seconds-of-silence.mp3');
          audioRef.current.loop = true;
        }
        audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    if (isTracking) {
      requestWakeLock();
      playSilentAudio();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTracking) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) wakeLockRef.current.release();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [isTracking]);
  const [activeRoute, setActiveRoute] = useState<SalesRoute | null>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_active_route');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error loading active route:", e);
      return null;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>(() => {
    return localStorage.getItem('fieldpro_selected_area') || 'all';
  });

  useEffect(() => {
    try {
      if (activeRoute) {
        localStorage.setItem('fieldpro_active_route', JSON.stringify(activeRoute));
      } else {
        localStorage.removeItem('fieldpro_active_route');
      }
    } catch (e) {
      console.warn("Failed to save active route to localStorage:", e);
    }
  }, [activeRoute]);

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_selected_area', selectedAreaId);
    } catch (e) {
      console.warn("Failed to save selected area to localStorage:", e);
    }
  }, [selectedAreaId]);
  const [viewingRoute, setViewingRoute] = useState<SalesRoute | null>(null);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showPlaybackControls, setShowPlaybackControls] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [isManagingCatalog, setIsManagingCatalog] = useState(false);
  const [isManagingShops, setIsManagingShops] = useState(false);
  const [isManagingPlaces, setIsManagingPlaces] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [isEditingPlace, setIsEditingPlace] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingPlace, setEditingPlace] = useState<Partial<Place> | null>(null);
  
  // Logic Fix: Added state for Order detail and history toggling
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_selected_order_detail');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error loading selected order detail:", e);
      return null;
    }
  });
  const [historyTab, setHistoryTab] = useState<'routes' | 'orders'>(() => {
    return (localStorage.getItem('fieldpro_history_tab') as 'routes' | 'orders') || 'routes';
  });

  useEffect(() => {
    try {
      if (selectedOrderForDetail) {
        localStorage.setItem('fieldpro_selected_order_detail', JSON.stringify(selectedOrderForDetail));
      } else {
        localStorage.removeItem('fieldpro_selected_order_detail');
      }
    } catch (e) {
      console.warn("Failed to save selected order detail to localStorage:", e);
    }
  }, [selectedOrderForDetail]);

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_history_tab', historyTab);
    } catch (e) {
      console.warn("Failed to save history tab to localStorage:", e);
    }
  }, [historyTab]);

  // --- Route Playback Logic ---
  useEffect(() => {
    let interval: any;
    if (isPlaybackPlaying && viewingRoute && viewingRoute.path.length > 0) {
      interval = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= viewingRoute.path.length - 1) {
            setIsPlaybackPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaybackPlaying, viewingRoute, playbackSpeed]);

  useEffect(() => {
    if (!viewingRoute) {
      setIsPlaybackPlaying(false);
      setPlaybackIndex(0);
      setPlaybackSpeed(1);
      setShowPlaybackControls(false);
    }
  }, [viewingRoute]);

  // --- Kalman Filter Logic State ---
  const kalmanStateRef = useRef<{ lat: number; lng: number; variance: number }>({ lat: 0, lng: 0, variance: -1 });

  const applyKalmanFilter = useCallback((newLat: number, newLng: number, accuracy: number, forceReset: boolean = false) => {
    const state = kalmanStateRef.current;
    
    // Warning: Check if coordinates are within Bangladesh bounds
    if (newLat < 20 || newLat > 27 || newLng < 87 || newLng > 93) {
      console.warn("Raw GPS coordinates outside Bangladesh bounds:", newLat, newLng);
    }

    // Units: degrees. 1m ≈ 0.000009 degrees.
    const DEG_PER_METRE = 0.000009;
    const r = Math.max((accuracy * DEG_PER_METRE) ** 2, (3 * DEG_PER_METRE) ** 2); // Measurement noise (min 3m)
    const q = (2.0 * DEG_PER_METRE) ** 2; // Process noise increased to 2m to allow following sharper turns and faster movement

    if (state.variance < 0 || forceReset) {
      kalmanStateRef.current = { lat: newLat, lng: newLng, variance: r };
      return { lat: newLat, lng: newLng };
    } else {
      // Check for sudden large jumps (e.g. > 100m) and reset filter if needed
      const jumpDist = calculateDistance({ lat: state.lat, lng: state.lng }, { lat: newLat, lng: newLng });
      if (jumpDist > 100) {
        kalmanStateRef.current = { lat: newLat, lng: newLng, variance: r };
        return { lat: newLat, lng: newLng };
      }

      state.variance += q;
      const k = state.variance / (state.variance + r);
      state.lat += k * (newLat - state.lat);
      state.lng += k * (newLng - state.lng);
      state.variance = (1 - k) * state.variance;
      return { lat: state.lat, lng: state.lng };
    }
  }, []);

  const handlePositionUpdate = useCallback((pos: any) => {
    const smoothed = applyKalmanFilter(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 10);
    const newLoc = { 
      lat: smoothed.lat, 
      lng: smoothed.lng,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      accuracy: pos.coords.accuracy
    };
    setCurrentLocation(newLoc);
    setLastLocationUpdateTime(Date.now());
    
    // Safety check for shopsRef
    if (shopsRef.current) {
      shopsRef.current.forEach(shop => {
        const dist = calculateDistance(newLoc, shop.location);
        // Use a slightly larger range for alerts than for "Current Spot" detection to give early warning
        const alertRange = Math.max(detectionRange * 1.5, 30);
        if (dist < alertRange) { 
          if (!alertedShopsRef.current.has(shop.id)) {
            setAlertInfo({ 
              show: true, 
              title: t('nearbyAlert'),
              message: <><span className="font-black underline decoration-white/20">{shop.name}</span>{` (${shop.ownerName}) ${t('within100m')}`}</>,
              type: 'error'
            });
            alertedShopsRef.current.add(shop.id);
          }
        } else if (dist > 100) {
          alertedShopsRef.current.delete(shop.id);
        }
      });
    }

    if (isTrackingRef.current && activeRouteRef.current) {
      // Ignore poor accuracy points to prevent "web" patterns in path
      if (pos.coords.accuracy && pos.coords.accuracy > 45) return;

      const lastPoint = activeRouteRef.current.path[activeRouteRef.current.path.length - 1];
      const displacement = lastPoint ? calculateDistance(newLoc, lastPoint) : 100;
      
      // Threshold reduced to 3m for better precision while following path exactly
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

    // Auto-Arrival Detection: Clear navigation if we arrive at target (within 15m)
    if (navigationTargetRef.current) {
      const distToTarget = calculateDistance(newLoc, navigationTargetRef.current.location);
      if (distToTarget < 15) {
         console.info("Target reached. Stopping navigation.");
         setNavigationTarget(null);
         setAlertInfo({
           show: true,
           title: t('success'),
           message: `You have arrived at ${navigationTargetRef.current.name}`,
           type: 'success'
         });
      }
    }
  }, [applyKalmanFilter, detectionRange, lang]);

  useEffect(() => {
    const setupAppListeners = async () => {
      try {
        const { App } = await import('@capacitor/app');
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // Force a fresh location fix when app resumes to ensure UI is up-to-date
            getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 }).then(pos => {
              if (pos) handlePositionUpdate(pos);
            }).catch(e => console.warn('Resume location fix failed:', e));
          }
        });
      } catch (e) {
        console.warn('Capacitor App plugin not available:', e);
      }
    };
    setupAppListeners();
  }, [handlePositionUpdate]);
  const [isEditingDealer, setIsEditingDealer] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Partial<Dealer> | null>(null);
  const [showDealersList, setShowDealersList] = useState(false);
  const [showDailySummary, setShowDailySummary] = useState(false);

  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('All');
  const [catalogSort, setCatalogSort] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  const [showOrderSystem, setShowOrderSystem] = useState(() => {
    return localStorage.getItem('fieldpro_show_order_system') === 'true';
  });
  const [orderShop, setOrderShop] = useState<Shop | null>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_order_shop');
      if (saved) {
        const parsed = JSON.parse(saved);
        return (typeof parsed === 'object' && parsed !== null && 'id' in parsed) ? parsed : null;
      }
    } catch (e) {
      console.error("Error loading order shop:", e);
    }
    return null;
  });
  const [orderCart, setOrderCart] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_order_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading order cart:", e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_show_order_system', String(showOrderSystem));
    } catch (e) {
      console.warn("Failed to save show order system to localStorage:", e);
    }
  }, [showOrderSystem]);

  useEffect(() => {
    try {
      if (orderShop) {
        localStorage.setItem('fieldpro_order_shop', JSON.stringify(orderShop));
      } else {
        localStorage.removeItem('fieldpro_order_shop');
      }
    } catch (e) {
      console.warn("Failed to save order shop to localStorage:", e);
    }
  }, [orderShop]);

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_order_cart', JSON.stringify(orderCart));
    } catch (e) {
      console.warn("Failed to save order cart to localStorage:", e);
    }
  }, [orderCart]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderTab, setOrderTab] = useState<'taking' | 'history'>('taking');
  const [orderReplacements, setOrderReplacements] = useState<ReplacementItem[]>([]);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [tempReplacement, setTempReplacement] = useState<Partial<ReplacementItem>>({});

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_payments');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading payments:", e);
    }
    return [];
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [tempPayment, setTempPayment] = useState<Partial<Payment>>({});

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_payments', JSON.stringify(payments));
    } catch (e) {
      console.warn("Failed to save payments to localStorage:", e);
    }
  }, [payments]);

  const getShopBalance = useCallback((shopId: string) => {
    const shopOrders = orders.filter(o => o.shopId === shopId);
    const shopPayments = payments.filter(p => p.shopId === shopId);
    const totalOrdered = shopOrders.reduce((sum, o) => sum + o.total, 0);
    const totalPaid = shopPayments.reduce((sum, p) => sum + p.amount, 0);
    return totalOrdered - totalPaid;
  }, [orders, payments]);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSmartRoute, setShowSmartRoute] = useState(false);
  const [showTargetVsAchievement, setShowTargetVsAchievement] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading expenses:", e);
    }
    return [];
  });
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [tempExpense, setTempExpense] = useState<Partial<Expense>>({});

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_expenses', JSON.stringify(expenses));
    } catch (e) {
      console.warn("Failed to save expenses to localStorage:", e);
    }
  }, [expenses]);

  const addExpense = () => {
    if (!tempExpense.category || !tempExpense.amount) return;
    const newExpense: Expense = {
      id: generateId(),
      category: tempExpense.category,
      amount: Number(tempExpense.amount),
      date: tempExpense.date || new Date().toISOString().split('T')[0],
      description: tempExpense.description,
      timestamp: Date.now()
    };
    setExpenses(prev => [newExpense, ...prev]);
    setTempExpense({});
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const [targets, setTargets] = useState<Target[]>(() => {
    try {
      const saved = localStorage.getItem('fieldpro_targets');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading targets:", e);
    }
    return [];
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Partial<Target> | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('fieldpro_targets', JSON.stringify(targets));
    } catch (e) {
      console.warn("Failed to save targets to localStorage:", e);
    }
  }, [targets]);

  const getAchievement = useCallback((type: 'Sales' | 'Visits', period: 'Daily' | 'Monthly') => {
    const now = new Date();
    const startOfPeriod = new Date();
    if (period === 'Daily') {
      startOfPeriod.setHours(0, 0, 0, 0);
    } else {
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
    }

    if (type === 'Sales') {
      const periodOrders = orders.filter(o => {
        const orderDate = new Date(o.timestamp);
        return orderDate >= startOfPeriod && orderDate <= now;
      });
      return periodOrders.reduce((sum, o) => sum + o.total, 0);
    } else {
      const periodVisits = visits.filter(v => {
        const visitDate = new Date(v.timestamp);
        return visitDate >= startOfPeriod && visitDate <= now;
      });
      return periodVisits.length;
    }
  }, [orders, visits]);

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
  const [viewingFullPhoto, setViewingFullPhoto] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ 
    show: boolean; 
    title: string; 
    message: React.ReactNode; 
    type: 'success' | 'error' | 'info'
  }>({
    show: false,
    title: '',
    message: '',
    type: 'error'
  });

  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [routeSaveForm, setRouteSaveForm] = useState({ day: '', areaName: '' });

  const activeAreas = useMemo(() => areas.filter(a => !a.isArchived), [areas]);
  const activeRoutes = useMemo(() => routes.filter(r => !r.isArchived), [routes]);
  // Safety: Include shops even if areaId is missing or invalid to prevent "disappearing shops"
  const activeShops = useMemo(() => {
    return shops.filter(s => !s.isArchived);
  }, [shops]);
  const activePlaces = useMemo(() => places.filter(p => !p.isArchived), [places]);
  
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

  const todayShopsCount = useMemo(() => {
    return activeShops.filter(s => dashboardAreas.some(a => a.id === s.areaId)).length;
  }, [activeShops, dashboardAreas]);

  const visitedTodayCount = useMemo(() => {
    return visits.filter(v => v.date === todayIso).length;
  }, [visits, todayIso]);

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

  // Logic: Clear stale active routes on initialization
  useEffect(() => {
    if (activeRoute && activeRoute.startTime) {
      const routeAgeHrs = (Date.now() - activeRoute.startTime) / (1000 * 60 * 60);
      if (routeAgeHrs > 18) {
        console.warn("Clearing stale tracking route from yesterday.");
        setActiveRoute(null);
        localStorage.removeItem('fieldpro_active_route');
      }
    }
  }, []);

  useEffect(() => {
    if (view !== 'Settings') {
      setIsManagingCatalog(false);
      setIsEditingProduct(false);
    }
  }, [view]);

  const [isAddingCompetitorTrack, setIsAddingCompetitorTrack] = useState(false);
  const [tempCompetitorTrack, setTempCompetitorTrack] = useState<Partial<CompetitorTrack>>({});
  const [competitorSearch, setCompetitorSearch] = useState('');

  const saveCompetitorTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCompetitorTrack.shopId || !tempCompetitorTrack.competitorName || !tempCompetitorTrack.productName || !tempCompetitorTrack.price) {
      setAlertInfo({ show: true, title: 'Error', message: 'Please fill all required fields', type: 'error' });
      return;
    }
    const shop = activeShops.find(s => s.id === tempCompetitorTrack.shopId);
    const newTrack: CompetitorTrack = {
      id: generateId(),
      shopId: tempCompetitorTrack.shopId,
      shopName: shop?.name || 'Unknown Shop',
      competitorName: tempCompetitorTrack.competitorName,
      productName: tempCompetitorTrack.productName,
      price: Number(tempCompetitorTrack.price),
      offerDetails: tempCompetitorTrack.offerDetails,
      photo: tempCompetitorTrack.photo,
      timestamp: Date.now(),
      date: todayIso
    };
    setCompetitorTracks(prev => [newTrack, ...prev]);
    setIsAddingCompetitorTrack(false);
    setTempCompetitorTrack({});
    setAlertInfo({ show: true, title: 'Success', message: 'Competitor info saved successfully', type: 'success' });
  };

  const deleteCompetitorTrack = (id: string) => {
    setCompetitorTracks(prev => prev.filter(t => t.id !== id));
  };

  const clearDemoData = () => {
    const demoShopIds = ['s1', 's2', 's3'];
    const demoAreaIds = ['1', '2', '3', '4'];
    setShops(prev => prev.filter(s => !demoShopIds.includes(s.id)));
    setAreas(prev => prev.filter(a => !demoAreaIds.includes(a.id)));
    setAlertInfo({ show: true, title: 'Success', message: 'Demo data cleared successfully', type: 'success' });
  };

  const resetApp = () => {
    if (window.confirm('Are you sure you want to reset the app? All your data will be permanently deleted.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const [isEditingShop, setIsEditingShop] = useState(false);
  const [isManagingAreas, setIsManagingAreas] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDay, setNewAreaDay] = useState(currentDayName);
  const [editingShop, setEditingShop] = useState<Partial<Shop> | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Shop | null>(null);
  const navigationTargetRef = useRef(navigationTarget);
  useEffect(() => { navigationTargetRef.current = navigationTarget; }, [navigationTarget]);

  // Back button support for Android/Mobile
  useEffect(() => {
    const isAnyModalOpen = 
      isEditingDealer || showDealersList || showCatalog || viewingProduct || 
      showOrderSystem || showReplacementModal || showPaymentModal || 
      showPaymentHistory || showAnalytics || showSmartRoute || 
      showTargetVsAchievement || showExpensesModal || viewingShop || 
      viewingFullPhoto || viewingRoute || isEditingTarget || isEditingShop ||
      isManagingAreas || isManagingCatalog || isEditingProduct || 
      navigationTarget || alertInfo.show || isSavingRoute || 
      showQuickAccess || selectedOrderForDetail || view !== 'Dashboard';

    if (isAnyModalOpen && !window.history.state?.modal) {
      window.history.pushState({ modal: true }, '');
    }

    const handlePopState = () => {
      setIsEditingDealer(false);
      setShowDealersList(false);
      setShowCatalog(false);
      setViewingProduct(null);
      setShowOrderSystem(false);
      setShowReplacementModal(false);
      setShowPaymentModal(false);
      setShowPaymentHistory(false);
      setShowAnalytics(false);
      setShowSmartRoute(false);
      setShowTargetVsAchievement(false);
      setShowExpensesModal(false);
      setViewingShop(null);
      setViewingFullPhoto(null);
      setViewingRoute(null);
      setIsEditingTarget(false);
      setIsEditingShop(false);
      setIsManagingAreas(false);
      setIsManagingCatalog(false);
      setIsEditingProduct(false);
      setNavigationTarget(null);
      setAlertInfo(prev => ({ ...prev, show: false }));
      setIsSavingRoute(false);
      setShowQuickAccess(false);
      setSelectedOrderForDetail(null);
      if (view !== 'Dashboard') setView('Dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isEditingDealer, showDealersList, showCatalog, viewingProduct, 
    showOrderSystem, showReplacementModal, showPaymentModal, 
    showPaymentHistory, showAnalytics, showSmartRoute, 
    showTargetVsAchievement, showExpensesModal, viewingShop, 
    viewingFullPhoto, viewingRoute, isEditingTarget, isEditingShop,
    isManagingAreas, isManagingCatalog, isEditingProduct, 
    navigationTarget, alertInfo.show, isSavingRoute,
    showQuickAccess, selectedOrderForDetail, view
  ]);

  // Location Watchdog: Restarts tracking if it gets stuck
  useEffect(() => {
    const watchdog = setInterval(() => {
      const now = Date.now();
      if (lastLocationUpdateTime > 0 && now - lastLocationUpdateTime > 30000) {
        console.warn('Location tracking seems stuck. Force refreshing...');
        getCurrentPosition({ enableHighAccuracy: true }).then(pos => {
          if (pos) {
            const smoothed = applyKalmanFilter(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 10);
            setCurrentLocation({
              lat: smoothed.lat,
              lng: smoothed.lng,
              accuracy: pos.coords.accuracy
            });
            setLastLocationUpdateTime(Date.now());
          }
        }).catch(console.error);
      }
    }, 15000);
    return () => clearInterval(watchdog);
  }, [lastLocationUpdateTime]);

  useEffect(() => {
    const isAnyModalOpen = 
      isEditingDealer || showDealersList || showCatalog || viewingProduct || 
      showOrderSystem || showReplacementModal || showPaymentModal || 
      showPaymentHistory || showAnalytics || showSmartRoute || 
      showTargetVsAchievement || showExpensesModal || viewingShop || 
      viewingFullPhoto || viewingRoute || isEditingTarget || isEditingShop ||
      isManagingAreas || isManagingCatalog || isEditingProduct || 
      navigationTarget || alertInfo.show || isSavingRoute ||
      showQuickAccess || selectedOrderForDetail || view !== 'Dashboard';

    if (!isAnyModalOpen && window.history.state?.modal) {
      window.history.back();
    }
  }, [
    isEditingDealer, showDealersList, showCatalog, viewingProduct, 
    showOrderSystem, showReplacementModal, showPaymentModal, 
    showPaymentHistory, showAnalytics, showSmartRoute, 
    showTargetVsAchievement, showExpensesModal, viewingShop, 
    viewingFullPhoto, viewingRoute, isEditingTarget, isEditingShop,
    isManagingAreas, isManagingCatalog, isEditingProduct, 
    navigationTarget, alertInfo.show, isSavingRoute,
    showQuickAccess, selectedOrderForDetail, view
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productPhotoRef = useRef<HTMLInputElement>(null);

  const t = useCallback((key: string) => getT(key, lang), [lang]);

  const isVisitedToday = useCallback((shopId: string) => {
    return visits.some(v => v.shopId === shopId && v.date === todayIso);
  }, [visits, todayIso]);

  const isSpecialDayNear = useCallback((dateString: string | undefined) => {
    if (!dateString) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const specialDate = new Date(dateString);
    
    const thisYear = now.getFullYear();
    const dateThisYear = new Date(thisYear, specialDate.getMonth(), specialDate.getDate());
    const datePrevYear = new Date(thisYear - 1, specialDate.getMonth(), specialDate.getDate());
    const dateNextYear = new Date(thisYear + 1, specialDate.getMonth(), specialDate.getDate());
    
    const diffDays = (d: Date) => Math.abs(d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    return diffDays(dateThisYear) <= 7 || diffDays(datePrevYear) <= 7 || diffDays(dateNextYear) <= 7;
  }, []);

  const getSpecialDayShops = useCallback(() => {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();

    return activeShops.filter(shop => {
      if (shop.birthday) {
        const bday = new Date(shop.birthday);
        if (bday.getMonth() === month && bday.getDate() === day) return true;
      }
      if (shop.anniversary) {
        const anniv = new Date(shop.anniversary);
        if (anniv.getMonth() === month && anniv.getDate() === day) return true;
      }
      return false;
    });
  }, [activeShops]);

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

  const [roadDistances, setRoadDistances] = useState<Record<string, number>>({});

  const lastFetchLocRef = useRef<GeoLocation | null>(null);

  // Fetch accurate road distances periodically or when location changes significantly
  useEffect(() => {
    if (!currentLocation || activeShops.length === 0) return;

    // Only fetch if moved more than 50m from last fetch or it's the first time
    const moveDist = lastFetchLocRef.current ? calculateDistance(currentLocation, lastFetchLocRef.current) : 1000;
    if (moveDist < 50) return;

    const fetchAccurateDistances = async () => {
      try {
        // For nearby shops only to save API costs and improve performance
        // Get shops within 2km for road distance calculation
        const potentialShops = activeShops
          .map(s => ({ ...s, d: calculateDistance(currentLocation, s.location) }))
          .filter(s => s.d < 2000) 
          .sort((a, b) => a.d - b.d)
          .slice(0, 10);

        if (potentialShops.length === 0) return;

        const shopLocations = potentialShops.map(s => s.location);
        const distances = await getBatchRoadDistances(currentLocation, shopLocations);
        
        const newRoadDistances: Record<string, number> = {};
        potentialShops.forEach((shop, index) => {
          newRoadDistances[shop.id] = distances[index];
        });
        
        setRoadDistances(newRoadDistances);
        lastFetchLocRef.current = currentLocation;
      } catch (error) {
        console.warn('Failed to fetch road distances:', error);
      }
    };

    const timeout = setTimeout(fetchAccurateDistances, 1000); 
    return () => clearTimeout(timeout);
  }, [currentLocation?.lat, currentLocation?.lng, activeShops.length]);

  const shopsWithDistances = useMemo(() => {
    if (!currentLocation) return [];
    return activeShops.map(shop => {
      const birdDist = calculateDistance(currentLocation, shop.location);
      let roadDist = roadDistances[shop.id];

      // Reset road distance if it significantly disagrees with bird distance (stale data)
      // Road distance MUST be >= bird distance (straight line is shortest).
      // We allow a small error margin of 10m for GPS accuracy differences between user and map.
      if (roadDist !== undefined && (birdDist > roadDist + 150 || roadDist < birdDist - 10)) {
        roadDist = undefined;
      }

      const finalDistance = roadDist !== undefined ? roadDist : birdDist;

      return { 
        ...shop, 
        distance: finalDistance,
        birdDistance: birdDist
      };
    });
  }, [activeShops, currentLocation, roadDistances]);

  const nearbyShops = useMemo(() => {
    return shopsWithDistances
      .filter(shop => shop.distance <= nearbyRange)
      .sort((a, b) => {
        // Stability tie-breaker
        if (Math.abs(a.distance - b.distance) < 1) {
          return (a.createdAt || 0) - (b.createdAt || 0);
        }
        return a.distance - b.distance;
      });
  }, [shopsWithDistances, nearbyRange]);

  const atShop = useMemo(() => {
    // Per user request: The shop with the minimum distance in the nearby list should be the current spot
    if (shopsWithDistances.length === 0) return undefined;
    
    // Sort all shops by distance to find the absolute closest one
    const sortedShops = [...shopsWithDistances].sort((a, b) => {
      if (Math.abs(a.distance - b.distance) < 1) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      }
      return a.distance - b.distance;
    });

    const closest = sortedShops[0];
    
    // Show as "Current Spot" if it's within a reasonable detection range (default 20m, max 50m)
    if (closest.distance <= Math.max(detectionRange, 50)) {
      return closest;
    }
    
    return undefined;
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
    try {
      localStorage.setItem('fieldpro_shops', JSON.stringify(shops));
      localStorage.setItem('fieldpro_areas', JSON.stringify(areas));
      localStorage.setItem('fieldpro_routes', JSON.stringify(routes));
      localStorage.setItem('fieldpro_visits', JSON.stringify(visits));
      localStorage.setItem('fieldpro_products', JSON.stringify(products));
      localStorage.setItem('fieldpro_orders', JSON.stringify(orders));
      localStorage.setItem('fieldpro_dealers', JSON.stringify(dealers));
      localStorage.setItem('fieldpro_places', JSON.stringify(places));
      localStorage.setItem('fieldpro_range', String(detectionRange));
      localStorage.setItem('fieldpro_nearby_range', String(nearbyRange));
    } catch (e) {
      console.warn("Failed to save data to localStorage:", e);
    }
  }, [shops, areas, routes, visits, products, orders, dealers, places, detectionRange, nearbyRange]);

  useEffect(() => {
    // Initial location fetch
    const getInitialLocation = async () => {
      try {
        const pos = await getCurrentPosition({ enableHighAccuracy: true });
        if (pos) {
          const smoothed = applyKalmanFilter(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 10);
          setCurrentLocation({ 
            lat: smoothed.lat, 
            lng: smoothed.lng,
            heading: pos.coords.heading,
            speed: pos.coords.speed
          });
        }
      } catch (e) {
        console.warn('Initial location fetch failed:', e);
      }
    };
    getInitialLocation();

    let watchId: string | number | null = null;
    let backgroundWatchId: string | null = null;

    const startLocationServices = async () => {
      try {
        // Request permissions
        try {
          const permissions = await Geolocation.checkPermissions();
          if (permissions.location !== 'granted') {
            await Geolocation.requestPermissions();
          }
        } catch (e) {
          console.warn('Permission check failed:', e);
        }

        // 1. Always start a standard Geolocation Watch for UI responsiveness while app is open
        try {
          watchId = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
            (pos) => {
              if (!pos) return;
              handlePositionUpdate(pos);
            }
          );
        } catch (capError: any) {
          // Fallback to browser geolocation if Capacitor is not available or fails
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              handlePositionUpdate({
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  heading: pos.coords.heading,
                  speed: pos.coords.speed
                },
                timestamp: pos.timestamp
              } as any);
            },
            (err) => console.error('Browser Geolocation error:', err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }

        // 2. Persistent Background Geolocation (only if isTracking is true)
        if (isTracking) {
          try {
            backgroundWatchId = await BackgroundGeolocation.addWatcher(
              {
                backgroundMessage: "FieldPro is tracking your sales route.",
                backgroundTitle: "Tracking Active",
                requestPermissions: true,
                stale: false,
                distanceFilter: 2, // More responsive background tracking
                interval: 3000, // Update every 3 seconds
                fastestInterval: 1000,
                activitiesInterval: 1000
              },
              (location, error) => {
                if (error) {
                  if (error.code !== "NOT_AUTHORIZED") {
                    console.error('Background Geolocation error:', error);
                  }
                  return;
                }
                if (location) {
                  handlePositionUpdate({
                    coords: {
                      latitude: location.latitude,
                      longitude: location.longitude,
                      accuracy: location.accuracy,
                      heading: location.bearing,
                      speed: location.speed
                    },
                    timestamp: location.time
                  } as any);
                }
              }
            );
          } catch (bgError) {
            console.warn('Background Geolocation not available:', bgError);
          }
        }
      } catch (err) {
        console.error('Location services setup error:', err);
      }
    };

    startLocationServices();

    return () => {
      if (watchId !== null) {
        if (typeof watchId === 'string') {
          Geolocation.clearWatch({ id: watchId });
        } else {
          navigator.geolocation.clearWatch(watchId);
        }
      }
      if (backgroundWatchId) {
        BackgroundGeolocation.removeWatcher({ id: backgroundWatchId });
      }
    };
  }, [isTracking]);

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
    setIsEditingShop(true);
    setEditingShop({ 
      name: '', 
      ownerName: '', 
      phone: '', 
      areaId: activeAreas.length > 0 ? activeAreas[0].id : '',
      location: currentLocation || { lat: 23.8103, lng: 90.4125 } 
    });
    
    try {
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Getting Location" : "লোকেশন নেওয়া হচ্ছে",
        message: lang === 'en' ? "Fetching fresh GPS coordinates..." : "নতুন জিপিএস কোঅর্ডিনেট নেওয়া হচ্ছে...",
        type: 'info'
      });
      
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      const freshLoc = { 
        lat: Number(Number(pos.coords.latitude).toFixed(7)), 
        lng: Number(Number(pos.coords.longitude).toFixed(7)),
        accuracy: pos.coords.accuracy
      };
      
      setEditingShop(prev => prev ? ({ ...prev, location: freshLoc }) : null);
      
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Location Ready" : "লোকেশন পাওয়া গেছে",
        message: lang === 'en' ? `Accuracy: ±${Math.round(pos.coords.accuracy || 0)}m` : `নির্ভুলতা: ±${Math.round(pos.coords.accuracy || 0)}মি`,
        type: 'success'
      });
    } catch (e) {
      if (currentLocation) {
        setEditingShop(prev => prev ? ({ ...prev, location: { lat: currentLocation.lat, lng: currentLocation.lng, accuracy: currentLocation.accuracy } }) : null);
        setAlertInfo({
          show: true,
          title: lang === 'en' ? "Using Last Known" : "পূর্বের লোকেশন ব্যবহার করা হচ্ছে",
          message: lang === 'en' ? "Could not get fresh GPS. Using last known position." : "নতুন জিপিএস পাওয়া যায়নি। পূর্বের অবস্থান ব্যবহার করা হচ্ছে।",
          type: 'info'
        });
      }
    }
  }, [currentLocation, activeAreas, lang]);

  const saveShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop || !editingShop.name) return;
    const finalLocData = editingShop.location 
      ? { lat: Number(Number(editingShop.location.lat).toFixed(7)), lng: Number(Number(editingShop.location.lng).toFixed(7)), accuracy: editingShop.location.accuracy }
      : (currentLocation ? { lat: Number(currentLocation.lat.toFixed(7)), lng: Number(currentLocation.lng.toFixed(7)), accuracy: currentLocation.accuracy } : { lat: 23.8103000, lng: 90.4125000 });

    // Validation: Ensure coordinates are within Bangladesh bounds to prevent extreme mismatches
    // Bangladesh: Lat 20.5-26.6, Lng 88.0-92.7
    if (finalLocData.lat < 20 || finalLocData.lat > 27 || finalLocData.lng < 87 || finalLocData.lng > 93) {
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Invalid Location" : "ভুল লোকেশন",
        message: lang === 'en' ? "The captured location seems to be outside Bangladesh. Please check your GPS." : "লোকেশনটি বাংলাদেশের বাইরে মনে হচ্ছে। দয়া করে আপনার জিপিএস চেক করুন।",
        type: 'error'
      });
      return;
    }
    
    // Check if location is too inaccurate
    if (finalLocData.accuracy && finalLocData.accuracy > 50) {
      const confirmSave = window.confirm(lang === 'en' 
        ? `Warning: GPS accuracy is low (±${Math.round(finalLocData.accuracy)}m). Save anyway?` 
        : `সতর্কতা: জিপিএস সিগন্যাল দুর্বল (±${Math.round(finalLocData.accuracy)}মি)। তবুও কি সেভ করবেন?`);
      if (!confirmSave) return;
    }
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
      isArchived: false,
      birthday: editingShop.birthday,
      anniversary: editingShop.anniversary
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
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Duplicate Area" : "এলাকা ইতিমধ্যে বিদ্যমান",
        message: lang === 'en' ? "Area already exists for this day." : "এই দিনের জন্য এই এলাকাটি ইতিমধ্যে বিদ্যমান।",
        type: 'error'
      });
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
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Capturing..." : "লোকেশন নেওয়া হচ্ছে...",
        message: lang === 'en' ? "Waiting for high-accuracy GPS fix..." : "উচ্চ-নির্ভুল জিপিএস সিগন্যালের জন্য অপেক্ষা করা হচ্ছে...",
        type: 'info'
      });

      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      
      if (pos.coords.accuracy && pos.coords.accuracy > 30) {
        setAlertInfo({
          show: true,
          title: lang === 'en' ? "Weak Signal" : "দুর্বল সিগন্যাল",
          message: lang === 'en' ? `GPS accuracy is too low (±${Math.round(pos.coords.accuracy)}m). Please move to an open area.` : `জিপিএস সিগন্যাল দুর্বল (±${Math.round(pos.coords.accuracy)}মি)। দয়া করে খোলা জায়গায় যান।`,
          type: 'error'
        });
        return;
      }

      const validatedLoc = { 
        lat: Number(Number(pos.coords.latitude).toFixed(7)), 
        lng: Number(Number(pos.coords.longitude).toFixed(7)),
        accuracy: pos.coords.accuracy
      };
      setEditingShop(prev => ({ ...prev, location: validatedLoc }));
      
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Success" : "সফল",
        message: lang === 'en' ? `Location captured with ±${Math.round(pos.coords.accuracy || 0)}m accuracy.` : `±${Math.round(pos.coords.accuracy || 0)}মি নির্ভুলতার সাথে লোকেশন নেওয়া হয়েছে।`,
        type: 'success'
      });
    } catch (err) { 
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "GPS Error" : "GPS ত্রুটি",
        message: lang === 'en' ? "GPS retrieval failed. Ensure location is enabled." : "জিপিএস তথ্য পেতে ব্যর্থ হয়েছে। লোকেশন চালু আছে কিনা নিশ্চিত করুন।",
        type: 'error'
      });
    }
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

  const deleteShop = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('confirmDeleteShop'))) {
      setShops(prev => prev.map(s => s.id === id ? { ...s, isArchived: true } : s));
      setAlertInfo({ show: true, message: 'Shop deleted successfully', type: 'success', title: 'Deleted' });
    }
  }, [t]);

  const deletePlace = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('confirmDeletePlace'))) {
      setPlaces(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p));
      setAlertInfo({ show: true, message: 'Place deleted successfully', type: 'success', title: 'Deleted' });
    }
  }, [t]);

  const savePlace = useCallback((place: Partial<Place>) => {
    if (!place.name || !place.location) return;
    
    if (place.id) {
      setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, ...place } as Place : p));
    } else {
      const newPlace: Place = {
        id: generateId(),
        name: place.name,
        description: place.description || '',
        location: place.location,
        createdAt: Date.now()
      };
      setPlaces(prev => [...prev, newPlace]);
    }
    setIsEditingPlace(false);
    setEditingPlace(null);
    setAlertInfo({ show: true, message: 'Place saved successfully', type: 'success', title: 'Saved' });
  }, []);

  const toggleShopStatus = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShops(prev => prev.map(shop => 
      shop.id === id 
        ? { ...shop, status: shop.status === 'Inactive' ? 'Active' : 'Inactive' } 
        : shop
    ));
    setAlertInfo({ show: true, message: 'Shop status updated', type: 'success', title: 'Updated' });
  }, []);

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
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Missing Fields" : "তথ্য অসম্পূর্ণ",
        message: lang === 'en' ? "Please fill in required fields." : "দয়া করে প্রয়োজনীয় তথ্যগুলো পূরণ করুন।",
        type: 'error'
      });
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
    setAlertInfo({
      show: true,
      title: lang === 'en' ? "Success" : "সফল",
      message: lang === 'en' ? "Dealer saved successfully!" : "ডিলার তথ্য সংরক্ষিত হয়েছে!",
      type: 'success'
    });
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
    return shopsWithDistances.filter(shop => {
      const area = activeAreas.find(a => a.id === shop.areaId);
      const areaName = area ? area.name.toLowerCase() : '';
      const subAreaName = shop.subArea ? shop.subArea.toLowerCase() : '';
      
      const matchesSearch = 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        areaName.includes(searchQuery.toLowerCase()) ||
        subAreaName.includes(searchQuery.toLowerCase());
        
      const matchesArea = selectedAreaId === 'all' || shop.areaId === selectedAreaId;
      return matchesSearch && matchesArea;
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [shopsWithDistances, searchQuery, selectedAreaId, activeAreas]);

  const startNavigation = (shop: Shop) => {
    setNavigationTarget(shop);
    setView('Map');
    setViewingShop(null);
    setViewingRoute(null);
  };

  const handleExportData = async () => {
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
    
    const fileName = `fieldpro_backup_${new Date().toISOString().split('T')[0]}.json`;
    const dataString = JSON.stringify(backupData, null, 2);

    // Check if running in Capacitor (Native Platform)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: dataString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'FieldPro Backup',
          text: 'Exported data backup',
          url: result.uri,
          dialogTitle: 'Save Backup',
        });
      } catch (error) {
        console.error('Error exporting data via Capacitor:', error);
        // Fallback to browser method
        const blob = new Blob([dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } else {
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
        setAlertInfo({
          show: true,
          title: lang === 'en' ? "Success" : "সফল",
          message: lang === 'en' ? "Import successful!" : "ইম্পোর্ট সফল হয়েছে!",
          type: 'success'
        });
      } catch (err: any) { 
        setAlertInfo({
          show: true,
          title: lang === 'en' ? "Error" : "ত্রুটি",
          message: lang === 'en' ? "Import failed: Invalid file structure." : "ইম্পোর্ট ব্যর্থ হয়েছে: ভুল ফাইল ফরম্যাট।",
          type: 'error'
        });
      }
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
    { id: 'targets', key: 'targetVsAchievement', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    { id: 'routes', key: 'smartRoute', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
    { id: 'expenses', key: 'expenses', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'competitors', key: 'competitorTracking', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" /></svg> },
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

  const dailySummaryData = useMemo(() => {
    const todayOrders = orders.filter(o => o.date === todayIso);
    const todayVisits = visits.filter(v => v.date === todayIso);
    const todayExpenses = expenses.filter(e => e.date === todayIso);
    const todayPayments = payments.filter(p => p.date === todayIso);

    const totalOrders = todayOrders.length;
    const totalOrderAmount = todayOrders.reduce((acc, o) => acc + o.total, 0);
    const totalVisits = todayVisits.length;
    const totalExpenses = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalPayments = todayPayments.reduce((acc, p) => acc + p.amount, 0);

    return { totalOrders, totalOrderAmount, totalVisits, totalExpenses, totalPayments };
  }, [orders, visits, expenses, payments, todayIso]);

  const confirmOrder = () => {
    try {
      if (!orderShop || orderCart.length === 0) return;
      const validationErrorItem = orderCart.find(item => {
        const prod = products.find(p => p.id === item.productId);
        return !prod || prod.stock < item.quantity;
      });
      if (validationErrorItem) {
        setAlertInfo({
          show: true,
          title: lang === 'en' ? "Order Failed" : "অর্ডার ব্যর্থ",
          message: lang === 'en' ? `Insufficient stock for ${validationErrorItem.productName}.` : `${validationErrorItem.productName}-এর পর্যাপ্ত স্টক নেই।`,
          type: 'error'
        });
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
        replacements: [...orderReplacements],
        subtotal: cartSummary.subtotal,
        total: cartSummary.total,
        timestamp: Date.now(),
        date: todayIso
      };
      setOrders(prev => [newOrder, ...prev]);
      setOrderCart([]);
      setOrderReplacements([]);
      setOrderTab('history');
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Success" : "সফল",
        message: lang === 'en' ? "Order placed successfully!" : "অর্ডার সফলভাবে সম্পন্ন হয়েছে!",
        type: 'success'
      });
    } catch (err: any) {
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Error" : "ত্রুটি",
        message: lang === 'en' ? `Failed to place order: ${err.message}` : `অর্ডার দিতে ব্যর্থ হয়েছে: ${err.message}`,
        type: 'error'
      });
    }
  };

  const addReplacement = () => {
    if (!tempReplacement.productId || !tempReplacement.quantity) {
      return;
    }
    
    const product = products.find(p => p.id === tempReplacement.productId);
    
    if (!product) return;
    
    const newItem: ReplacementItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity: tempReplacement.quantity
    };
    
    setOrderReplacements(prev => [...prev, newItem]);
    setTempReplacement({});
    setShowReplacementModal(false);
  };

  const removeReplacement = (id: string) => {
    setOrderReplacements(prev => prev.filter(r => r.id !== id));
  };

  const addPayment = () => {
    if (!tempPayment.amount || !tempPayment.shopId || !tempPayment.method) {
      setAlertInfo({
        show: true,
        title: lang === 'en' ? "Error" : "ত্রুটি",
        message: lang === 'en' ? "Please fill all required fields." : "সবগুলো ঘর পূরণ করুন।",
        type: 'error'
      });
      return;
    }

    const newPayment: Payment = {
      id: generateId(),
      shopId: tempPayment.shopId,
      amount: Number(tempPayment.amount),
      method: tempPayment.method as any,
      note: tempPayment.note,
      timestamp: Date.now(),
      date: todayIso
    };

    setPayments(prev => [newPayment, ...prev]);
    setTempPayment({});
    setShowPaymentModal(false);
    setAlertInfo({
      show: true,
      title: lang === 'en' ? "Success" : "সফল",
      message: lang === 'en' ? "Payment recorded successfully!" : "পেমেন্ট সফলভাবে রেকর্ড করা হয়েছে!",
      type: 'success'
    });
  };

  const saveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget?.type || !editingTarget?.period || !editingTarget?.value) return;

    const newTarget: Target = {
      id: editingTarget.id || generateId(),
      type: editingTarget.type as 'Sales' | 'Visits',
      period: editingTarget.period as 'Daily' | 'Monthly',
      value: Number(editingTarget.value),
      startDate: editingTarget.startDate || todayIso
    };

    if (editingTarget.id) {
      setTargets(prev => prev.map(t => t.id === editingTarget.id ? newTarget : t));
    } else {
      setTargets(prev => [newTarget, ...prev]);
    }
    setIsEditingTarget(false);
    setEditingTarget(null);
  };

  const deleteTarget = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Delete this target?' : 'টার্গেটটি মুছতে চান?')) {
      setTargets(prev => prev.filter(t => t.id !== id));
    }
  };

  const deletePayment = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Delete this payment record?' : 'পেমেন্ট রেকর্ডটি মুছতে চান?')) {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
  };

  const shareOrderSummary = (order: Order) => {
    const itemsText = order.items.map(i => `- ${i.productName}: ${i.quantity} x ৳${calculateFinalPrice(i.price, i.discount)}`).join('\n');
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
  const handleDownloadPDF = async (order: Order) => {
    const company = order.dealerName || 'FieldPro Sales';
    const proprietor = order.dealerProprietor || 'Official Distributor';
    const address = order.dealerAddress || 'Warehouse Center';
    const phone = order.dealerPhone || 'N/A';
    const note = order.dealerDescription || '';
    
    const itemsList = order.items.map(i => `${i.productName} (x${i.quantity}) - ৳${calculateFinalPrice(i.price, i.discount) * i.quantity}`).join('\n');
    const reportText = `[ ${company} ]\n${proprietor}\n${address}\nPhone: ${phone}\n${note ? `Note: ${note}\n` : ''}\n----------------------------\nINVOICE: ${order.id.slice(-6)}\nDATE: ${order.date}\nCUSTOMER: ${order.shopName}\n----------------------------\nSUMMARY:\n${itemsList}\n----------------------------\nTOTAL: ৳${order.total}\n----------------------------\nSystem Generated Receipt`;
    
    const fileName = `Receipt_${order.id.slice(-6)}.txt`;

    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: reportText,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'Order Receipt',
          text: `Receipt for order ${order.id.slice(-6)}`,
          url: result.uri,
          dialogTitle: 'Save Receipt',
        });
      } catch (error) {
        console.error('Error downloading receipt via Capacitor:', error);
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else {
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Logic helper: Updates the rendering sequence to use a 2-column grid for paired shop metadata
  const invoiceRef = useRef<HTMLDivElement>(null);

  const downloadOrderPDF = async (order: Order) => {
    if (!invoiceRef.current) return;
    
    try {
      setAlertInfo({
        show: true,
        title: 'Generating PDF',
        message: 'Please wait while we prepare your invoice...',
        type: 'info'
      });

      // Capture the element exactly as it appears in the app
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3, // High quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc, element) => {
          const ignoreElements = clonedDoc.querySelectorAll('[data-pdf-ignore]');
          ignoreElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });

          if (element) {
            // Maintain the app's look: rounded corners, padding, etc.
            element.style.margin = '0';
            element.style.boxShadow = 'none'; // Shadows can cause artifacts in PDF
            element.style.transform = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Convert canvas dimensions to mm (1px ≈ 0.264583mm)
      const pxToMm = 0.264583;
      const widthMm = (canvas.width / 3) * pxToMm;
      const heightMm = (canvas.height / 3) * pxToMm;

      // Create PDF with custom size matching the invoice
      const doc = new jsPDF({
        orientation: widthMm > heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [widthMm, heightMm]
      });
      
      doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
      
      const fileName = `Invoice_${order.shopName}_${order.date.replace(/\//g, '-')}.pdf`;

      // Capacitor specific download logic
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });

        await Share.share({
          title: 'Invoice PDF',
          text: 'Sharing your invoice PDF',
          url: savedFile.uri,
          dialogTitle: 'Share Invoice'
        });
      } else {
        doc.save(fileName);
      }
      
      setAlertInfo({
        show: true,
        title: 'Success',
        message: 'Invoice PDF generated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      setAlertInfo({
        show: true,
        title: 'Error',
        message: 'Failed to generate Invoice PDF.',
        type: 'error'
      });
    }
  };

  const renderOrderDetail = (order: Order) => {
    const shop = shops.find(s => s.id === order.shopId);
    const area = areas.find(a => a.id === shop?.areaId);

    return (
      <div ref={invoiceRef} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-fadeIn text-left">
        <div data-pdf-ignore className="flex items-center justify-between gap-2">
          <button onClick={() => setSelectedOrderForDetail(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
          <button 
            onClick={() => downloadOrderPDF(order)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-indigo-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download PDF
          </button>
        </div>
        {/* Hierarchy 1, 2 & 3: Dealer Information Header */}
        <div className="text-center py-2 border-b border-slate-50 space-y-1.5">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7" /></svg>
          </div>
          <h2 className="text-lg font-black text-indigo-700 uppercase tracking-tight">{order.dealerName || 'Official Distributor'}</h2>
          <div className="flex flex-col gap-0.5 opacity-90">
             <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{order.dealerProprietor || 'Proprietor'} • {order.dealerPhone || 'N/A'}</p>
             <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight max-w-[90%] mx-auto">{order.dealerAddress || 'Warehouse Base'}</p>
          </div>
          {order.dealerDescription && (
            <p className="text-[9px] text-indigo-400 font-medium italic pt-1.5 px-4 leading-snug">"{order.dealerDescription}"</p>
          )}
        </div>

        {/* Hierarchy 4: Shop Information (Algorithm: Grid-Based Paired Rendering) */}
        <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-0.5">Partner Information</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-[11px] font-bold text-slate-700">
            {/* Pair 1: Shop & Owner */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-black uppercase text-[7px] tracking-tighter leading-none">দোকান:</span>
              <span className="leading-normal break-words">{order.shopName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-black uppercase text-[7px] tracking-tighter leading-none">মালিক:</span>
              <span className="leading-normal break-words">{shop?.ownerName || 'সুজন আলী'}</span>
            </div>
            {/* Pair 2: Mobile & Address */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-black uppercase text-[7px] tracking-tighter leading-none">মোবাইল:</span>
              <span className="leading-normal break-words">{shop?.phone || '০১৯৬৭৬'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-black uppercase text-[7px] tracking-tighter leading-none">ঠিকানা:</span>
              <span className="leading-normal break-words">{area?.name || 'কল্যানপুর'}</span>
            </div>
            {/* Row 3: Sub-Area Spanning */}
            <div className="col-span-2 flex flex-col gap-1 border-t border-slate-100/50 pt-2">
              <span className="text-slate-400 font-black uppercase text-[7px] tracking-tighter leading-none">সাব-এরিয়া:</span>
              <span className="leading-normal break-words">{shop?.subArea || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Hierarchy 5: Order Summary Items */}
        <div className="space-y-2.5 px-0.5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Order Summary</p>
          <div className="space-y-1.5">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] font-medium text-slate-600">
                <div className="flex flex-col">
                  <span>{it.productName} (x{it.quantity})</span>
                  {it.discount > 0 && <span className="text-[7px] text-rose-500 font-bold uppercase">Discount: {it.discount}%</span>}
                </div>
                <span className="font-bold text-slate-800">৳{calculateFinalPrice(it.price, it.discount) * it.quantity}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-1">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
              <span>Subtotal (মোট)</span>
              <span>৳{order.subtotal}</span>
            </div>
            {order.subtotal > order.total && (
              <div className="flex justify-between items-center text-[9px] font-bold text-rose-500 uppercase">
                <span>Discount (ছাড়)</span>
                <span>-৳{Math.round(order.subtotal - order.total)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-1">
              <span className="text-[9px] font-black text-slate-900 uppercase">Grand Total (সর্বমোট)</span>
              <span className="text-xl font-black text-indigo-600 leading-tight">৳{order.total}</span>
            </div>
          </div>
        </div>

        {/* Replacement Summary - Simple Style */}
        {order.replacements && order.replacements.length > 0 && (
          <div className="space-y-2.5 px-0.5 pt-4 border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('replacementSection')}</p>
            <div className="space-y-2">
              {order.replacements.map((r, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-medium text-slate-600">
                    <span>{r.productName} (x{r.quantity})</span>
                    <span className="text-emerald-600 font-bold text-[8px] uppercase">Replaced (পরিবর্তিত)</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[8px] text-indigo-400 font-black italic uppercase tracking-widest text-center pt-1 opacity-70">*{t('noCharge')}</p>
          </div>
        )}

        {/* Actions Logic */}
        <div data-pdf-ignore className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-50">
          <button onClick={() => handleDownloadPDF(order)} className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-lg">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3" /></svg>
            Download
          </button>
          <button onClick={() => deleteOrder(order.id)} className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-widest active:scale-95 border border-rose-100">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isInRideMode || view === 'Map' ? 'h-screen pb-0' : 'pb-24'} flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors`}>
      {!isInRideMode && !viewingRoute && !showCatalog && !viewingProduct && !showOrderSystem && !showDealersList && !showAnalytics && !showSmartRoute && (
        <Header 
          title={t('appTitle')} 
          location={currentLocation} 
          lang={lang} 
          onLangToggle={() => setLang(l => l === 'en' ? 'bn' : 'en')}
          isTracking={isTracking} 
          onTrackingToggle={toggleTracking} 
          onKebabToggle={() => setShowQuickAccess(true)}
          showKebab={true}
          t={t}
          lastUpdated={lastLocationUpdateTime}
          onRefreshLocation={async () => {
            try {
              const pos = await getCurrentPosition({ enableHighAccuracy: true });
              if (pos) {
                // Force reset Kalman filter on manual refresh to clear any "stuck" state
                const smoothed = applyKalmanFilter(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 10, true);
                setCurrentLocation({
                  lat: smoothed.lat,
                  lng: smoothed.lng,
                  accuracy: pos.coords.accuracy
                });
                setLastLocationUpdateTime(Date.now());
                setAlertInfo({ 
                  show: true, 
                  title: lang === 'en' ? 'Success' : 'সফল', 
                  message: lang === 'en' ? 'Location refreshed and filter reset.' : 'লোকেশন রিফ্রেশ এবং ফিল্টার রিসেট করা হয়েছে।', 
                  type: 'success' 
                });
              }
            } catch (e) {
              setAlertInfo({ 
                show: true, 
                title: lang === 'en' ? 'Error' : 'ত্রুটি', 
                message: lang === 'en' ? 'Failed to refresh location' : 'লোকেশন রিফ্রেশ করতে ব্যর্থ হয়েছে।', 
                type: 'error' 
              });
            }
          }}
        />
      )}
      
      <NotificationToast 
        show={alertInfo.show} 
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo(prev => ({ ...prev, show: false }))}
      />

      <main className={`flex-1 flex flex-col ${view === 'Map' || isInRideMode || viewingRoute || viewingProduct || showOrderSystem || showDealersList || showAnalytics || showSmartRoute ? 'p-0 overflow-hidden' : 'p-3 max-w-4xl mx-auto w-full'} bg-slate-50 dark:bg-slate-950 relative`}>
        {view === 'Dashboard' && (
          <DashboardView 
            lang={lang}
            todayShopsCount={todayShopsCount}
            visitedTodayCount={visitedTodayCount}
            atShop={atShop}
            detectionRange={detectionRange}
            setDetectionRange={setDetectionRange}
            setViewingShop={setViewingShop}
            isVisitedToday={isVisitedToday}
            activeAreas={activeAreas}
            currentDayName={currentDayName}
            dashboardAreas={dashboardAreas}
            setSelectedAreaId={setSelectedAreaId}
            setView={setView}
            nearbyShops={nearbyShops}
            nearbyRange={nearbyRange}
            setNearbyRange={setNearbyRange}
            getSpecialDayShops={getSpecialDayShops}
            t={t}
          />
        )}

        {view === 'Map' && (
          <div className="absolute inset-0 z-0">
            <MapComponent 
              currentLocation={currentLocation} 
              shops={activeShops} 
              places={places}
              areas={activeAreas} 
              activeRoute={activeRoute} 
              navigationTarget={navigationTarget} 
              onStopNavigation={() => setNavigationTarget(null)} 
              onShopClick={(shop) => setViewingShop(shop)}
              visitedShopIds={visits.filter(v => v.date === todayIso).map(v => v.shopId)}
              t={t} 
            />
          </div>
        )}

        {view === 'Shops' && (
          <ShopsView 
            t={t}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setIsManagingAreas={setIsManagingAreas}
            initAddShop={initAddShop}
            selectedAreaId={selectedAreaId}
            setSelectedAreaId={setSelectedAreaId}
            activeAreas={activeAreas}
            filteredShopsList={filteredShopsList}
            setViewingShop={setViewingShop}
            isVisitedToday={isVisitedToday}
            startNavigation={startNavigation}
            setOrderShop={setOrderShop}
            setOrderTab={setOrderTab}
            setShowOrderSystem={setShowOrderSystem}
            setEditingShop={setEditingShop}
            setIsEditingShop={setIsEditingShop}
            currentLocation={currentLocation}
            calculateDistance={calculateDistance}
          />
        )}

        {view === 'Competitors' && (
          <CompetitorsView 
            lang={lang}
            competitorSearch={competitorSearch}
            setCompetitorSearch={setCompetitorSearch}
            setTempCompetitorTrack={setTempCompetitorTrack}
            setIsAddingCompetitorTrack={setIsAddingCompetitorTrack}
            competitorTracks={competitorTracks}
            deleteCompetitorTrack={deleteCompetitorTrack}
            t={t}
          />
        )}

        {view === 'History' && (
          <HistoryView 
            historyTab={historyTab}
            setHistoryTab={setHistoryTab}
            selectedOrderForDetail={selectedOrderForDetail}
            setSelectedOrderForDetail={setSelectedOrderForDetail}
            renderOrderDetail={renderOrderDetail}
            activeRoutes={activeRoutes}
            setViewingRoute={setViewingRoute}
            deleteRoute={deleteRoute}
            orders={orders}
            t={t}
          />
        )}

        {view === 'Settings' && (
          <SettingsView 
            isManagingCatalog={isManagingCatalog}
            setIsManagingCatalog={setIsManagingCatalog}
            isManagingShops={isManagingShops}
            setIsManagingShops={setIsManagingShops}
            isManagingPlaces={isManagingPlaces}
            setIsManagingPlaces={setIsManagingPlaces}
            t={t}
            activeProducts={activeProducts}
            setEditingProduct={setEditingProduct}
            setIsEditingProduct={setIsEditingProduct}
            calculateFinalPrice={calculateFinalPrice}
            deleteProduct={deleteProduct}
            activeShops={activeShops}
            toggleShopStatus={toggleShopStatus}
            deleteShop={deleteShop}
            activePlaces={activePlaces}
            setEditingPlace={setEditingPlace}
            setIsEditingPlace={setIsEditingPlace}
            deletePlace={deletePlace}
            userProfile={userProfile}
            setTempProfile={setTempProfile}
            setIsEditingProfile={setIsEditingProfile}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            activeDealers={activeDealers}
            setEditingDealer={setEditingDealer}
            setIsEditingDealer={setIsEditingDealer}
            notificationPrefs={notificationPrefs}
            setNotificationPrefs={setNotificationPrefs}
            handleExportData={handleExportData}
            handleImportClick={handleImportClick}
            clearDemoData={clearDemoData}
            resetApp={resetApp}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
          />
        )}

      </main>

      {/* --- Dealer List Overlay (From Quick Access) --- */}
      {showDealersList && (
        <div className="fixed inset-0 z-[4500] bg-slate-50 flex flex-col animate-fadeIn overflow-hidden">
          <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-4 shrink-0">
            <button 
              onClick={() => setShowDealersList(false)} 
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">{t('dealerDistributor')}</h3>
              <p className="text-[9px] text-indigo-600 font-black uppercase tracking-[0.1em] mt-1">
                {activeDealers.length} {activeDealers.length === 1 ? 'Registered Partner' : 'Registered Partners'}
              </p>
            </div>
            <button 
              onClick={() => { setShowDealersList(false); setView('Settings'); setEditingDealer({}); setIsEditingDealer(true); }}
              className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {activeDealers.length > 0 ? (
              activeDealers.map(dealer => (
                <div key={dealer.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3 text-left">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 border border-indigo-100">
                        {dealer.dealerName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider truncate">{dealer.companyName}</p>
                        <h4 className="text-sm font-bold text-slate-900 truncate leading-tight">{dealer.dealerName}</h4>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                       <button onClick={() => { setEditingDealer(dealer); setIsEditingDealer(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                       <button onClick={(e) => deleteDealer(dealer.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{dealer.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${dealer.phone}`} className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100/50 hover:bg-indigo-100 transition-all">
                        <Phone className="w-3 h-3" />
                        {dealer.phone}
                      </a>
                    </div>
                  </div>
                  
                  {dealer.description && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed line-clamp-2">"{dealer.description}"</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200 animate-pulse">
                    <Users className="w-12 h-12" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-300 border border-slate-100">
                    <Search className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-900 font-black uppercase tracking-widest text-xs">{t('noDealersFound') || 'No Partners Found'}</p>
                  <p className="text-slate-400 text-[10px] max-w-[200px] mx-auto leading-relaxed">You haven't added any dealers or distributors to your network yet.</p>
                </div>
                <button 
                  onClick={() => { setShowDealersList(false); setView('Settings'); setEditingDealer({}); setIsEditingDealer(true); }} 
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                >
                  Add Your First Partner
                </button>
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
          <div className="bg-white w-full max-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto">
            <div className="px-5 py-3 bg-indigo-700 text-white flex justify-between items-center">
               <div className="text-left">
                 <h3 className="text-xs font-black uppercase tracking-tight">{editingDealer?.id ? 'Edit Dealer' : 'Add New Dealer'}</h3>
                 <p className="text-[8px] text-indigo-200 font-bold uppercase tracking-widest">Business Partner Info</p>
               </div>
               <button onClick={() => setIsEditingDealer(false)} className="transition-all active:scale-90 p-1.5 hover:bg-white/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={saveDealer} className="p-4 space-y-4 text-left">
               <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name*</label>
                    <input required type="text" placeholder="e.g. Acme Corp Dist." className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs transition-all" value={editingDealer?.companyName || ''} onChange={e => setEditingDealer(prev => ({ ...prev, companyName: e.target.value }))} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dealer Name*</label>
                    <input required type="text" placeholder="e.g. John Doe" className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs transition-all" value={editingDealer?.dealerName || ''} onChange={e => setEditingDealer(prev => ({ ...prev, dealerName: e.target.value }))} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                    <input type="text" placeholder="Full street address..." className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs transition-all" value={editingDealer?.address || ''} onChange={e => setEditingDealer(prev => ({ ...prev, address: e.target.value }))} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number*</label>
                    <input required type="tel" placeholder="01XXX-XXXXXX" className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs transition-all" value={editingDealer?.phone || ''} onChange={e => setEditingDealer(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea rows={2} placeholder="Short note about the business..." className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs transition-all resize-none" value={editingDealer?.description || ''} onChange={e => setEditingDealer(prev => ({ ...prev, description: e.target.value }))} />
                  </div>
               </div>

               <div className="flex gap-2.5 pt-1">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-[10px]">{t('save')}</button>
                  <button type="button" onClick={() => setIsEditingDealer(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-[10px]">{t('cancel')}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Product Catalog Browsing Overlay --- */}
      {showCatalog && (
        <div className={`fixed inset-0 z-[2000] bg-slate-50 flex flex-col animate-fadeIn ${viewingProduct ? 'hidden' : ''}`}>
          <header className="bg-indigo-700 text-white p-3 shadow-lg flex items-center gap-3">
            <button onClick={() => setShowCatalog(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all active:scale-90">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="text-base font-black uppercase tracking-tight">{t('productCatalog')}</h3>
              <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest">{activeProducts.length} Items Available</p>
            </div>
            <div className="flex items-center gap-1.5">
              <select 
                className="bg-indigo-600 text-[10px] font-black p-1.5 rounded-md outline-none border border-indigo-400"
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as any)}
              >
                <option value="name">Name</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
              </select>
            </div>
          </header>

          <div className="bg-white border-b border-slate-200 p-3 space-y-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full bg-slate-100 rounded-xl py-2.5 pl-10 pr-3 text-xs font-bold border border-transparent focus:bg-white focus:border-indigo-50 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
              <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCatalogCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCatalogCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
            {filteredCatalogProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredCatalogProducts.map(product => {
                  const finalPrice = calculateFinalPrice(product.price, product.discount);
                  return (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col active:scale-95 transition-all group"
                      onClick={() => setViewingProduct(product)}
                    >
                      <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                        {product.photo ? (
                          <img src={product.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                        {product.discount > 0 && (
                          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-lg uppercase">
                            {product.discount}% OFF
                          </div>
                        )}
                        {product.stock <= 0 && (
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-white/90 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 flex-1 flex flex-col text-left">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 truncate">{product.category}</p>
                        <h5 className="font-bold text-slate-800 text-[10px] leading-tight mb-1 flex-1 line-clamp-2">{product.name}</h5>
                        <div className="flex items-end justify-between gap-1">
                          <div className="flex flex-col">
                            {product.discount > 0 && <span className="text-[7px] text-slate-400 line-through font-bold">৳{product.price}</span>}
                            <span className="text-[11px] font-black text-indigo-600 leading-none">৳{finalPrice}</span>
                          </div>
                          {product.weight && <span className="text-[7px] font-black text-slate-400 uppercase border border-slate-100 px-1 py-0.5 rounded-md">{product.weight}</span>}
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
                  <div className="flex-[0.2] bg-white px-5 py-3 flex flex-col justify-center border-t border-slate-50 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] text-left">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-black text-slate-900 leading-tight mb-0.5 truncate">{p.name}</h2>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.weight || 'Standard Size'}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{p.category || 'General'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                         {p.discount > 0 && <span className="text-[9px] font-black text-slate-400 line-through font-bold opacity-70 mb-0.5">৳{p.price}</span>}
                         <span className="text-sm font-black text-indigo-600 leading-none">৳{calculateFinalPrice(p.price, p.discount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                {filteredCatalogProducts.map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-indigo-600 w-3' : 'bg-slate-200'}`}></div>
                ))}
              </div>
            </div>
          );
        })()}

      {showOrderSystem && (
        <OrderSystemOverlay 
          orderTab={orderTab}
          setOrderTab={setOrderTab}
          setShowOrderSystem={setShowOrderSystem}
          orderShop={orderShop}
          products={products}
          orderFilteredProducts={orderFilteredProducts}
          orderSearch={orderSearch}
          setOrderSearch={setOrderSearch}
          categories={categories}
          addToCart={addToCart}
          updateCartQty={updateCartQty}
          orderCart={orderCart}
          cartSummary={cartSummary}
          setShowReplacementModal={setShowReplacementModal}
          setOrderCart={setOrderCart}
          orderReplacements={orderReplacements}
          removeReplacement={removeReplacement}
          confirmOrder={confirmOrder}
          orders={orders}
          selectedOrderForDetail={selectedOrderForDetail}
          setSelectedOrderForDetail={setSelectedOrderForDetail}
          renderOrderDetail={renderOrderDetail}
          downloadOrderPDF={downloadOrderPDF}
          calculateFinalPrice={calculateFinalPrice}
          t={t}
          setOrderReplacements={setOrderReplacements}
          setOrderShop={setOrderShop} 
          activeShops={activeShops}
        />
      )}

      {showReplacementModal && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto">
            <div className="px-5 py-4 bg-indigo-700 text-white flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-tight">{t('productReplacement')}</h3>
                <p className="text-[8px] text-indigo-200 font-bold uppercase tracking-widest">{t('noCharge')}</p>
              </div>
              <button onClick={() => { setShowReplacementModal(false); setTempReplacement({}); }} className="transition-all active:scale-90 p-1.5 hover:bg-white/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-5 space-y-4 text-left">
              <div className="space-y-3">
                {/* Replacement Product */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('replacedProduct')}</label>
                  <select 
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs"
                    value={tempReplacement.productId || ''}
                    onChange={e => setTempReplacement(prev => ({ ...prev, productId: e.target.value }))}
                  >
                    <option value="">{t('selectProduct')}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.weight})</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 shrink-0">{t('quantity')}</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs"
                      value={tempReplacement.quantity || ''}
                      onChange={e => setTempReplacement(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={addReplacement}
                  className="flex-1 bg-indigo-600 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                >
                  {t('addReplacement')}
                </button>
                <button 
                  onClick={() => { setShowReplacementModal(false); setTempReplacement({}); }}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuickAccess && (
        <div className="fixed inset-0 z-[1000] animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowQuickAccess(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.35)] p-5 pb-8 animate-slideUp max-h-[85vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16m-7 6h7" /></svg></div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t('quickAccess')}</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Select an operation</p>
                </div>
              </div>
              <button onClick={() => setShowQuickAccess(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-full transition-all active:scale-90 border border-slate-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-1">
              {quickAccessItems.map(item => (
                <button key={item.id} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all active:scale-95 group shadow-sm" onClick={() => {
                    if (item.id === 'catalog') setShowCatalog(true);
                    else if (item.id === 'orders') { setOrderTab('taking'); setShowOrderSystem(true); }
                    else if (item.id === 'summary') setShowDailySummary(true);
                    else if (item.id === 'dealers') setShowDealersList(true);
                    else if (item.id === 'analytics') setShowAnalytics(true);
                    else if (item.id === 'targets') setShowTargetVsAchievement(true);
                    else if (item.id === 'routes') setShowSmartRoute(true);
                    else if (item.id === 'expenses') setShowExpensesModal(true);
                    else if (item.id === 'competitors') setView('Competitors');
                    setShowQuickAccess(false);
                  }}>
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">{item.icon}</div>
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest text-center leading-tight">{t(item.key)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDailySummary && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t('dailySummary')}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{todayIso}</p>
                </div>
                <button onClick={() => setShowDailySummary(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-full transition-all active:scale-90 border border-slate-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Total Visits</p>
                  <p className="text-2xl font-black text-indigo-700">{dailySummaryData.totalVisits}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Total Orders</p>
                  <p className="text-2xl font-black text-emerald-700">{dailySummaryData.totalOrders}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 col-span-2">
                  <p className="text-[10px] font-black text-amber-500 uppercase mb-1">Total Order Amount</p>
                  <p className="text-3xl font-black text-amber-700">৳{dailySummaryData.totalOrderAmount.toLocaleString()}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Total Expenses</p>
                  <p className="text-2xl font-black text-rose-700">৳{dailySummaryData.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                  <p className="text-[10px] font-black text-sky-400 uppercase mb-1">Payments Collected</p>
                  <p className="text-2xl font-black text-sky-700">৳{dailySummaryData.totalPayments.toLocaleString()}</p>
                </div>
              </div>

              <button onClick={() => setShowDailySummary(false)} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-slate-200 transition-all active:scale-[0.98]">
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingProduct && (
        <div className="fixed inset-0 z-[2500] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto">
            <div className="px-5 py-3 bg-indigo-700 text-white flex justify-between items-center">
               <div className="text-left">
                 <h3 className="text-xs font-black uppercase tracking-tight">{editingProduct?.id ? t('editProduct') : t('addProduct')}</h3>
                 <p className="text-[8px] text-indigo-200 font-bold uppercase tracking-widest">Management System</p>
               </div>
               <button onClick={() => setIsEditingProduct(false)} className="transition-all active:scale-90 p-1.5 hover:bg-white/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={saveProduct} className="p-4 space-y-4 text-left">
               <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                    <input type="file" accept="image/*" className="hidden" ref={productPhotoRef} onChange={handleProductPhotoUpload} />
                    <button type="button" onClick={() => productPhotoRef.current?.click()} className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-600 transition-all active:scale-95 overflow-hidden">
                       {editingProduct?.photo ? <img src={editingProduct.photo} className="w-full h-full object-cover" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    </button>
                    <div><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Product Image</p><button type="button" onClick={() => productPhotoRef.current?.click()} className="text-[10px] font-bold text-slate-500 underline decoration-slate-300">Tap to upload photo</button></div>
                  </div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('productName')}*</label><input required type="text" placeholder="e.g. Master Soap Bar" className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs transition-all" value={editingProduct?.name || ''} onChange={e => setEditingProduct(prev => ({ ...prev, name: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category*</label><input required type="text" placeholder="e.g. Hygiene" className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs" value={editingProduct?.category || ''} onChange={e => setEditingProduct(prev => ({ ...prev, category: e.target.value }))} /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight/Unit</label><input type="text" placeholder="e.g. 150g" className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs" value={editingProduct?.weight || ''} onChange={e => setEditingProduct(prev => ({ ...prev, weight: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('price')} (৳)*</label><input required type="number" placeholder="0.00" className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs" value={editingProduct?.price || ''} onChange={e => setEditingProduct(prev => ({ ...prev, price: Number(e.target.value) }))} /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount (%)</label><input type="number" placeholder="0" className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs" value={editingProduct?.discount || ''} onChange={e => setEditingProduct(prev => ({ ...prev, discount: Number(e.target.value) }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Qty</label><input type="number" placeholder="0" className="w-full bg-white rounded-lg px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs" value={editingProduct?.stock || ''} onChange={e => setEditingProduct(prev => ({ ...prev, stock: Number(e.target.value) }))} /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label><button type="button" onClick={() => setEditingProduct(prev => ({ ...prev, status: prev?.status === 'Active' ? 'Inactive' : 'Active' }))} className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${editingProduct?.status === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-200 border-slate-300 text-slate-500'}`}>{editingProduct?.status || 'Active'}</button></div>
                  </div>
               </div>
               {editingProduct?.price && (editingProduct?.discount || 0) > 0 && (
                  <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center px-4"><span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Final Sales Price</span><span className="text-xs font-black text-indigo-700">৳{calculateFinalPrice(Number(editingProduct.price), Number(editingProduct.discount || 0))}</span></div>
               )}
               <div className="flex gap-2.5 pt-1">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-[10px]">{t('save')}</button>
                  <button type="button" onClick={() => setIsEditingProduct(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-[10px]">{t('cancel')}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {viewingRoute && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col animate-fadeIn">
          <div className="relative flex-1">
            <MapComponent 
              currentLocation={currentLocation} 
              shops={activeShops} 
              places={places}
              areas={activeAreas} 
              activeRoute={viewingRoute} 
              playbackLocation={isPlaybackPlaying || playbackIndex > 0 ? viewingRoute.path[playbackIndex] : null}
              showPlaybackControls={showPlaybackControls}
              onTogglePlaybackControls={() => setShowPlaybackControls(!showPlaybackControls)}
              onShopClick={(shop) => setViewingShop(shop)}
              visitedShopIds={viewingRoute ? visits.filter(v => v.timestamp >= viewingRoute.startTime && v.timestamp <= (viewingRoute.endTime || Date.now())).map(v => v.shopId) : []}
              t={t} 
            />
            <button 
              onClick={() => setViewingRoute(null)} 
              className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md text-slate-700 p-2.5 rounded-xl shadow-xl border border-white/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7 7-7" /></svg>
              <span className="text-xs font-black uppercase tracking-widest">{t('cancel')}</span>
            </button>
            
            {/* Playback Controls */}
            {showPlaybackControls && (
              <div className="absolute bottom-36 left-0 right-0 z-[1000] flex justify-center px-4 animate-scaleUp">
                <div className="bg-slate-900/95 backdrop-blur-xl text-white p-3 rounded-2xl shadow-2xl border border-white/10 w-full max-w-[280px] flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{t('routePlayback')}</span>
                      <span className="text-[10px] font-bold truncate max-w-[120px]">{viewingRoute.customAreaName || viewingRoute.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {currentLocation && (
                        <button 
                          onClick={() => {
                            // This will be handled by the MapComponent's isFollowing state if we could trigger it
                            // For now, we rely on the map's own follow button, but we can add a hint
                          }}
                          className="bg-white/10 hover:bg-white/20 p-1 rounded-md transition-colors"
                          title="My Location"
                        >
                          <Navigation className="w-3 h-3 text-blue-400" />
                        </button>
                      )}
                      {[1, 2, 4].map(speed => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-black transition-all ${playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsPlaybackPlaying(!isPlaybackPlaying)}
                      className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all active:scale-90"
                    >
                      {isPlaybackPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>

                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-400 transition-all duration-300" 
                          style={{ width: `${(playbackIndex / (viewingRoute.path.length - 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[7px] font-black uppercase tracking-tighter opacity-50">
                        <span>{playbackIndex + 1} / {viewingRoute.path.length}</span>
                        <span>{Math.round((playbackIndex / (viewingRoute.path.length - 1)) * 100)}%</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setPlaybackIndex(0); setIsPlaybackPlaying(true); }}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-2xl flex flex-col items-center min-w-[180px]">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Viewing Route</span>
              <span className="text-sm font-bold truncate max-w-full">{viewingRoute.customAreaName || viewingRoute.date}</span>
            </div>
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
        <AreaManagementModal 
          lang={lang}
          t={t}
          setIsManagingAreas={setIsManagingAreas}
          addArea={addArea}
          newAreaName={newAreaName}
          handleInputFocus={handleInputFocus}
          setNewAreaName={setNewAreaName}
          newAreaDay={newAreaDay}
          setNewAreaDay={setNewAreaDay}
          WEEKDAYS={WEEKDAYS}
          activeAreas={activeAreas}
          updateAreaDetails={updateAreaDetails}
          deleteArea={deleteArea}
        />
      )}

      {viewingShop && (
        <ShopDetailModal 
          viewingShop={viewingShop}
          setViewingShop={setViewingShop}
          setViewingFullPhoto={setViewingFullPhoto}
          activeAreas={activeAreas}
          isVisitedToday={isVisitedToday}
          t={t}
          lang={lang}
          getShopBalance={getShopBalance}
          isSpecialDayNear={isSpecialDayNear}
          setShowPaymentHistory={setShowPaymentHistory}
          setTempPayment={setTempPayment}
          setShowPaymentModal={setShowPaymentModal}
          toggleVisit={toggleVisit}
          setOrderShop={setOrderShop}
          setOrderTab={setOrderTab}
          setShowOrderSystem={setShowOrderSystem}
          startNavigation={startNavigation}
          updateShop={(updatedShop) => setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s))}
        />
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[700] bg-slate-900/60 backdrop-blur-sm p-3 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto">
            <div className="p-5 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{t('collectPayment')}</h3>
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">{viewingShop?.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="bg-white/20 p-2 rounded-full transition-all active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3 text-left">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{t('paymentAmount')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">৳</span>
                  <input 
                    required 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 rounded-xl pl-8 pr-4 py-2.5 text-lg font-black text-slate-900 border border-slate-200 focus:border-emerald-500 focus:ring-0 outline-none transition-all"
                    value={tempPayment.amount || ''} 
                    onChange={e => setTempPayment(prev => ({ ...prev, amount: Number(e.target.value) }))} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{t('paymentMethod')}</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Cash', 'Cheque', 'MFS', 'Other'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setTempPayment(prev => ({ ...prev, method: method as any }))}
                      className={`py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter border transition-all active:scale-95 ${tempPayment.method === method ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                      {t(method.toLowerCase() as any)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{t('paymentDate')}</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 border border-slate-200 focus:border-emerald-500 outline-none"
                    value={tempPayment.date || new Date().toISOString().split('T')[0]} 
                    onChange={e => setTempPayment(prev => ({ ...prev, date: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Note</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 border border-slate-200 focus:border-emerald-500 outline-none"
                    placeholder="Details..."
                    value={tempPayment.note || ''} 
                    onChange={e => setTempPayment(prev => ({ ...prev, note: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <button 
                  onClick={addPayment}
                  className="flex-1 bg-emerald-600 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95"
                >
                  {t('addPayment')}
                </button>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-slate-100 text-slate-500 font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditingShop && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm p-3 flex justify-center overflow-y-auto items-start md:items-center">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scaleUp my-2 md:my-4">
            <div className="p-4 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-sm font-bold uppercase tracking-wider">{editingShop?.id ? t('editShop') : t('addShop')}</h3><button onClick={() => setIsEditingShop(false)} className="transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form onSubmit={saveShop} className="p-4 space-y-3 text-left">
              <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('shopName')}</label><input required type="text" className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.name || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('ownerName')}</label><input required type="text" className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.ownerName || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, ownerName: e.target.value }))} /></div>
                <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('mobile')}</label><input required type="tel" className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.phone || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, phone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('area')}</label><select required className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.areaId || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, areaId: e.target.value }))}><option value="">{t('selectArea')}</option>{activeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('subArea')}</label><input type="text" placeholder="e.g. Block C" className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.subArea || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, subArea: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('birthday')}</label><input type="date" className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.birthday || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, birthday: e.target.value }))} /></div>
                <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('anniversary')}</label><input type="date" className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingShop?.anniversary || ''} onFocus={handleInputFocus} onChange={e => setEditingShop(prev => ({ ...prev, anniversary: e.target.value }))} /></div>
              </div>
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-indigo-900 uppercase leading-none">{t('locationStatus')}</label>
                      <p className={`text-[8px] font-bold flex items-center gap-1 mt-0.5 ${editingShop?.location?.accuracy && editingShop.location.accuracy > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        <span className={`w-1 h-1 rounded-full animate-pulse ${editingShop?.location?.accuracy && editingShop.location.accuracy > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        {editingShop?.location?.accuracy ? `${t('locationLocked')} (±${Math.round(editingShop.location.accuracy)}m)` : t('locationLocked')}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={captureCurrentLocation} className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm uppercase tracking-tight flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {t('useCurrentLocation')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-lg border border-indigo-100/50">
                    <p className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter mb-0.5">Latitude</p>
                    <p className="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">{editingShop?.location?.lat.toFixed(7)}</p>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-lg border border-indigo-100/50">
                    <p className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter mb-0.5">Longitude</p>
                    <p className="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">{editingShop?.location?.lng.toFixed(7)}</p>
                  </div>
                </div>

                <div className="h-32 rounded-lg overflow-hidden border border-indigo-100 shadow-inner">
                  <LocationPickerMap 
                    initialLocation={editingShop?.location || { lat: 23.8103, lng: 90.4125 }} 
                    onChange={(newLoc) => setEditingShop(prev => ({ ...prev, location: { lat: Number(newLoc.lat), lng: Number(newLoc.lng) } }))} 
                  />
                </div>
              </div>
              <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('photo')}</label><div className="flex items-center gap-3"><input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handlePhotoUpload} /><label htmlFor="photo-upload" className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-[10px] font-black border border-indigo-100 cursor-pointer transition-all active:scale-95 hover:bg-indigo-100 uppercase tracking-widest">Capture Photo</label>{editingShop?.photo && <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg overflow-hidden border border-indigo-200"><img src={editingShop.photo} className="w-full h-full object-cover" /></div><span className="text-[9px] text-emerald-500 font-black uppercase">✓ OK</span></div>}</div></div>
              <div className="pt-1 flex gap-2"><button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 hover:bg-indigo-700">{t('save')}</button><button type="button" onClick={() => setIsEditingShop(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 hover:bg-slate-200">{t('cancel')}</button></div>
            </form>
          </div>
        </div>
      )}

      {isAddingCompetitorTrack && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm p-3 flex justify-center overflow-y-auto items-start md:items-center">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scaleUp my-2 md:my-4">
            <div className="p-4 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider">{t('competitorTracking')}</h3>
              <button onClick={() => setIsAddingCompetitorTrack(false)} className="transition-all active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={saveCompetitorTrack} className="p-4 space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('shop')}</label>
                <select 
                  required 
                  className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={tempCompetitorTrack.shopId || ''} 
                  onChange={e => setTempCompetitorTrack(prev => ({ ...prev, shopId: e.target.value }))}
                >
                  <option value="">{t('selectShop')}</option>
                  {activeShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('competitorName')}</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={tempCompetitorTrack.competitorName || ''} 
                    onChange={e => setTempCompetitorTrack(prev => ({ ...prev, competitorName: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('productName')}</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={tempCompetitorTrack.productName || ''} 
                    onChange={e => setTempCompetitorTrack(prev => ({ ...prev, productName: e.target.value }))} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('price')}</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={tempCompetitorTrack.price || ''} 
                    onChange={e => setTempCompetitorTrack(prev => ({ ...prev, price: Number(e.target.value) }))} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('offerDetails')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 10% Off" 
                    className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={tempCompetitorTrack.offerDetails || ''} 
                    onChange={e => setTempCompetitorTrack(prev => ({ ...prev, offerDetails: e.target.value }))} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('photo')}</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="competitor-photo-upload" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setTempCompetitorTrack(prev => ({ ...prev, photo: reader.result as string }));
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  <label htmlFor="competitor-photo-upload" className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-[10px] font-black border border-indigo-100 cursor-pointer transition-all active:scale-95 hover:bg-indigo-100 uppercase tracking-widest">Capture Photo</label>
                  {tempCompetitorTrack.photo && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-indigo-200">
                        <img src={tempCompetitorTrack.photo} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] text-emerald-500 font-black uppercase">✓ OK</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-1 flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 hover:bg-indigo-700">{t('save')}</button>
                <button type="button" onClick={() => setIsAddingCompetitorTrack(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 hover:bg-slate-200">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentHistory && viewingShop && (
        <div className="fixed inset-0 z-[800] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto max-h-[80vh] flex flex-col">
            <div className="px-4 py-3 bg-indigo-700 text-white flex justify-between items-center shrink-0">
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-tight">{t('paymentHistory')}</h3>
                <p className="text-[8px] text-indigo-200 font-bold uppercase tracking-widest">{viewingShop.name}</p>
              </div>
              <button onClick={() => setShowPaymentHistory(false)} className="transition-all active:scale-90 p-1.5 hover:bg-white/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
              {payments.filter(p => p.shopId === viewingShop.id).length > 0 ? (
                payments.filter(p => p.shopId === viewingShop.id).map(payment => (
                  <div key={payment.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-800 leading-none mb-1">{payment.date}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100">{payment.method}</span>
                        {payment.note && <span className="text-[7px] text-slate-400 font-medium italic truncate max-w-[80px]">{payment.note}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-600">৳{payment.amount}</span>
                      <button onClick={() => deletePayment(payment.id)} className="p-1.5 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-all active:scale-90">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('noPayments')}</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0">
               <div className="flex justify-between items-center mb-2.5 px-1">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Collected</span>
                 <span className="text-sm font-black text-emerald-600">৳{payments.filter(p => p.shopId === viewingShop.id).reduce((sum, p) => sum + p.amount, 0)}</span>
               </div>
               <button 
                 onClick={() => { setShowPaymentHistory(false); setTempPayment({ shopId: viewingShop.id, method: 'Cash' }); setShowPaymentModal(true); }}
                 className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-indigo-700 text-[9px] uppercase tracking-widest"
               >
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                 {t('collectPayment')}
               </button>
            </div>
          </div>
        </div>
      )}

      {showTargetVsAchievement && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-indigo-700 text-white flex justify-between items-center shrink-0">
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-tight">{t('targetVsAchievement')}</h3>
                <p className="text-[8px] text-indigo-200 font-bold uppercase tracking-widest">Performance Tracking</p>
              </div>
              <button onClick={() => setShowTargetVsAchievement(false)} className="transition-all active:scale-90 p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Targets</h4>
                <button 
                  onClick={() => { setIsEditingTarget(true); setEditingTarget({ type: 'Sales', period: 'Daily', value: 0, startDate: todayIso }); }}
                  className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  Add Target
                </button>
              </div>

              {targets.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {targets.map(target => {
                    const achievement = getAchievement(target.type, target.period);
                    const percentage = Math.min(100, Math.round((achievement / target.value) * 100));
                    
                    return (
                      <div key={target.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative group">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${target.type === 'Sales' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                              {target.type === 'Sales' ? <DollarSign className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                  {target.period} {target.type}
                                </span>
                              </div>
                              <h5 className="text-sm font-black text-slate-800">
                                {target.type === 'Sales' ? `৳${target.value.toLocaleString()}` : `${target.value} Visits`}
                              </h5>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setIsEditingTarget(true); setEditingTarget(target); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteTarget(target.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Achieved: <span className="text-slate-700">{target.type === 'Sales' ? `৳${achievement.toLocaleString()}` : `${achievement}`}</span></span>
                            <span className={percentage >= 100 ? 'text-emerald-600' : 'text-indigo-600'}>{percentage}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${percentage >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-indigo-500'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No targets set yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showExpensesModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-rose-600 text-white flex justify-between items-center shrink-0">
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-tight">{t('expenses')}</h3>
                <p className="text-[8px] text-rose-200 font-bold uppercase tracking-widest">Expense Tracking</p>
              </div>
              <button onClick={() => setShowExpensesModal(false)} className="transition-all active:scale-90 p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {/* Add Expense Form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-left">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('addExpense')}</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('expenseCategory')}</label>
                    <select 
                      value={tempExpense.category || ''} 
                      onChange={(e) => setTempExpense(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    >
                      <option value="">Select</option>
                      <option value="Fuel">{t('fuel')}</option>
                      <option value="Food">{t('food')}</option>
                      <option value="Maintenance">{t('maintenance')}</option>
                      <option value="Others">{t('others')}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('expenseAmount')}</label>
                    <input 
                      type="number" 
                      placeholder="৳0"
                      value={tempExpense.amount || ''} 
                      onChange={(e) => setTempExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('expenseDescription')}</label>
                  <input 
                    type="text" 
                    placeholder="Note..."
                    value={tempExpense.description || ''} 
                    onChange={(e) => setTempExpense(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={addExpense}
                  className="w-full bg-rose-600 text-white font-black py-2.5 rounded-xl shadow-md shadow-rose-100 active:scale-[0.98] transition-all text-[9px] uppercase tracking-widest"
                >
                  {t('addExpense')}
                </button>
              </div>

              {/* Expense List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('totalExpenses')}</h4>
                  <span className="text-xs font-black text-rose-600">৳{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                </div>

                {expenses.length > 0 ? (
                  <div className="space-y-2">
                    {expenses.slice().reverse().map(expense => (
                      <div key={expense.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm text-left group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{t(expense.category.toLowerCase()) || expense.category}</p>
                            <p className="text-[8px] text-slate-400 font-bold">{expense.date} • {expense.description || 'No note'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-700">৳{expense.amount.toLocaleString()}</span>
                          <button onClick={() => deleteExpense(expense.id)} className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">No expenses recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditingTarget && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-center overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-auto">
            <div className="px-5 py-4 bg-indigo-700 text-white flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-tight">{editingTarget?.id ? 'Edit Target' : 'Add New Target'}</h3>
                <p className="text-[8px] text-indigo-200 font-bold uppercase tracking-widest">Set your goals</p>
              </div>
              <button onClick={() => { setIsEditingTarget(false); setEditingTarget(null); }} className="transition-all active:scale-90 p-1.5 hover:bg-white/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={saveTarget} className="p-5 space-y-4 text-left">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Sales', 'Visits'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditingTarget(prev => ({ ...prev, type: type as any }))}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${editingTarget?.type === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Period</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Daily', 'Monthly'].map(period => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setEditingTarget(prev => ({ ...prev, period: period as any }))}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${editingTarget?.period === period ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Value</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                    placeholder={editingTarget?.type === 'Sales' ? 'Enter amount in ৳' : 'Enter number of visits'}
                    value={editingTarget?.value || ''}
                    onChange={e => setEditingTarget(prev => ({ ...prev, value: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-[10px]">Save Target</button>
                <button type="button" onClick={() => { setIsEditingTarget(false); setEditingTarget(null); }} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-[10px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingPlace && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm p-3 flex justify-center overflow-y-auto items-start md:items-center">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scaleUp my-2 md:my-4">
            <div className="p-4 bg-sky-700 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider">{editingPlace?.id ? t('editPlace') : t('addPlace')}</h3>
              <button onClick={() => setIsEditingPlace(false)} className="transition-all active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); savePlace(editingPlace!); }} className="p-4 space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t('placeName')}</label>
                <input required type="text" className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" value={editingPlace?.name || ''} onFocus={handleInputFocus} onChange={e => setEditingPlace(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Description</label>
                <textarea className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none resize-none h-20" value={editingPlace?.description || ''} onFocus={handleInputFocus} onChange={e => setEditingPlace(prev => ({ ...prev, description: e.target.value }))} placeholder="Optional details about this place..." />
              </div>
              <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-sky-900 uppercase">{t('map')} Location</label>
                  <button type="button" onClick={async () => {
                    try {
                      const position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
                      setEditingPlace(prev => ({ ...prev, location: { lat: position.coords.latitude, lng: position.coords.longitude } }));
                    } catch (err) {
                      setAlertInfo({
                        show: true,
                        title: lang === 'en' ? "GPS Error" : "জিপিএস ত্রুটি",
                        message: lang === 'en' ? "Error getting location. Please ensure GPS is on." : "অবস্থান পেতে ত্রুটি। অনুগ্রহ করে জিপিএস চালু আছে কিনা নিশ্চিত করুন।",
                        type: 'error'
                      });
                    }
                  }} className="bg-sky-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {t('useCurrentLocation')}
                  </button>
                </div>
                {editingPlace?.location && <p className="text-[9px] text-sky-400 font-mono mb-1.5">Lat: {editingPlace.location.lat.toFixed(6)}, Lng: {editingPlace.location.lng.toFixed(6)}</p>}
                <div className="h-48 rounded-lg overflow-hidden border border-sky-100">
                  <LocationPickerMap initialLocation={editingPlace?.location || { lat: 23.8103, lng: 90.4125 }} onChange={(newLoc) => setEditingPlace(prev => ({ ...prev, location: { lat: Number(newLoc.lat), lng: Number(newLoc.lng) } }))} />
                </div>
              </div>
              <div className="pt-1 flex gap-2">
                <button type="submit" className="flex-1 bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 hover:bg-sky-700">{t('save')}</button>
                <button type="button" onClick={() => setIsEditingPlace(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 hover:bg-slate-200">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingProfile && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl animate-slideUp sm:animate-scaleUp overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="flex justify-between items-center mb-6">
              <div className="text-left">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('editProfile')}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Update your personal information</p>
              </div>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setUserProfile(tempProfile); setIsEditingProfile(false); }} className="space-y-5">
              <div className="flex flex-col items-center gap-4 mb-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-indigo-400 transition-colors">
                    {tempProfile.photo ? (
                      <img src={tempProfile.photo} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-indigo-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => userPhotoRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200 border-2 border-white active:scale-90 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={userPhotoRef} onChange={handleUserProfilePhotoUpload} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tap camera to change photo</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('userName')}</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all"
                    placeholder="Enter your full name"
                    value={tempProfile.name || ''}
                    onChange={e => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('employeeId')}</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all"
                      placeholder="EMP-001"
                      value={tempProfile.employeeId || ''}
                      onChange={e => setTempProfile(prev => ({ ...prev, employeeId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('designation')}</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all"
                      placeholder="Sales Officer"
                      value={tempProfile.designation || ''}
                      onChange={e => setTempProfile(prev => ({ ...prev, designation: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phoneNumber')}</label>
                  <input
                    required
                    type="tel"
                    className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all"
                    placeholder="01XXX-XXXXXX"
                    value={tempProfile.phone || ''}
                    onChange={e => setTempProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-[10px]">{t('save')}</button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-[10px]">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isInRideMode && !viewingRoute && !showCatalog && !viewingProduct && !showOrderSystem && !showDealersList && !showAnalytics && !showSmartRoute && <Navbar view={view} setView={setView} t={t} />}

      {viewingFullPhoto && (
        <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn" onClick={() => setViewingFullPhoto(null)}>
          <button onClick={() => setViewingFullPhoto(null)} className="absolute top-6 right-6 z-[6001] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
          <img src={viewingFullPhoto} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleUp" alt="Full view" />
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-subtle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.01); } }
        @keyframes ping-slow { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-scaleUp { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-subtle { animation: pulse-subtle 3s infinite ease-in-out; }
        .animate-ping-slow { animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
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