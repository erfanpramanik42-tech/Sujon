import React, { useState, useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { GeoLocation } from '../types';

// --- Sub-Component: Location Picker Map ---
export const LocationPickerMap = ({ 
  initialLocation, 
  onChange 
}: { 
  initialLocation: GeoLocation, 
  onChange: (loc: GeoLocation) => void 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const layersRef = useRef<{ street: any; satellite: any; google: any; hybrid: any }>({ street: null, satellite: null, google: null, hybrid: null });
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'google' | 'hybrid'>('google');

  useEffect(() => {
    if (!containerRef.current) return;
    // @ts-ignore
    
    if (!L) return;

    mapInstance.current = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      rotate: true,
      touchRotate: true
    }).setView([initialLocation.lat, initialLocation.lng], 16);

    layersRef.current.street = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    });
    layersRef.current.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20
    });
    layersRef.current.google = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(mapInstance.current);
    layersRef.current.hybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    });

    markerInstance.current = L.marker([initialLocation.lat, initialLocation.lng], {
      draggable: true,
      icon: L.divIcon({
        className: 'custom-pin',
        html: `<div class="pin-container">
          <div class="pin-head"></div>
          <div class="pin-shadow"></div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
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
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const toggleMapType = () => {
    const types: ('google' | 'hybrid' | 'street' | 'satellite')[] = ['google', 'hybrid', 'street', 'satellite'];
    const currentIndex = types.indexOf(mapType);
    const nextType = types[(currentIndex + 1) % types.length];
    
    setMapType(nextType);
    if (mapInstance.current && layersRef.current) {
      Object.values(layersRef.current).forEach((layer: any) => layer?.remove());
      if (layersRef.current[nextType]) {
        layersRef.current[nextType].addTo(mapInstance.current);
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
    <div className="relative group h-48 w-full">
      <div ref={containerRef} className="absolute inset-0 rounded-xl border border-slate-200 shadow-inner overflow-hidden z-[1]" />
      <div className="absolute top-2 left-2 z-[1000] flex gap-1">
        <button 
          type="button"
          onClick={toggleMapType}
          className={`px-2 py-1 rounded-md text-[8px] font-black uppercase shadow-sm border transition-colors ${(mapType === 'satellite' || mapType === 'hybrid') ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/90 text-slate-600 border-slate-200'}`}
        >
          {mapType === 'google' ? 'Google' : mapType === 'hybrid' ? 'Hybrid' : mapType === 'street' ? 'OSM' : 'Satellite'}
        </button>
      </div>
      <style>{`
        .custom-pin { pointer-events: auto; }
        .pin-container { position: relative; width: 30px; height: 30px; display: flex; flex-direction: column; align-items: center; }
        .pin-head { width: 14px; height: 14px; background: #ef4444; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .pin-shadow { width: 6px; height: 2px; background: rgba(0,0,0,0.2); border-radius: 50%; margin-top: 2px; }
      `}</style>
    </div>
  );
};

// --- Sub-Component: Stable Mini Map ---
export const MiniMap = ({ location, label }: { location: GeoLocation; label?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const layersRef = useRef<{ street: any; satellite: any }>({ street: null, satellite: null });
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  useEffect(() => {
    if (!containerRef.current) return;
    // @ts-ignore
    
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
    
    const marker = L.marker([location.lat, location.lng], {
      icon: L.divIcon({
        className: 'custom-pin',
        html: `<div class="pin-container">
          <div class="pin-head"></div>
          <div class="pin-point"></div>
        </div>
        <div class="pin-shadow"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        tooltipAnchor: [0, -42]
      })
    }).addTo(mapInstance.current);
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
    <div className="relative h-32 w-full mt-4">
      <div ref={containerRef} className="absolute inset-0 rounded-xl border border-slate-200 shadow-inner z-[1]" />
      <button 
        type="button" 
        onClick={toggleMapType}
        className={`absolute top-2 left-2 z-[1000] px-2 py-1 rounded-md text-[8px] font-black uppercase shadow-sm border transition-colors ${mapType === 'satellite' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/90 text-slate-600 border-slate-200'}`}
      >
        {mapType === 'street' ? 'Satellite' : 'Street'}
      </button>
      <style>{`
        .custom-pin { pointer-events: none; }
        .pin-container { position: relative; width: 30px; height: 30px; display: flex; flex-direction: column; align-items: center; }
        .pin-head { width: 14px; height: 14px; background: #6366f1; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .pin-shadow { width: 6px; height: 2px; background: rgba(0,0,0,0.2); border-radius: 50%; margin-top: 2px; }
      `}</style>
    </div>
  );
};
