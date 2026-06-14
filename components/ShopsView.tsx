
import React from 'react';
import { Shop, Area } from '../types';
import { MapPin, Plus, Pencil } from 'lucide-react';

interface ShopsViewProps {
  t: (key: string) => string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setIsManagingAreas: (val: boolean) => void;
  initAddShop: () => void;
  selectedAreaId: string;
  setSelectedAreaId: (val: string) => void;
  activeAreas: Area[];
  filteredShopsList: Shop[];
  setViewingShop: (shop: Shop) => void;
  isVisitedToday: (id: string) => boolean;
  startNavigation: (shop: Shop) => void;
  setOrderShop: (shop: Shop) => void;
  setOrderTab: (tab: 'taking' | 'history') => void;
  setShowOrderSystem: (val: boolean) => void;
  setEditingShop: (shop: Shop) => void;
  setIsEditingShop: (val: boolean) => void;
  currentLocation: { lat: number, lng: number } | null;
  calculateDistance: (loc1: { lat: number, lng: number }, loc2: { lat: number, lng: number }) => number;
}

export const ShopsView: React.FC<ShopsViewProps> = ({
  t,
  searchQuery,
  setSearchQuery,
  setIsManagingAreas,
  initAddShop,
  selectedAreaId,
  setSelectedAreaId,
  activeAreas,
  filteredShopsList,
  setViewingShop,
  isVisitedToday,
  startNavigation,
  setOrderShop,
  setOrderTab,
  setShowOrderSystem,
  setEditingShop,
  setIsEditingShop,
  currentLocation,
  calculateDistance
}) => {
  return (
    <div className="flex flex-col h-full gap-3 animate-fadeIn">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder={t('search')} 
            className="w-full bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setIsManagingAreas(true)} className="bg-white text-indigo-600 p-2.5 rounded-xl shadow-sm border border-indigo-100 transition-all active:scale-95 hover:bg-indigo-50">
            <MapPin className="w-5 h-5" />
          </button>
          <button onClick={initAddShop} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg transition-all active:scale-95 hover:bg-indigo-700">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setSelectedAreaId('all')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${selectedAreaId === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>All Areas</button>
        {activeAreas.map(area => (
          <button key={area.id} onClick={() => setSelectedAreaId(area.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${selectedAreaId === area.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>{area.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pb-24 scrollbar-hide">
        {filteredShopsList.length > 0 ? filteredShopsList.map(shop => (
          <div key={shop.id} onClick={() => setViewingShop(shop)} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex gap-3 transition-all hover:shadow-md group cursor-pointer relative">
            <div className="w-16 h-16 rounded-xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 relative">
              {shop.photo ? <img src={shop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg></div>}
              {isVisitedToday(shop.id) && <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center"><div className="bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border-2 border-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div></div>}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <h5 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">{shop.name}</h5>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <p className="text-[10px] font-medium text-slate-500">{shop.ownerName}</p>
                <div className="flex gap-1 flex-wrap">
                  <span className="text-[7px] font-black text-indigo-400 bg-indigo-50 px-1 py-0.5 rounded uppercase">{activeAreas.find(a => a.id === shop.areaId)?.name}</span>
                  {shop.subArea && <span className="text-[7px] font-black text-slate-400 bg-slate-100 px-1 py-0.5 rounded uppercase">{shop.subArea}</span>}
                </div>
              </div>
              <div className="flex gap-1.5 mt-2">
                <button onClick={(e) => { e.stopPropagation(); startNavigation(shop); }} className="flex-1 bg-indigo-50 text-indigo-600 text-[9px] font-black py-1.5 rounded-lg uppercase tracking-wider">Navigate</button>
                <button onClick={(e) => { e.stopPropagation(); setOrderShop(shop); setOrderTab('history'); setShowOrderSystem(true); }} className="px-3 bg-slate-50 text-slate-400 py-1.5 rounded-lg">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditingShop(shop); setIsEditingShop(true); }} className="px-3 bg-indigo-50 text-indigo-600 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between py-1">
              {isVisitedToday(shop.id) ? (
                <div className="text-emerald-500 font-black text-[8px] uppercase tracking-widest flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-full">{t('visited')}</div>
              ) : (
                <div className="h-4"></div>
              )}
              {currentLocation && (
                <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shadow-sm flex flex-col items-center">
                  <span>{shop.distance !== undefined ? Math.round(shop.distance) : Math.round(calculateDistance(currentLocation, shop.location))}m</span>
                  {shop.distance !== undefined && shop.birdDistance !== undefined && Math.abs(shop.distance - shop.birdDistance) > 50 && (
                     <span className="text-[6px] opacity-60 font-medium leading-none mt-0.5 whitespace-nowrap uppercase tracking-tighter">via road</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )) : <div className="col-span-full py-16 text-center"><p className="text-slate-400 font-bold text-sm">{t('noShops')}</p></div>}
      </div>
    </div>
  );
};
