import React, { useEffect, useRef, useState } from 'react';
import { Shop, GeoLocation, SalesRoute, Area } from '../types';
import { calculateDistance } from '../services/locationService';

interface NavStep {
  instruction: string;
  modifier: string;
  distance: number;
  location: [number, number];
}

interface MapComponentProps {
  currentLocation: GeoLocation | null;
  shops: Shop[];
  areas: Area[];
  activeRoute?: SalesRoute | null;
  navigationTarget?: Shop | null;
  onShopClick?: (shop: Shop) => void;
  onStopNavigation?: () => void;
  t: (key: string) => string;
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  currentLocation, 
  shops, 
  areas,
  activeRoute, 
  navigationTarget,
  onShopClick,
  onStopNavigation,
  t
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const stopMarkersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);
  const roadNavLineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const layersRef = useRef<{ street: any; satellite: any }>({ street: null, satellite: null });
  
  const [isFollowing, setIsFollowing] = useState(true);
  const [isHeadingUp, setIsHeadingUp] = useState(false);
  const [heading, setHeading] = useState(0);
  const [navSteps, setNavSteps] = useState<NavStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  // Internal Logic: Sticky Zoom Control
  const lastFitTargetId = useRef<string | null>(null);

  // Capsule Drag Logic
  const [capsuleOffset, setCapsuleOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
    // Fix: Correct logic for capturing the start point relative to current offset
    dragStart.current = { x: clientX - capsuleOffset.x, y: clientY - capsuleOffset.y };
    e.stopPropagation();
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as MouseEvent).clientY;
    setCapsuleOffset({ x: clientX - dragStart.current.x, y: clientY - dragStart.current.y });
  };

  const handleDragEnd = () => { isDragging.current = false; };

  useEffect(() => {
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, []);

  const toggleFollow = () => {
    setIsFollowing(prev => !prev);
    if (!isFollowing && currentLocation && leafletMap.current) {
      leafletMap.current.panTo([currentLocation.lat, currentLocation.lng], { 
        animate: true, 
        duration: 0.8,
        easeLinearity: 0.25
      });
    }
  };

  const toggleHeadingUp = () => {
    if (isHeadingUp) { 
      setIsHeadingUp(false); 
      if (leafletMap.current) leafletMap.current.setBearing(0);
      setHeading(0); 
      return; 
    }
    
    const requestPermission = (DeviceOrientationEvent as any).requestPermission;
    if (typeof requestPermission === 'function') {
      requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            setIsHeadingUp(true);
          }
        })
        .catch(console.error);
    } else {
      setIsHeadingUp(true);
    }
  };

  const toggleMapType = () => {
    const nextType = mapType === 'street' ? 'satellite' : 'street';
    setMapType(nextType);
    if (leafletMap.current && layersRef.current) {
      if (nextType === 'satellite') {
        layersRef.current.street.remove();
        layersRef.current.satellite.addTo(leafletMap.current);
      } else {
        layersRef.current.satellite.remove();
        layersRef.current.street.addTo(leafletMap.current);
      }
    }
  };

  useEffect(() => {
    const smoothingAlpha = 0.25; 
    let currentFilteredHeading = heading;

    if (currentLocation?.speed && currentLocation.speed > 1 && currentLocation.heading !== null && currentLocation.heading !== undefined) {
       setHeading(currentLocation.heading);
       return;
    }

    if (!isHeadingUp) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let rawHeading = 0;
      if ((e as any).webkitCompassHeading !== undefined) {
        rawHeading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        rawHeading = 360 - e.alpha;
      } else {
        return;
      }

      let diff = rawHeading - currentFilteredHeading;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      currentFilteredHeading = currentFilteredHeading + diff * smoothingAlpha;
      if (currentFilteredHeading < 0) currentFilteredHeading += 360;
      if (currentFilteredHeading >= 360) currentFilteredHeading -= 360;

      setHeading(currentFilteredHeading);
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    };
  }, [isHeadingUp, currentLocation?.speed, currentLocation?.heading]);

  useEffect(() => {
    if (!mapRef.current) return;
    // @ts-ignore
    const L = window.L;
    if (!L) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        rotate: true, 
        touchRotate: true,
        zoomSnap: 0, 
        zoomDelta: 0.25, 
        wheelPxPerZoomLevel: 60,
        maxZoom: 20 
      }).setView([23.8103, 90.4125], 13);

      layersRef.current.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(leafletMap.current);
      layersRef.current.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20 });
      
      // Algorithm Fix: Disable auto-centering when user interacts with the map
      leafletMap.current.on('dragstart', () => setIsFollowing(false));
      leafletMap.current.on('zoomstart', () => setIsFollowing(false));

      let initialAngle = 0;
      let initialBearing = 0;
      const container = leafletMap.current.getContainer();

      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          initialAngle = Math.atan2(e.touches[1].pageY - e.touches[0].pageY, e.touches[1].pageX - e.touches[0].pageX) * 180 / Math.PI;
          initialBearing = leafletMap.current.getBearing();
          setIsHeadingUp(false);
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          const currentAngle = Math.atan2(e.touches[1].pageY - e.touches[0].pageY, e.touches[1].pageX - e.touches[0].pageX) * 180 / Math.PI;
          const delta = currentAngle - initialAngle;
          leafletMap.current.setBearing(initialBearing + delta);
        }
      };

      container.addEventListener('touchstart', onTouchStart, { passive: false });
      container.addEventListener('touchmove', onTouchMove, { passive: false });
      
      setTimeout(() => {
        if (leafletMap.current) leafletMap.current.invalidateSize();
      }, 500);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (leafletMap.current && activeRoute) {
      setTimeout(() => {
        leafletMap.current.invalidateSize();
      }, 300);
    }
  }, [activeRoute?.id]);

  useEffect(() => {
    if (!leafletMap.current) return;
    // @ts-ignore
    const L = window.L;
    
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const isHistoryView = !!activeRoute?.endTime;
    if (isHistoryView) return;

    shops.forEach(shop => {
      const area = areas.find(a => a.id === shop.areaId);
      const marker = L.circleMarker([shop.location.lat, shop.location.lng], {
        radius: 6,
        fillColor: '#4f46e5',
        color: '#fff',
        weight: 1.5,
        fillOpacity: 1
      }).addTo(leafletMap.current);
      
      marker.bindTooltip(`
        <div class="shop-marker-label">
          <p class="shop-name">${shop.name}</p>
          <p class="shop-area">${area?.name || 'Area'}</p>
        </div>
      `, {
        permanent: true,
        direction: 'top',
        offset: [0, -5],
        className: 'custom-tooltip'
      }).openTooltip();
      
      marker.on('click', () => onShopClick?.(shop));
      markersRef.current.push(marker);
    });
  }, [shops, areas, onShopClick, activeRoute?.id, !!activeRoute?.endTime]);

  useEffect(() => {
    if (!leafletMap.current || !currentLocation) return;
    // @ts-ignore
    const L = window.L;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], {
        zIndexOffset: 3000,
        icon: L.divIcon({
          className: 'user-dot-marker',
          html: `<div class="user-dot-container active-ping"><div class="user-dot"></div><div class="user-arrow"></div></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(leafletMap.current);
    } else {
      userMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
    }

    const markerElement = userMarkerRef.current.getElement();
    if (markerElement) {
      const container = markerElement.querySelector('.user-dot-container');
      if (container) {
        if (isHeadingUp) {
          leafletMap.current.setBearing(heading);
          container.style.transform = `rotate(0deg)`;
        } else {
          container.style.transform = `rotate(${heading}deg)`;
        }
      }
    }

    // Algorithm Change: Respect manual interaction. Snap to center only if isFollowing is true.
    if (isFollowing) {
      leafletMap.current.panTo([currentLocation.lat, currentLocation.lng], { 
        animate: true, 
        duration: 1.0, 
        easeLinearity: 0.1 
      });
    }
  }, [currentLocation, isFollowing, heading, isHeadingUp]);

  useEffect(() => {
    if (!leafletMap.current || !activeRoute) {
      if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }
      stopMarkersRef.current.forEach(m => m.remove());
      stopMarkersRef.current = [];
      return;
    }
    // @ts-ignore
    const L = window.L;

    const isHistoryView = !!activeRoute.endTime;

    if (routeLineRef.current) routeLineRef.current.remove();
    routeLineRef.current = L.polyline(activeRoute.path.map(p => [p.lat, p.lng]), {
      color: isHistoryView ? '#1a73e8' : '#ef4444', 
      weight: isHistoryView ? 6 : 4,
      opacity: isHistoryView ? 0.9 : 0.6,
      lineJoin: 'round',
      lineCap: 'round',
      dashArray: isHistoryView ? null : '10, 10'
    }).addTo(leafletMap.current);

    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = (activeRoute.stops || []).map((stop, idx) => {
      const isEndpoint = idx === 0 || idx === activeRoute.stops.length - 1;
      
      const marker = L.circleMarker([stop.location.lat, stop.location.lng], {
        radius: isEndpoint ? 7 : 5,
        fillColor: '#ffffff',
        color: isHistoryView ? '#1a73e8' : '#ef4444',
        weight: 3,
        fillOpacity: 1
      }).addTo(leafletMap.current);

      if (isHistoryView) {
        marker.bindTooltip(`
          <div class="timeline-label-minimal">
            <span class="place-name">${stop.areaName}</span>
          </div>
        `, { 
          permanent: true, 
          direction: 'top', 
          offset: [0, -10],
          className: 'timeline-tooltip-clean'
        });
      }

      return marker;
    });

    if (isHistoryView && routeLineRef.current.getLatLngs().length > 0) {
      setIsFollowing(false);
      leafletMap.current.invalidateSize();
      leafletMap.current.fitBounds(routeLineRef.current.getBounds(), { 
        padding: [80, 80],
        animate: true,
        duration: 1.5 
      });
    }
  }, [activeRoute?.id, !!activeRoute?.endTime]);

  useEffect(() => {
    const controller = new AbortController();
    
    if (!leafletMap.current || !currentLocation || !navigationTarget) {
      if (roadNavLineRef.current) { roadNavLineRef.current.remove(); roadNavLineRef.current = null; }
      setNavSteps([]);
      lastFitTargetId.current = null; 
      return;
    }

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${currentLocation.lng},${currentLocation.lat};${navigationTarget.location.lng},${navigationTarget.location.lat}?steps=true&geometries=geojson`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return;

        const data = await response.json();
        if (!leafletMap.current || !navigationTarget) return;

        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
          // @ts-ignore
          const L = window.L;
          if (roadNavLineRef.current) roadNavLineRef.current.remove();
          
          if (leafletMap.current) {
            roadNavLineRef.current = L.polyline(coords, { color: '#4f46e5', weight: 5, opacity: 0.9 }).addTo(leafletMap.current);
            
            if (lastFitTargetId.current !== navigationTarget.id) {
                leafletMap.current.fitBounds(roadNavLineRef.current.getBounds(), { 
                    padding: [50, 50],
                    animate: true,
                    duration: 1.2
                });
                lastFitTargetId.current = navigationTarget.id;
                // Ensure manual interaction takes precedence after initial fit
                setIsFollowing(false);
            }
          }
          
          const steps = route.legs[0].steps.map((s: any) => ({
            instruction: s.maneuver.instruction,
            modifier: s.maneuver.modifier || 'straight',
            distance: s.distance,
            location: [s.maneuver.location[1], s.maneuver.location[0]]
          }));
          setNavSteps(steps);
          setCurrentStepIndex(0);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Routing fetch error:', err);
        }
      }
    };
    fetchRoute();

    return () => controller.abort();
  }, [navigationTarget, currentLocation?.lat, currentLocation?.lng]);

  const getDirectionAlphabet = (modifier: string) => {
    if (!modifier) return 'S';
    switch (modifier.toLowerCase()) {
      case 'left': case 'sharp left': return 'L';
      case 'slight left': return 'SL';
      case 'right': case 'sharp right': return 'R';
      case 'slight right': return 'SR';
      case 'uturn': return 'UT';
      default: return 'S';
    }
  };

  const getDirectionIcon = (modifier: string) => {
    const base = "w-5 h-5 text-white";
    switch (modifier?.toLowerCase()) {
      case 'left': case 'sharp left':
        return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7M20 12H4" /></svg>;
      case 'slight left':
        return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7 7-7" transform="rotate(45, 12, 12)" /></svg>;
      case 'right': case 'sharp right':
        return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M4 12h16" /></svg>;
      case 'slight right':
        return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7-7 7" transform="rotate(-45, 12, 12)" /></svg>;
      case 'uturn':
        return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v10a4 4 0 004 4h8a4 4 0 004 4h8a4 4 0 004-4V4M4 4l3 3M4 4L1 7" /></svg>;
      default:
        return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7 7 7M12 3v18" /></svg>;
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden flex-1">
      <div ref={mapRef} className="absolute inset-0 z-0 w-full h-full" />
      {navigationTarget && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[85%] max-w-sm pointer-events-auto" style={{ transform: `translate(calc(-50% + ${capsuleOffset.x}px), ${capsuleOffset.y}px)` }} onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
          <div className="bg-slate-900/85 backdrop-blur-md text-white rounded-2xl p-2.5 shadow-2xl border border-white/10 flex items-center gap-3 animate-fadeIn select-none">
            <div className="bg-indigo-600/90 w-12 h-12 rounded-xl shrink-0 flex flex-col items-center justify-center shadow-inner border border-white/10">
               <span className="text-[14px] font-black leading-none mb-0.5">{getDirectionAlphabet(navSteps.length > 0 ? navSteps[currentStepIndex].modifier : 'straight')}</span>
               {getDirectionIcon(navSteps.length > 0 ? navSteps[currentStepIndex].modifier : 'straight')}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 truncate mb-0.5">To: {navigationTarget.name}</p>
               <h3 className="text-[12px] font-bold leading-tight truncate">{navSteps.length > 0 ? navSteps[currentStepIndex].instruction : 'Calculating...'}</h3>
               {navSteps.length > 0 && <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] font-black text-white/70">{Math.round(navSteps[currentStepIndex].distance)}m</span><div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-indigo-50 w-1/4"></div></div></div>}
            </div>
            <button onClick={onStopNavigation} className="p-1.5 hover:bg-white/10 rounded-lg shrink-0 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
      )}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
        <button onClick={toggleMapType} className={`p-2.5 rounded-xl shadow-xl border border-white/20 backdrop-blur-md transition-all active:scale-95 ${mapType === 'satellite' ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-700'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
        <button onClick={toggleFollow} className={`p-2.5 rounded-xl shadow-xl border border-white/20 backdrop-blur-md transition-all active:scale-95 ${isFollowing ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-700'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={toggleHeadingUp} className={`p-2.5 rounded-xl shadow-xl border border-white/20 backdrop-blur-md transition-all active:scale-95 ${isHeadingUp ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-700'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: `rotate(${isHeadingUp ? -heading : 0}deg)` }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
      </div>
      <style>{`
        .leaflet-container { background: #f8fafc; height: 100%; width: 100%; }
        .user-dot-marker { z-index: 2000 !important; }
        .user-dot-container { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transition: transform 0.1s linear; }
        .user-dot { width: 14px; height: 14px; background: #4f46e5; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(79, 70, 229, 0.4); z-index: 2; }
        .user-arrow { position: absolute; top: -4px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 8px solid #4f46e5; z-index: 1; }
        .custom-tooltip { background: rgba(15, 23, 42, 0.85) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 6px !important; padding: 3px 6px !important; box-shadow: 0 4px 10px rgba(0,0,0,0.2) !important; }
        .shop-marker-label { text-align: center; line-height: 1; }
        .shop-name { color: white; font-weight: 800; font-size: 10px; margin-bottom: 1px; }
        .shop-area { color: #94a3b8; font-weight: 600; font-size: 8px; text-transform: uppercase; }
        .timeline-label-minimal { display: flex; flex-direction: column; align-items: center; }
        .place-name { color: white; font-weight: 700; font-size: 11px; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
        .timeline-tooltip-clean { 
          background: rgba(15, 23, 42, 0.8) !important; 
          border: none !important; 
          border-radius: 4px !important; 
          padding: 2px 6px !important; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important; 
          opacity: 0.9 !important;
        }
        .timeline-tooltip-clean:before { display: none; }
        .active-ping::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: rgba(79, 70, 229, 0.4);
          border-radius: 50%;
          animation: ping-user 1.5s infinite ease-out;
          z-index: 0;
        }
        @keyframes ping-user {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
};