import React from 'react';
import { GeoLocation } from '../types';

interface HeaderProps {
  title: string;
  location: GeoLocation | null;
  lang: 'en' | 'bn';
  onLangToggle: () => void;
  isTracking: boolean;
  onTrackingToggle: () => void;
  onKebabToggle: () => void;
  showKebab: boolean;
  t: (key: string) => string;
  onRefreshLocation: () => void;
  lastUpdated: number;
}

export const Header = ({ 
  title, 
  location, 
  lang, 
  onLangToggle, 
  isTracking, 
  onTrackingToggle, 
  onKebabToggle, 
  showKebab, 
  t, 
  onRefreshLocation, 
  lastUpdated 
}: HeaderProps) => (
  <header className="sticky top-0 z-50 bg-indigo-700 dark:bg-indigo-900 text-white p-3 sm:p-4 shadow-lg transition-colors">
    <div className="flex justify-between items-center max-w-4xl mx-auto gap-2">
      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{title}</h1>
        {location && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <p className="text-[8px] sm:text-[10px] text-indigo-200 font-mono">
                GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
              <button 
                onClick={onRefreshLocation}
                className="p-1 hover:bg-white/10 rounded-full transition-all active:rotate-180 duration-500"
                title="Refresh Location"
              >
                <svg className="w-2.5 h-2.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {location.accuracy && (
                <p className={`text-[7px] font-black uppercase tracking-tighter ${location.accuracy < 15 ? 'text-emerald-400' : location.accuracy < 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                  ±{Math.round(location.accuracy)}m
                </p>
              )}
              {lastUpdated > 0 && (
                <p className="text-[7px] font-bold text-indigo-300 uppercase tracking-tighter">
                  Updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button 
          onClick={onLangToggle}
          className="text-[10px] sm:text-xs bg-indigo-600 px-2 sm:px-3 py-1 rounded-full border border-indigo-400 font-bold whitespace-nowrap"
        >
          {lang === 'en' ? 'বাংলা' : 'EN'}
        </button>
        <button 
          onClick={onTrackingToggle}
          className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all shadow-md whitespace-nowrap ${isTracking ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
        >
          {isTracking ? t('trackingOn') : t('trackingOff')}
        </button>
        {showKebab && (
          <button 
            onClick={onKebabToggle}
            className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition-all active:scale-95"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
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
