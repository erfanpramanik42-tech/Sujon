
import React from 'react';
import { Shop, Area } from '../types';

interface DashboardViewProps {
  lang: 'en' | 'bn';
  todayShopsCount: number;
  visitedTodayCount: number;
  atShop: Shop | null;
  detectionRange: number;
  setDetectionRange: (val: number) => void;
  setViewingShop: (shop: Shop) => void;
  isVisitedToday: (id: string) => boolean;
  activeAreas: Area[];
  currentDayName: string;
  dashboardAreas: Area[];
  setSelectedAreaId: (id: string) => void;
  setView: (view: any) => void;
  nearbyShops: Shop[];
  nearbyRange: number;
  setNearbyRange: (val: number) => void;
  getSpecialDayShops: () => Shop[];
  t: (key: string) => string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  todayShopsCount,
  visitedTodayCount,
  atShop,
  detectionRange,
  setDetectionRange,
  setViewingShop,
  isVisitedToday,
  activeAreas,
  currentDayName,
  dashboardAreas,
  setSelectedAreaId,
  setView,
  nearbyShops,
  nearbyRange,
  setNearbyRange,
  getSpecialDayShops,
  t
}) => {
  return (
    <div className="space-y-4 animate-fadeIn flex-1 overflow-y-auto pb-4 scrollbar-hide">
      <div className="grid grid-cols-2 gap-3 flex-shrink-0">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-tight">{lang === 'en' ? "Today's Shops" : "আজকের মোট দোকান"}</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{todayShopsCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-tight">{lang === 'en' ? "Visited Today" : "আজকের ভিজিট"}</p>
          <p className="text-2xl font-black text-rose-500 dark:text-rose-400">{visitedTodayCount}</p>
        </div>
      </div>

      <div className="space-y-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm"></span></span>
            <span>{lang === 'en' ? 'Current Spot' : 'বর্তমান অবস্থান'}</span>
          </h4>
          <div className="flex items-center gap-2 bg-indigo-50/80 dark:bg-indigo-900/30 px-2 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm">
            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter w-10">{detectionRange}m Range</span>
            <input type="range" min="1" max="50" value={detectionRange} onChange={(e) => setDetectionRange(Number(e.target.value))} className="w-12 h-1 bg-indigo-200 dark:bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
        </div>
        
        {atShop ? (
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-900/20 dark:via-slate-800 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 shadow-sm flex gap-4 cursor-pointer relative overflow-hidden group" onClick={() => setViewingShop(atShop)}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-emerald-500/20 transition-colors"></div>
            <div className="absolute top-2 right-2 z-20">
              <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                LIVE
              </span>
            </div>
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-700 flex-shrink-0 overflow-hidden border border-emerald-100 dark:border-emerald-900 shadow-md relative z-10 transform group-hover:scale-105 transition-transform duration-500">
                {atShop.photo ? <img src={atShop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-emerald-300 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/30"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg></div>}
              </div>
            </div>
            <div className="flex-1 min-w-0 relative z-10 py-1">
              <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
                {lang === 'en' ? `Detected:` : `শনাক্ত:`}
              </p>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors duration-300">{atShop.name}</h2>
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {Math.round((atShop as any).distance)}m
                </span>
                {isVisitedToday(atShop.id) && <span className="bg-emerald-500 text-white rounded-full p-1 shadow-sm border border-white/40"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{atShop.ownerName}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-200 dark:border-emerald-800">{activeAreas.find(a => a.id === atShop.areaId)?.name}</span>
                  {atShop.subArea && <span className="bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-100 dark:border-emerald-800">{atShop.subArea}</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/30 dark:via-indigo-900/10 to-transparent animate-shimmer"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-slate-400 dark:border-slate-600 rounded-full animate-ping-slow"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-slate-400 dark:border-slate-600 rounded-full animate-ping-slow delay-700"></div>
            </div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <svg className="w-8 h-8 text-slate-300 dark:text-slate-700 animate-spin-slow relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse border-2 border-white dark:border-slate-800 shadow-sm"></span>
              </div>
              {lang === 'en' ? `Scanning...` : `খোঁজা হচ্ছে...`}
            </div>
          </div>
        )}
      </div>

      <div className="bg-indigo-600 dark:bg-indigo-900 rounded-lg p-2 text-white relative overflow-hidden shadow-lg flex-shrink-0">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[9px] font-black uppercase tracking-tight opacity-70">Field Areas ({currentDayName})</h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {dashboardAreas.length > 0 ? dashboardAreas.map(area => (
              <button key={area.id} onClick={() => { setSelectedAreaId(area.id); setView('Shops'); }} className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-medium border border-white/10 text-left outline-none">{area.name}</button>
            )) : <p className="text-[8px] font-bold text-white/50 italic">No areas assigned for {currentDayName}</p>}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-6 translate-x-6 blur-lg"></div>
      </div>

      <div className="space-y-2 flex-1 min-h-0 flex flex-col">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><span>{t('nearbyShops')}</span>{nearbyShops.length > 0 && <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[9px] px-1.5 py-0.5 rounded-full font-black">{nearbyShops.length}</span>}</h4>
          <div className="flex items-center gap-1.5 bg-indigo-50/80 dark:bg-indigo-900/30 px-2 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm"><span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter w-12">{nearbyRange}m Range</span><input type="range" min="10" max="500" step="10" value={nearbyRange} onChange={(e) => setNearbyRange(Number(e.target.value))} className="w-16 h-1 bg-indigo-200 dark:bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="max-h-[320px] overflow-y-auto p-2 space-y-2 scrollbar-hide">
            {nearbyShops.length > 0 ? nearbyShops.map(shop => (
              <div key={shop.id} className="p-2 rounded-lg flex items-center gap-2 border border-slate-50 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 bg-slate-50/30 dark:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setViewingShop(shop)}>
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative">
                  {shop.photo ? <img src={shop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg></div>}
                  {isVisitedToday(shop.id) && <div className="absolute top-0.5 right-0.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm border border-white/20"><svg className="w-1.5 h-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight flex items-center gap-1">{shop.name}</p>
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1 py-0.5 rounded-md flex-shrink-0">
                      {Math.round((shop as any).distance) < 5 ? '0' : Math.round((shop as any).distance)}m
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">{shop.ownerName}</p>
                    <div className="flex gap-1 items-center overflow-hidden">
                      <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded uppercase flex-shrink-0">{activeAreas.find(a => a.id === shop.areaId)?.name}</span>
                      {shop.subArea && <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-1 py-0.5 rounded uppercase truncate">{shop.subArea}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )) : <div className="py-8 text-center"><p className="text-xs font-bold text-slate-400 dark:text-slate-500 italic">No shops within {nearbyRange}m.</p></div>}
          </div>
        </div>
      </div>

      {getSpecialDayShops().length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 shadow-sm relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm border border-amber-200 dark:border-amber-800">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" /><path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <h5 className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">{t('celebratingToday')}</h5>
              <p className="text-[8px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-tighter">Send your best wishes!</p>
            </div>
          </div>
          <div className="space-y-2">
            {getSpecialDayShops().map(shop => {
              const today = new Date();
              const isBirthday = shop.birthday && new Date(shop.birthday).getMonth() === today.getMonth() && new Date(shop.birthday).getDate() === today.getDate();
              
              return (
                <div key={shop.id} className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-center justify-between shadow-sm group cursor-pointer active:scale-[0.98] transition-all" onClick={() => setViewingShop(shop)}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600">
                      {shop.photo ? <img src={shop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg></div>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate leading-tight">{shop.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/20">{isBirthday ? t('birthday') : t('anniversary')}</span>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate">{shop.ownerName}</span>
                      </div>
                    </div>
                  </div>
                  <a href={`tel:${shop.phone}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 dark:shadow-none active:scale-90 transition-all">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
