
import React from 'react';
import { Product, Shop, Place, UserProfile, NotificationPreferences, Dealer } from '../types';
import { MapPin, Plus, Database, Download, Upload, Trash2, RefreshCw, ChevronRight, Pencil, Database as DatabaseIcon } from 'lucide-react';

interface SettingsViewProps {
  isManagingCatalog: boolean;
  setIsManagingCatalog: (val: boolean) => void;
  isManagingShops: boolean;
  setIsManagingShops: (val: boolean) => void;
  isManagingPlaces: boolean;
  setIsManagingPlaces: (val: boolean) => void;
  t: (key: string) => string;
  activeProducts: Product[];
  setEditingProduct: (val: Partial<Product>) => void;
  setIsEditingProduct: (val: boolean) => void;
  calculateFinalPrice: (price: number, discount: number) => number;
  deleteProduct: (id: string, e: React.MouseEvent) => void;
  activeShops: Shop[];
  toggleShopStatus: (id: string, e: React.MouseEvent) => void;
  deleteShop: (id: string, e: React.MouseEvent) => void;
  activePlaces: Place[];
  setEditingPlace: (val: Partial<Place>) => void;
  setIsEditingPlace: (val: boolean) => void;
  deletePlace: (id: string, e: React.MouseEvent) => void;
  userProfile: UserProfile;
  setTempProfile: (val: UserProfile) => void;
  setIsEditingProfile: (val: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  activeDealers: Dealer[];
  setEditingDealer: (val: Partial<Dealer>) => void;
  setIsEditingDealer: (val: boolean) => void;
  notificationPrefs: NotificationPreferences;
  setNotificationPrefs: (updater: (prev: NotificationPreferences) => NotificationPreferences) => void;
  handleExportData: () => void;
  handleImportClick: () => void;
  clearDemoData: () => void;
  resetApp: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reRequestPermissions: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isManagingCatalog,
  setIsManagingCatalog,
  isManagingShops,
  setIsManagingShops,
  isManagingPlaces,
  setIsManagingPlaces,
  t,
  activeProducts,
  setEditingProduct,
  setIsEditingProduct,
  calculateFinalPrice,
  deleteProduct,
  activeShops,
  toggleShopStatus,
  deleteShop,
  activePlaces,
  setEditingPlace,
  setIsEditingPlace,
  deletePlace,
  userProfile,
  setTempProfile,
  setIsEditingProfile,
  isDarkMode,
  setIsDarkMode,
  activeDealers,
  setEditingDealer,
  setIsEditingDealer,
  notificationPrefs,
  setNotificationPrefs,
  handleExportData,
  handleImportClick,
  clearDemoData,
  resetApp,
  fileInputRef,
  handleFileChange,
  reRequestPermissions
}) => {
  return (
    <div className="flex flex-col h-full gap-4 animate-fadeIn pb-24 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center">
         <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-sm">
           <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 000 6z" />
           </svg>
           {isManagingCatalog ? t('catalogSection') : isManagingShops ? t('manageShops') : isManagingPlaces ? t('managePlaces') : t('settings')}
         </h4>
         {(isManagingCatalog || isManagingShops || isManagingPlaces) && (
           <button onClick={() => { setIsManagingCatalog(false); setIsManagingShops(false); setIsManagingPlaces(false); }} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">Back</button>
         )}
      </div>

      {isManagingCatalog ? (
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/20 px-4">
              <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400">Total Products: {activeProducts.length}</p>
              <button onClick={() => { setEditingProduct({ status: 'Active' }); setIsEditingProduct(true); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95">{t('addProduct')}</button>
           </div>
           <div className="space-y-2">
              {activeProducts.length > 0 ? activeProducts.map(product => {
                const finalPrice = calculateFinalPrice(product.price, product.discount);
                return (
                  <div key={product.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex-shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700">
                      {product.photo ? <img src={product.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg></div>}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1">
                        <h6 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight">{product.name}</h6>
                        {product.status === 'Inactive' && <span className="bg-slate-100 dark:bg-slate-900 text-slate-400 text-[7px] px-1 rounded uppercase">Disabled</span>}
                      </div>
                      <div className="flex gap-1.5 items-center mt-0.5">
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1 py-0.5 rounded uppercase tracking-tighter">৳{finalPrice}</span>
                        {product.discount > 0 && <span className="text-[7px] text-slate-400 line-through font-bold">৳{product.price}</span>}
                        {product.weight && <span className="text-[8px] font-bold text-slate-400 border-l pl-1.5 border-slate-200 dark:border-slate-700 uppercase">{product.weight}</span>}
                        <span className="text-[8px] font-bold text-emerald-600 ml-auto">Qty: {product.stock}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditingProduct(product); setIsEditingProduct(true); }} className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-lg hover:text-indigo-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={(e) => deleteProduct(product.id, e)} className="p-2 bg-rose-50 dark:bg-rose-900/50 text-rose-400 rounded-lg hover:text-rose-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                );
              }) : <div className="py-20 text-center text-slate-300 italic text-sm">Catalog is empty. Add products to start.</div>}
           </div>
        </div>
      ) : isManagingShops ? (
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/20 px-4">
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400">Total Active Shops: {activeShops.length}</p>
           </div>
           <div className="space-y-2">
              {activeShops.length > 0 ? activeShops.map(shop => (
                <div key={shop.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex-shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700">
                    {shop.photo ? <img src={shop.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold text-[10px]">{shop.name.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h6 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight">{shop.name}</h6>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[9px] text-slate-400 font-bold">{shop.ownerName}</p>
                      <span className="text-slate-200 dark:text-slate-700 text-[8px]">•</span>
                      <span className={`text-[8px] font-black uppercase tracking-tighter ${shop.status === 'Inactive' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {shop.status === 'Inactive' ? t('inactivePartner') : t('activePartner')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={(e) => toggleShopStatus(shop.id, e)} className={`p-2 rounded-lg transition-colors ${shop.status === 'Inactive' ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-500 hover:text-emerald-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-600'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button onClick={(e) => deleteShop(shop.id, e)} className="p-2 bg-rose-50 dark:bg-rose-900/50 text-rose-400 rounded-lg hover:text-rose-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              )) : <div className="py-20 text-center text-slate-300 italic text-sm">No shops found.</div>}
           </div>
        </div>
      ) : isManagingPlaces ? (
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-sky-50/50 dark:bg-sky-900/10 p-3 rounded-2xl border border-sky-100 dark:border-sky-900/20 px-4">
              <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400">Total Saved Places: {activePlaces.length}</p>
              <button onClick={() => { setEditingPlace({}); setIsEditingPlace(true); }} className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-sky-100 dark:shadow-none transition-all active:scale-95">{t('addPlace')}</button>
           </div>
           <div className="space-y-2">
              {activePlaces.length > 0 ? activePlaces.map(place => (
                <div key={place.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-900/50 flex-shrink-0 flex items-center justify-center border border-sky-100 dark:border-sky-900/30 text-sky-600 dark:text-sky-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9m0 0l-1.414-1.414m1.414 1.414L15.828 18.07M12 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h6 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight">{place.name}</h6>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold truncate">{place.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditingPlace(place); setIsEditingPlace(true); }} className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-lg hover:text-sky-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={(e) => deletePlace(place.id, e)} className="p-2 bg-rose-50 dark:bg-rose-900/50 text-rose-400 rounded-lg hover:text-rose-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              )) : <div className="py-20 text-center text-slate-300 dark:text-slate-600 italic text-sm">No saved places found.</div>}
           </div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 relative overflow-hidden group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/50 flex-shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 shadow-md relative z-10">
              {userProfile.photo ? (
                <img src={userProfile.photo} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-300 dark:text-indigo-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left relative z-10">
              <h5 className="font-black text-slate-800 dark:text-slate-200 text-sm truncate leading-tight">
                {userProfile.name || 'Set Your Name'}
              </h5>
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {userProfile.designation || 'Designation'}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">
                ID: {userProfile.employeeId || 'N/A'}
              </p>
              {userProfile.phone && (
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                  {userProfile.phone}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 relative z-10">
              <button 
                onClick={() => { setTempProfile(userProfile); setIsEditingProfile(true); }}
                className="p-2.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={() => reRequestPermissions()}
                className="p-2.5 bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-xl hover:bg-sky-600 hover:text-white transition-all active:scale-95 shadow-sm"
                title={t('fixPermissions') || 'Fix Permissions'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-all active:rotate-180 duration-500 shadow-sm"
                title={t('reloadApp') || 'Reload App'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 3v5h-5" />
                </svg>
              </button>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setIsManagingCatalog(true)}
              className="w-full bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{t('catalogSection')}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{activeProducts.length} Registered Items</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </button>

            <button 
              onClick={() => setIsManagingShops(true)}
              className="w-full bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{t('manageShops')}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{activeShops.length} Active Shops</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </button>

            <button 
              onClick={() => setIsManagingPlaces(true)}
              className="w-full bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{t('managePlaces')}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{activePlaces.length} Saved Places</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </button>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  {isDarkMode ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{t('theme')}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{isDarkMode ? t('darkMode') : t('lightMode')}</p>
                </div>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${isDarkMode ? 'left-4.5' : 'left-0.5'}`}></div>
              </div>
            </button>

            <button 
              onClick={() => { setEditingDealer({}); setIsEditingDealer(true); }}
              className="w-full bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Add Dealer</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{activeDealers.length} Current Dealers</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{t('notificationSettings')}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{t('pushNotifications')}</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'orderConfirmation', label: t('orderConfirmation') },
                { key: 'targetReminder', label: t('targetReminder') },
                { key: 'newShopDetection', label: t('newShopDetection') }
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{pref.label}</span>
                  <button 
                    onClick={() => setNotificationPrefs(prev => ({ ...prev, [pref.key]: !prev[pref.key as keyof NotificationPreferences] }))}
                    className={`w-10 h-5 rounded-full relative transition-colors ${notificationPrefs[pref.key as keyof NotificationPreferences] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${notificationPrefs[pref.key as keyof NotificationPreferences] ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <DatabaseIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Data Management</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">Backup & Restore</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 relative z-10">
              <button 
                onClick={handleExportData}
                className="bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between group transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Export Local Backup</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Saves shops, areas & route history as JSON</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
              </button>

              <button 
                onClick={handleImportClick}
                className="bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between group transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Import Local Backup</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Merge external file with existing data</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={clearDemoData}
                  className="bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-100 dark:border-amber-900/50 p-3 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95"
                >
                  <Trash2 className="w-5 h-5 text-amber-600" />
                  <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Clear Demo Data</span>
                </button>
                <button 
                  onClick={resetApp}
                  className="bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-900/50 p-3 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95"
                >
                  <RefreshCw className="w-5 h-5 text-rose-600" />
                  <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">Reset App</span>
                </button>
              </div>

              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-full -translate-y-12 translate-x-12 blur-3xl pointer-events-none"></div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl text-center space-y-1">
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">App Information</p>
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">FieldPro Sales Assistant v1.2.4<br/>Data is stored strictly on this device.</p>
          </div>
        </>
      )}
    </div>
  );
};
