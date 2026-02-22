
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeoLocation } from '../types';

interface SmartPlaceSearchProps {
  currentLocation: GeoLocation | null;
  onSelectPlace: (details: { name: string; lat: number; lng: number; address?: string }) => void;
  onClose: () => void;
  lang: 'en' | 'bn';
}

export const SmartPlaceSearch: React.FC<SmartPlaceSearchProps> = ({ currentLocation, onSelectPlace, onClose, lang }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [responseMarkdown, setResponseMarkdown] = useState('');
  const [groundingLinks, setGroundingLinks] = useState<{ title: string; uri: string }[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find precise location/details for: "${query}". Describe the closest match.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: currentLocation ? { latitude: currentLocation.lat, longitude: currentLocation.lng } : undefined
            }
          }
        }
      });

      setResponseMarkdown(response.text || '');
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setGroundingLinks(chunks.filter((c: any) => c.maps).map((c: any) => ({ title: c.maps.title, uri: c.maps.uri })));
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-scaleUp my-auto">
        <div className="p-6 bg-indigo-700 text-white flex justify-between items-center">
          <h3 className="text-lg font-black uppercase tracking-tight">{lang === 'en' ? 'Place Search' : 'প্লেস সার্চ'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-8 space-y-6">
          <form onSubmit={handleSearch} className="relative">
            <input type="text" placeholder={lang === 'en' ? "Search location..." : "লোকেশন খুঁজুন..."} className="w-full bg-slate-50 rounded-2xl px-5 py-4 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit" disabled={isSearching} className="absolute right-3 top-3 p-2 bg-indigo-600 text-white rounded-xl active:scale-95 disabled:opacity-50">{isSearching ? "..." : "Find"}</button>
          </form>
          {responseMarkdown && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-sm leading-relaxed text-slate-700 font-medium">{responseMarkdown}</div>
              <div className="flex flex-wrap gap-2">
                {groundingLinks.map((link, idx) => (
                  <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">{link.title}</a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
