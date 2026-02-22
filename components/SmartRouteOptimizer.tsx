
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Shop, GeoLocation, Area } from '../types';

interface SmartRouteOptimizerProps {
  currentLocation: GeoLocation | null;
  shops: Shop[];
  areas: Area[];
  onClose: () => void;
  onStartNavigation: (shop: Shop) => void;
  lang: 'en' | 'bn';
  t: (key: string) => string;
}

export const SmartRouteOptimizer: React.FC<SmartRouteOptimizerProps> = ({
  currentLocation,
  shops,
  areas,
  onClose,
  onStartNavigation,
  lang,
  t
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedOrder, setOptimizedOrder] = useState<Shop[]>([]);
  const [aiStrategy, setAiStrategy] = useState<string>('');

  const toggleShop = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const runOptimization = async () => {
    if (selectedIds.size === 0 || !currentLocation) return;
    setIsOptimizing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const targetShops = shops.filter(s => selectedIds.has(s.id));
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a logistics expert. I am at GPS: ${currentLocation.lat}, ${currentLocation.lng}. Order these shop IDs for the most efficient sequence: ${targetShops.map(s => `ID:${s.id} (Lat:${s.location.lat}, Lng:${s.location.lng})`).join(', ')}. Provide a 1-sentence strategy in ${lang === 'bn' ? 'Bengali' : 'English'}.`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              orderedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              strategy: { type: Type.STRING }
            },
            required: ["orderedIds", "strategy"]
          }
        }
      });

      // Robust parsing logic to handle potential AI markdown formatting
      const rawText = response.text || '';
      let cleanJson = rawText;
      if (rawText.includes('```')) {
        const parts = rawText.split('```');
        // Extract content between backticks, ignoring language identifier if present
        cleanJson = parts[1].replace(/^[a-zA-Z]+\n/, '').trim();
      } else {
        cleanJson = rawText.trim();
      }

      const result = JSON.parse(cleanJson || '{}');
      const newOrder = (result.orderedIds || [])
        .map((id: string) => shops.find(s => s.id === id))
        .filter(Boolean) as Shop[];

      if (newOrder.length > 0) {
        setOptimizedOrder(newOrder);
        setAiStrategy(result.strategy || '');
      } else {
        throw new Error("Empty optimization result");
      }
    } catch (err) {
      console.error("Optimization failed", err);
      // Optional: Add simple logic-only feedback if needed without changing UI components
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4600] bg-slate-50 flex flex-col animate-fadeIn overflow-hidden">
      <header className="bg-indigo-700 text-white p-6 shadow-lg flex items-center gap-4 shrink-0">
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-90 border border-white/10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h3 className="text-xl font-black uppercase tracking-tight leading-none">{t('smartRoute')}</h3>
          <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-1">Grounded Logistics AI</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 scrollbar-hide">
        {optimizedOrder.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] shadow-sm">
              <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-2">Select Target Shops</h4>
              <p className="text-xs text-indigo-600/70 font-medium leading-relaxed uppercase tracking-tight">Select the shops you intend to visit today for an AI-optimized sequence.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {shops.filter(s => !s.isArchived).map(shop => {
                const isSelected = selectedIds.has(shop.id);
                return (
                  <div key={shop.id} onClick={() => toggleShop(shop.id)} className={`p-5 rounded-[2.2rem] border-2 transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 text-slate-700'}`}>
                    <div className={`w-8 h-8 rounded-2xl border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20 border-white/30' : 'border-slate-200'}`}>
                      {isSelected && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm uppercase tracking-tight truncate">{shop.name}</p>
                      <p className={`text-[10px] uppercase font-black tracking-widest ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {areas.find(a => a.id === shop.areaId)?.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-emerald-600 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden animate-scaleUp">
              <div className="relative z-10 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Sequence Generation Ready</h4>
                <p className="text-sm font-black italic leading-snug">" {aiStrategy} "</p>
              </div>
            </div>
            <div className="relative pl-10 space-y-5">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-indigo-50 border-l-2 border-dashed border-indigo-200"></div>
              {optimizedOrder.map((shop, idx) => (
                <div key={shop.id} className="relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="absolute -left-[37px] w-9 h-9 rounded-2xl bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center border-4 border-slate-50 z-10 shadow-lg">{idx + 1}</div>
                  <div className="flex-1 min-w-0 mr-4">
                    <h5 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{shop.name}</h5>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{shop.ownerName}</p>
                  </div>
                  <button onClick={() => onStartNavigation(shop)} className="bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm">Go</button>
                </div>
              ))}
            </div>
            <button onClick={() => setOptimizedOrder([])} className="w-full py-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Start Over</button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pointer-events-none">
        {optimizedOrder.length === 0 && (
          <button disabled={selectedIds.size === 0 || isOptimizing} onClick={runOptimization} className={`w-full pointer-events-auto flex items-center justify-center gap-3 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 ${selectedIds.size === 0 || isOptimizing ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white shadow-indigo-100'}`}>
            {isOptimizing ? "Calculating..." : "Generate AI Route"}
          </button>
        )}
      </div>
    </div>
  );
};
