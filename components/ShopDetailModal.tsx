
import React from 'react';
import { Shop, Area, Payment } from '../types';
import { Navigation, Plus, Trash2, Camera, Image, ArrowLeft, X } from 'lucide-react';
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-12 left-6 flex items-center gap-1.5 pointer-events-none"><span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full border border-indigo-400/50 uppercase tracking-widest shadow-lg">{activeAreas.find(a => a.id === viewingShop.areaId)?.name}</span>{viewingShop.subArea && <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-full border border-white/30 uppercase tracking-widest">{viewingShop.subArea}</span>}<span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-full border border-white/30 uppercase tracking-widest">Verified</span></div>
        </div>
        <div className="bg-white px-6 pb-8 pt-12 -mt-10 rounded-t-[2.5rem] relative z-10 shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.3)] text-left">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2"><h2 className="text-2xl font-black text-slate-900 leading-tight mb-0.5">{viewingShop.name}</h2>{isVisitedToday(viewingShop.id) && <span className="bg-emerald-500 text-white rounded-full p-1 shadow-lg animate-scaleUp"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></span>}</div>
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full animate-pulse ${viewingShop.status === 'Inactive' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${viewingShop.status === 'Inactive' ? 'text-rose-500' : 'text-slate-400'}`}>
                  {viewingShop.status === 'Inactive' ? t('inactivePartner') : t('activePartner')}
                </span>
              </div>
            </div>
            <a href={`tel:${viewingShop.phone}`} className="bg-emerald-500 text-white p-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-90 hover:bg-emerald-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></a>
          </div>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('ownerName')}</p><p className="text-sm font-bold text-slate-700 leading-tight truncate">{viewingShop.ownerName}</p></div>
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('dues')}</p><p className={`text-sm font-black leading-tight truncate ${getShopBalance(viewingShop.id) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>৳{getShopBalance(viewingShop.id)}</p></div>
             </div>

             {(isSpecialDayNear(viewingShop.birthday) || isSpecialDayNear(viewingShop.anniversary)) && (
               <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-2">
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
               className="w-full bg-indigo-50/50 p-4 rounded-[1.8rem] border border-indigo-100/50 flex items-center justify-between active:scale-[0.98] transition-all group"
             >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <Image className="w-6 h-6" />
                 </div>
                 <div className="text-left">
                   <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{lang === 'en' ? 'Photo Gallery' : 'ফটো গ্যালারি'}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                     {(viewingShop.gallery || []).length} {lang === 'en' ? 'Profiles Added' : 'টি প্রোফাইল যোগ করা হয়েছে'}
                   </p>
                 </div>
               </div>
               <div className="flex -space-x-3 pr-2">
                 {(viewingShop.gallery || []).slice(0, 3).map((item, i) => (
                   <div key={item.id} className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden" style={{ zIndex: 3-i }}>
                     <img src={item.photo} className="w-full h-full object-cover" alt="" />
                   </div>
                 ))}
                 {(viewingShop.gallery || []).length > 3 && (
                   <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-slate-500 z-0">
                     +{(viewingShop.gallery || []).length - 3}
                   </div>
                 )}
                 {(viewingShop.gallery || []).length === 0 && (
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center">
                       <Plus className="w-4 h-4 text-slate-300" />
                    </div>
                 )}
               </div>
             </button>
             
             {/* Payment History Section */}
             <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
               <div className="flex justify-between items-center px-1">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('paymentHistory')}</h4>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => setShowPaymentHistory(true)}
                     className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-1.5 rounded-lg border border-indigo-100 active:scale-95 transition-all uppercase tracking-tighter flex items-center gap-1"
                   >
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                     {t('viewHistory')}
                   </button>
                   <button 
                     onClick={() => { setTempPayment({ shopId: viewingShop.id, method: 'Cash' }); setShowPaymentModal(true); }}
                     className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 active:scale-95 transition-all uppercase tracking-tighter flex items-center gap-1"
                   >
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                     {t('collectPayment')}
                   </button>
                 </div>
               </div>
             </div>
             <div className="flex gap-2">
               <button onClick={() => toggleVisit(viewingShop.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${isVisitedToday(viewingShop.id) ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-900 border-slate-800 text-white'}`}>{isVisitedToday(viewingShop.id) ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg> {t('unmarkVisited')}</> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> {t('markVisited')}</>}</button>
               <button onClick={() => { setOrderShop(viewingShop); setOrderTab('taking'); setShowOrderSystem(true); setViewingShop(null); }} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase rounded-xl shadow-sm active:scale-95 transition-all">Take Order</button>
             </div>
             <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-32"><MiniMap location={viewingShop.location} label={viewingShop.name} /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => startNavigation(viewingShop)} className="flex-[1.5] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-indigo-700 text-[10px] uppercase tracking-widest">
              <Navigation className="w-4 h-4" />
              {t('internalMap')}
            </button>
            <button 
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${viewingShop.location.lat},${viewingShop.location.lng}&travelmode=driving`;
                window.open(url, '_blank');
              }} 
              className="flex-1 bg-white border-2 border-slate-100 text-slate-700 font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-slate-50 text-[10px] uppercase tracking-widest"
            >
              <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=64" className="w-4 h-4" alt="" />
              {t('googleMaps')}
            </button>
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
