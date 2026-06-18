
import React, { useState, useEffect } from 'react';
import { Shop, Area, Payment } from '../types';
import { Navigation, Plus, Trash2, Camera, Image, ArrowLeft, X, FileText, Check, Edit3 } from 'lucide-react';
import { MiniMap } from './MapUtils';

interface ShopDetailModalProps {
  viewingShop: Shop;
  setViewingShop: (shop: Shop | null) => void;
  setViewingFullPhoto: (photo: string) => void;
  activeAreas: Area[];
  isVisitedToday: (id: string) => boolean;
  t: (key: string) => string;
  lang: 'en' | 'bn';
  getShopBalance: (id: string) => number;
  isSpecialDayNear: (date?: string) => boolean;
  setShowPaymentHistory: (val: boolean) => void;
  setTempPayment: (payment: Partial<Payment>) => void;
  setShowPaymentModal: (val: boolean) => void;
  toggleVisit: (id: string) => void;
  setOrderShop: (shop: Shop) => void;
  setOrderTab: (tab: 'taking' | 'history') => void;
  setShowOrderSystem: (val: boolean) => void;
  startNavigation: (shop: Shop) => void;
  updateShop: (shop: Shop) => void;
}

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  viewingShop,
  setViewingShop,
  setViewingFullPhoto,
  activeAreas,
  isVisitedToday,
  t,
  lang,
  getShopBalance,
  isSpecialDayNear,
  setShowPaymentHistory,
  setTempPayment,
  setShowPaymentModal,
  toggleVisit,
  setOrderShop,
  setOrderTab,
  setShowOrderSystem,
  startNavigation,
  updateShop
}) => {
  const [showAddGallery, setShowAddGallery] = React.useState(false);
  const [showGalleryPage, setShowGalleryPage] = React.useState(false);
  const [galleryForm, setGalleryForm] = React.useState({ name: '', role: '', photo: '' });
  
  const [showNotesPage, setShowNotesPage] = React.useState(false);
  const [newNoteText, setNewNoteText] = React.useState('');

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      date: Date.now()
    };
    const updatedNotes = [...(viewingShop.notes || []), newNote];
    const updatedShop = { ...viewingShop, notes: updatedNotes };
    updateShop(updatedShop);
    setViewingShop(updatedShop);
    setNewNoteText('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm(lang === 'en' ? 'Delete this note?' : 'এই নোট মুছতে চান?')) return;
    const updatedNotes = (viewingShop.notes || []).filter(n => n.id !== noteId);
    const updatedShop = { ...viewingShop, notes: updatedNotes };
    updateShop(updatedShop);
    setViewingShop(updatedShop);
  };

  const handleAddGalleryItem = () => {
    if (!galleryForm.photo || !galleryForm.name || !galleryForm.role) return;
    
    const newItem = {
      id: `gal-${Date.now()}`,
      photo: galleryForm.photo,
      name: galleryForm.name,
      role: galleryForm.role
    };

    const updatedShop = {
      ...viewingShop,
      gallery: [...(viewingShop.gallery || []), newItem]
    };

    updateShop(updatedShop);
    setViewingShop(updatedShop);
    setGalleryForm({ name: '', role: '', photo: '' });
    setShowAddGallery(false);
  };

  const removeGalleryItem = (id: string) => {
    const updatedShop = {
      ...viewingShop,
      gallery: (viewingShop.gallery || []).filter(item => item.id !== id)
    };
    updateShop(updatedShop);
    setViewingShop(updatedShop);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryForm(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-sm p-3 flex items-center justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-scaleUp my-auto relative">
        <button onClick={() => setViewingShop(null)} className="absolute top-3 right-3 z-20 bg-black/20 backdrop-blur-md text-white p-1.5 rounded-full transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        <div className="h-48 w-full bg-slate-100 relative overflow-hidden cursor-pointer" onClick={() => viewingShop.photo && setViewingFullPhoto(viewingShop.photo)}>
          {viewingShop.photo ? <img src={viewingShop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-200"><svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-12 left-5 flex flex-wrap items-center gap-1.5 pointer-events-none pr-4">
            <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg border border-indigo-400/50 uppercase tracking-widest shadow-lg">{activeAreas.find(a => a.id === viewingShop.areaId)?.name}</span>
            {viewingShop.subArea && <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-lg border border-white/30 uppercase tracking-widest leading-none">{viewingShop.subArea}</span>}
            {viewingShop.visitDay && <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-lg border border-emerald-400/50 tracking-widest leading-none shadow-sm">{viewingShop.visitDay}</span>}
          </div>
        </div>
        <div className="bg-white px-5 pb-6 pt-6 -mt-8 rounded-t-[2rem] relative z-20 shadow-[0_-15px_40px_-5px_rgba(0,0,0,0.3)] text-left">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-black text-slate-800 leading-tight">{viewingShop.name}</h2>
                {isVisitedToday(viewingShop.id) && (
                  <span className="bg-emerald-100 text-emerald-600 rounded-full p-1 shadow-sm border border-emerald-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full shadow-inner ${viewingShop.status === 'Inactive' ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-500 shadow-emerald-200 animate-pulse'}`}></div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${viewingShop.status === 'Inactive' ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {viewingShop.status === 'Inactive' ? t('inactivePartner') : 'Active Partner'}
                </span>
                <span className="text-slate-300 mx-1 text-xs">•</span>
                <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider truncate max-w-[120px]">{viewingShop.ownerName}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowNotesPage(true)} className="bg-amber-50 text-amber-600 p-2.5 rounded-xl border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-sm relative">
                <FileText className="w-4 h-4" />
                {(viewingShop.notes?.length || 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {viewingShop.notes?.length}
                  </span>
                )}
              </button>
              <a href={`tel:${viewingShop.phone}`} className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              </a>
            </div>
          </div>
          <div className="space-y-3 pt-1">
             <div className="grid grid-cols-2 gap-2">
               <div className="bg-slate-50 p-2.5 rounded-[1.25rem] border border-slate-100 flex flex-col justify-center items-start shadow-sm relative overflow-hidden">
                 <div className="flex items-center justify-between w-full mb-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('dues')}</p>
                   <button onClick={() => setShowPaymentHistory(true)} className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-indigo-600 active:scale-90 shadow-sm">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     <span className="text-[8px] font-bold uppercase tracking-wider">{lang === 'en' ? 'History' : 'হিস্টোরি'}</span>
                   </button>
                 </div>
                 <p className={`text-lg font-black leading-none truncate relative z-10 ${getShopBalance(viewingShop.id) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>৳{getShopBalance(viewingShop.id).toLocaleString()}</p>
               </div>
               
               <button 
                 onClick={() => { setTempPayment({ shopId: viewingShop.id, method: 'Cash' }); setShowPaymentModal(true); }}
                 className="bg-indigo-50 hover:bg-indigo-100 p-2.5 rounded-[1.25rem] border border-indigo-100 shadow-sm flex flex-col justify-center items-start relative overflow-hidden active:scale-[0.98] transition-all text-left group"
               >
                 <svg className="w-4 h-4 text-indigo-400 mb-1 absolute right-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                 <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 relative z-10">ACTION</p>
                 <p className="text-xs font-black text-indigo-700 leading-tight relative z-10 mt-1">{t('collectPayment')}</p>
               </button>
             </div>

             {(isSpecialDayNear(viewingShop.birthday) || isSpecialDayNear(viewingShop.anniversary)) && (
               <div className="bg-amber-50/50 dark:bg-amber-900/10 p-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-2">
                  <h4 className="text-[9px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest px-1">{t('specialDays')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {isSpecialDayNear(viewingShop.birthday) && (
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-amber-100/50 dark:border-amber-900/20 shadow-sm">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" /><path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" clipRule="evenodd" /></svg></div>
                        <div className="min-w-0"><p className="text-[7px] font-black text-amber-400 dark:text-amber-600 uppercase tracking-tighter leading-none mb-0.5">{t('birthday')}</p><p className="text-[10px] font-bold text-amber-900 dark:text-amber-200 truncate">{new Date(viewingShop.birthday).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', { day: 'numeric', month: 'long' })}</p></div>
                      </div>
                    )}
                    {isSpecialDayNear(viewingShop.anniversary) && (
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-amber-100/50 dark:border-amber-900/20 shadow-sm">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg></div>
                        <div className="min-w-0"><p className="text-[7px] font-black text-amber-400 dark:text-amber-600 uppercase tracking-tighter leading-none mb-0.5">{t('anniversary')}</p><p className="text-[10px] font-bold text-amber-900 dark:text-amber-200 truncate">{new Date(viewingShop.anniversary).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', { day: 'numeric', month: 'long' })}</p></div>
                      </div>
                    )}
                  </div>
               </div>
             )}

             {/* Photo Gallery Section - Compact */}
             <button 
               onClick={() => setShowGalleryPage(true)}
               className="w-full bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-all group mt-1"
             >
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all">
                   <Image className="w-4 h-4" />
                 </div>
                 <div className="text-left">
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{lang === 'en' ? 'Photo Gallery' : 'ফটো গ্যালারি'}</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                     {(viewingShop.gallery || []).length} {lang === 'en' ? 'Photos' : 'টি ফটো'}
                   </p>
                 </div>
               </div>
               <div className="flex -space-x-2 pr-1">
                 {(viewingShop.gallery || []).slice(0, 3).map((item, i) => (
                   <div key={item.id} className="w-6 h-6 rounded-full border border-white shadow-sm overflow-hidden" style={{ zIndex: 3-i }}>
                     <img src={item.photo} className="w-full h-full object-cover" alt="" />
                   </div>
                 ))}
                 {(viewingShop.gallery || []).length > 3 && (
                   <div className="w-6 h-6 rounded-full bg-slate-100 border border-white shadow-sm flex items-center justify-center text-[7px] font-black text-slate-500 z-0">
                     +{(viewingShop.gallery || []).length - 3}
                   </div>
                 )}
                 {(viewingShop.gallery || []).length === 0 && (
                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                       <Plus className="w-3 h-3 text-slate-300" />
                    </div>
                 )}
               </div>
             </button>
             
             {/* Order and Visit Actions */}
             <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => toggleVisit(viewingShop.id)} className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm active:scale-[0.98] border ${isVisitedToday(viewingShop.id) ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {isVisitedToday(viewingShop.id) ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> {t('unmarkVisited')}</> : <><svg className="w-4 h-4 text-slate-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> {t('markVisited')}</>}
                </button>
                <button onClick={() => { setOrderShop(viewingShop); setOrderTab('taking'); setShowOrderSystem(true); setViewingShop(null); }} className="flex flex-col items-center justify-center gap-1 py-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-[9px] uppercase tracking-widest rounded-2xl shadow-md shadow-indigo-200/50 active:scale-[0.98] transition-all hover:shadow-lg hover:shadow-indigo-300">
                  <div className="relative"><Plus className="w-4 h-4" /></div> TAKE ORDER
                </button>
             </div>

             <div className="rounded-2xl overflow-hidden border border-slate-200 h-28 relative mt-2 group">
               <MiniMap location={viewingShop.location} label={viewingShop.name} />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent pointer-events-none"></div>
             </div>

             <div className="grid grid-cols-2 gap-2 mt-2">
               <button onClick={() => startNavigation(viewingShop)} className="flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] hover:bg-slate-100 text-[9px] uppercase tracking-wider">
                 <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                 {t('internalMap')}
               </button>
               <button 
                 onClick={() => {
                   const url = `https://www.google.com/maps/dir/?api=1&destination=${viewingShop.location.lat},${viewingShop.location.lng}&travelmode=driving`;
                   window.open(url, '_blank');
                 }} 
                 className="flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] hover:bg-slate-100 text-[9px] uppercase tracking-wider"
               >
                 <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=64" className="w-3.5 h-3.5 drop-shadow-sm" alt="" />
                 {t('googleMaps')}
               </button>
             </div>
           </div>
        </div>
      </div>

      {showGalleryPage && (
        <div className="fixed inset-0 z-[550] bg-white animate-slideUp flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowGalleryPage(false)}
                className="p-2 bg-slate-100 text-slate-600 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-slate-800">{lang === 'en' ? 'Photo Gallery' : 'ফটো গ্যালারি'}</h3>
            </div>
            <button 
              onClick={() => setShowAddGallery(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              {lang === 'en' ? 'Add Photo' : 'ছবি যোগ'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {(viewingShop.gallery || []).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Image className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{lang === 'en' ? 'No photos in gallery' : 'গ্যালারিতে কোনো ছবি নেই'}</p>
                <p className="text-[10px] text-slate-300 mt-2">{lang === 'en' ? 'Add shop owner or helper photos here' : 'দোকান মালিক বা সহকারীর ছবি এখানে যোগ করুন'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {viewingShop.gallery?.map((item) => (
                  <div key={item.id} className="bg-slate-50 rounded-[2rem] p-3 border border-slate-100 relative group animate-scaleUp">
                    <button 
                      onClick={() => removeGalleryItem(item.id)}
                      className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg active:scale-75 transition-all z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div 
                      className="aspect-square rounded-2xl overflow-hidden mb-3 shadow-inner cursor-pointer"
                      onClick={() => setViewingFullPhoto(item.photo)}
                    >
                      <img src={item.photo} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{item.name}</p>
                      <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-tighter mt-0.5">{item.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showNotesPage && (
        <div className="fixed inset-0 z-[550] bg-white animate-slideUp flex flex-col">
          <div className="p-4 flex items-center gap-3 border-b border-slate-100">
            <button 
              onClick={() => setShowNotesPage(false)}
              className="p-2 bg-slate-100 text-slate-600 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800">{lang === 'en' ? 'Shop Notes' : 'দোকান নোটসমূহ'}</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-4 flex flex-col gap-3 shadow-inner">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={lang === 'en' ? 'Write a new note...' : 'একটি নতুন নোট লিখুন...'}
                className="w-full text-sm p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 min-h-[80px] resize-none bg-white font-medium"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="py-3 px-6 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none self-end flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {lang === 'en' ? 'Save Note' : 'নোট সংরক্ষণ করুন'}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {(viewingShop.notes || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-10 opacity-60">
                  <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'en' ? 'No notes yet' : 'কোনো নোট নেই'}</p>
                </div>
              ) : (
                [...(viewingShop.notes || [])].sort((a, b) => b.date - a.date).map(note => (
                  <div key={note.id} className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm relative group animate-scaleUp">
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 active:scale-75 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-60"></div>
                      {new Date(note.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed pr-8">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showAddGallery && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                 <Camera className="w-5 h-5" />
              </div>
              {lang === 'en' ? 'Add to Gallery' : 'গ্যালারিতে যোগ করুন'}
            </h3>
            
            <div className="space-y-4">
              <div 
                className="h-40 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative"
                onClick={() => document.getElementById('gallery-photo-input')?.click()}
              >
                {galleryForm.photo ? (
                  <img src={galleryForm.photo} className="w-full h-full object-cover" alt="" />
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{lang === 'en' ? 'Tap to take photo' : 'ছবি তুলতে ট্যাপ করুন'}</p>
                  </>
                )}
                <input 
                  id="gallery-photo-input" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoSelect}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'en' ? 'PERSON NAME' : 'ব্যক্তির নাম'}</label>
                <input 
                  type="text" 
                  value={galleryForm.name}
                  onChange={e => setGalleryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all outline-none"
                  placeholder={lang === 'en' ? 'Enter name...' : 'নাম লিখুন...'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'en' ? 'ROLE (e.g. Owner, Helper)' : 'ভূমিকা (যেমন: মালিক, সহকারী)'}</label>
                <input 
                  type="text" 
                  value={galleryForm.role}
                  onChange={e => setGalleryForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all outline-none"
                  placeholder={lang === 'en' ? 'Role...' : 'ভূমিকা...'}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAddGallery(false)}
                  className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all"
                >
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button 
                  onClick={handleAddGalleryItem}
                  disabled={!galleryForm.photo || !galleryForm.name || !galleryForm.role}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {lang === 'en' ? 'Add Person' : 'যোগ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
