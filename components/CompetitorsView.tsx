
import React from 'react';
import { CompetitorTrack } from '../types';
import { Plus } from 'lucide-react';

interface CompetitorsViewProps {
  lang: 'en' | 'bn';
  competitorSearch: string;
  setCompetitorSearch: (val: string) => void;
  setTempCompetitorTrack: (val: Partial<CompetitorTrack>) => void;
  setIsAddingCompetitorTrack: (val: boolean) => void;
  competitorTracks: CompetitorTrack[];
  deleteCompetitorTrack: (id: string) => void;
  t: (key: string) => string;
}

export const CompetitorsView: React.FC<CompetitorsViewProps> = ({
  lang,
  competitorSearch,
  setCompetitorSearch,
  setTempCompetitorTrack,
  setIsAddingCompetitorTrack,
  competitorTracks,
  deleteCompetitorTrack,
  t
}) => {
  const filteredTracks = competitorTracks.filter(track => 
    track.competitorName.toLowerCase().includes(competitorSearch.toLowerCase()) ||
    track.productName.toLowerCase().includes(competitorSearch.toLowerCase()) ||
    track.shopName.toLowerCase().includes(competitorSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-3 animate-fadeIn">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder={lang === 'en' ? 'Search competitors or products...' : 'প্রতিযোগী বা পণ্য খুঁজুন...'} 
            className="w-full bg-white dark:bg-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-xs shadow-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={competitorSearch} 
            onChange={(e) => setCompetitorSearch(e.target.value)} 
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          onClick={() => { setTempCompetitorTrack({}); setIsAddingCompetitorTrack(true); }} 
          className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg transition-all active:scale-95 hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-24 space-y-3 scrollbar-hide">
        {filteredTracks.length > 0 ? (
          filteredTracks.map(track => (
            <div key={track.id} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3 relative group">
              <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700">
                {track.photo ? (
                  <img src={track.photo} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-start">
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">{track.competitorName}</h5>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded uppercase">৳{track.price}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{track.productName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase truncate max-w-[120px]">{track.shopName}</span>
                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">{track.date}</span>
                </div>
                {track.offerDetails && (
                  <div className="mt-2 p-1.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                    <p className="text-[9px] text-amber-700 dark:text-amber-500 leading-tight font-medium">{track.offerDetails}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => deleteCompetitorTrack(track.id)}
                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">{t('noTracks')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
