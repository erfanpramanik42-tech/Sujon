
import React from 'react';
import { Area } from '../types';

interface AreaManagementModalProps {
  lang: 'en' | 'bn';
  t: (key: string) => string;
  setIsManagingAreas: (val: boolean) => void;
  addArea: (e: React.FormEvent) => void;
  newAreaName: string;
  handleInputFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  setNewAreaName: (val: string) => void;
  newAreaDay: string;
  setNewAreaDay: (val: string) => void;
  WEEKDAYS: string[];
  activeAreas: Area[];
  updateAreaDetails: (id: string, name: string, day: string) => void;
  deleteArea: (id: string, e: React.MouseEvent) => void;
}

export const AreaManagementModal: React.FC<AreaManagementModalProps> = ({
  lang,
  t,
  setIsManagingAreas,
  addArea,
  newAreaName,
  handleInputFocus,
  setNewAreaName,
  newAreaDay,
  setNewAreaDay,
  WEEKDAYS,
  activeAreas,
  updateAreaDetails,
  deleteArea
}) => {
  return (
    <div className="fixed inset-0 z-[700] bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center overflow-y-auto items-start md:items-center">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-scaleUp my-4 md:my-auto">
        <div className="p-4 bg-indigo-700 text-white flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'Manage Areas' : 'এলাকা ব্যবস্থাপনা'}</h3>
          <button onClick={() => setIsManagingAreas(false)} className="transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-4 space-y-4 text-left">
          <form onSubmit={addArea} className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Add New Area</label>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <input type="text" placeholder="e.g. Uttara Section 4" className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200" value={newAreaName} onFocus={handleInputFocus} onChange={e => setNewAreaName(e.target.value)} />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg></button>
              </div>
              <select className="w-full bg-slate-50 rounded-lg px-3 py-1.5 text-[10px] font-bold border border-slate-200" value={newAreaDay} onChange={e => setNewAreaDay(e.target.value)}>
                {WEEKDAYS.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
          </form>
          <div className="max-h-[200px] overflow-y-auto space-y-1.5 scrollbar-hide">
            {activeAreas.map(area => (
              <div key={area.id} className="flex flex-col gap-0.5 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <input type="text" className="bg-transparent font-bold text-slate-700 text-xs flex-1 outline-none focus:bg-white px-1 rounded" value={area.name} onChange={(e) => updateAreaDetails(area.id, e.target.value, area.assignedDay || '')} />
                  <button type="button" onClick={(e) => deleteArea(area.id, e)} className="text-rose-500 p-1.5 transition-all active:scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
                <select className="bg-transparent text-[9px] font-black uppercase text-indigo-500 outline-none w-fit" value={area.assignedDay} onChange={(e) => updateAreaDetails(area.id, area.name, e.target.value)}>
                  {WEEKDAYS.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={() => setIsManagingAreas(false)} className="w-full bg-slate-100 text-slate-600 font-bold py-2.5 rounded-lg text-xs transition-all active:scale-95">{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
};
