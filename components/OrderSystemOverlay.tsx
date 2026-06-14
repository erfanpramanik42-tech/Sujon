
import React from 'react';
import { Shop, Order, Product, OrderItem, ReplacementItem } from '../types';

interface OrderSystemOverlayProps {
  orderTab: 'taking' | 'history';
  setOrderTab: (tab: 'taking' | 'history') => void;
  setShowOrderSystem: (val: boolean) => void;
  orderShop: Shop | null;
  products: Product[];
  orderFilteredProducts: Product[];
  orderSearch: string;
  setOrderSearch: (val: string) => void;
  categories: string[];
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, delta: number) => void;
  orderCart: OrderItem[];
  cartSummary: { subtotal: number; total: number };
  setShowReplacementModal: (val: boolean) => void;
  setOrderCart: (val: OrderItem[]) => void;
  orderReplacements: ReplacementItem[];
  removeReplacement: (id: string) => void;
  confirmOrder: () => void;
  orders: Order[];
  selectedOrderForDetail: Order | null;
  setSelectedOrderForDetail: (order: Order | null) => void;
  renderOrderDetail: (order: Order) => React.ReactNode;
  downloadOrderPDF: (order: Order) => void;
  calculateFinalPrice: (price: number, discount: number) => number;
  t: (key: string) => string;
  setOrderReplacements: (val: ReplacementItem[]) => void;
  setOrderShop: (shop: Shop | null) => void;
  activeShops: Shop[];
}

export const OrderSystemOverlay: React.FC<OrderSystemOverlayProps> = ({
  orderTab,
  setOrderTab,
  setShowOrderSystem,
  orderShop,
  products,
  orderFilteredProducts,
  orderSearch,
  setOrderSearch,
  categories,
  addToCart,
  updateCartQty,
  orderCart,
  cartSummary,
  setShowReplacementModal,
  setOrderCart,
  orderReplacements,
  removeReplacement,
  confirmOrder,
  orders,
  selectedOrderForDetail,
  setSelectedOrderForDetail,
  renderOrderDetail,
  downloadOrderPDF,
  calculateFinalPrice,
  t,
  setOrderReplacements,
  setOrderShop,
  activeShops
}) => {
  return (
    <div className="fixed inset-0 z-[4000] bg-white flex flex-col animate-fadeIn overflow-hidden">
      <header className="bg-white border-b border-slate-100 p-4 flex flex-col gap-4 shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setShowOrderSystem(false); setOrderCart([]); setOrderReplacements([]); setOrderShop(null); setSelectedOrderForDetail(null); }} 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0 text-left">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none truncate">{orderShop?.name || 'Order System'}</h3>
            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-[0.1em] mt-1 truncate">{orderShop ? `${orderShop.ownerName} • ${orderShop.phone}` : 'Select a shop to begin'}</p>
          </div>
        </div>

        {orderShop && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setOrderTab('taking')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${orderTab === 'taking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>New Order</button>
            <button onClick={() => setOrderTab('history')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${orderTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Order History</button>
          </div>
        )}
      </header>

      {!orderShop ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left ml-1">Target Shop</p>
          <div className="grid grid-cols-1 gap-2.5">
            {activeShops.map(s => (
              <button 
                key={s.id} 
                onClick={() => setOrderShop(s)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                    {s.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 leading-tight">{s.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{s.ownerName}</p>
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : orderTab === 'history' && selectedOrderForDetail ? (
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50/30">
           <div className="mb-3 text-left"><button onClick={() => setSelectedOrderForDetail(null)} className="text-[9px] font-black text-indigo-600 uppercase bg-white px-4 py-2 rounded-full border border-indigo-100 shadow-sm transition-all active:scale-95">Back to history</button></div>
           {renderOrderDetail(selectedOrderForDetail)}
        </div>
      ) : orderTab === 'taking' ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
           <div className="bg-white p-3 space-y-2.5 shrink-0">
             <div className="relative text-left">
               <input type="text" placeholder="Search products..." className="w-full bg-slate-50 rounded-xl py-2.5 pl-10 pr-3 text-xs font-bold focus:bg-white border-2 border-transparent focus:border-indigo-50 transition-all outline-none" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
               <svg className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setOrderSearch(cat === 'All' ? '' : cat)} className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${orderSearch === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{cat}</button>
                ))}
             </div>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {orderFilteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {orderFilteredProducts.map(p => {
                    const inCart = orderCart.find(item => item.productId === p.id);
                    return (
                      <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                          {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <svg className="w-6 h-6 text-slate-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm7 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9H9a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h6 className="font-bold text-slate-800 text-xs truncate leading-tight">{p.name}</h6>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] font-black text-indigo-600">৳{calculateFinalPrice(p.price, p.discount)}</span>
                            <span className="text-[6px] text-slate-400 font-bold uppercase">{p.weight}</span>
                          </div>
                        </div>
                        {inCart ? (
                          <div className="flex items-center bg-indigo-50 rounded-lg overflow-hidden border border-indigo-100">
                            <button onClick={() => updateCartQty(p.id, -1)} className="p-1.5 text-indigo-600 active:bg-indigo-100"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg></button>
                            <span className="w-5 text-center text-[10px] font-black text-indigo-700">{inCart.quantity}</span>
                            <button onClick={() => updateCartQty(p.id, 1)} className="p-1.5 text-indigo-600 active:bg-indigo-100"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(p)} className="bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-90"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : ( <div className="py-12 text-center text-slate-300 italic text-xs">No products found.</div> )}
           </div>
           {orderCart.length > 0 && (
             <div className="bg-white border-t border-slate-100 p-3 pb-5 space-y-2.5 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)] animate-slideUp text-left">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Order Value</span>
                    <span className="text-lg font-black text-slate-900 leading-none">৳{cartSummary.total}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowReplacementModal(true)} className="text-[8px] font-black text-indigo-600 uppercase border border-indigo-100 px-2.5 py-1 rounded-md active:bg-indigo-50 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                      {t('productReplacement')}
                    </button>
                    <button onClick={() => setOrderCart([])} className="text-[8px] font-black text-rose-400 uppercase border border-rose-100 px-2.5 py-1 rounded-md active:bg-rose-50">Reset Cart</button>
                  </div>
                </div>

                {orderReplacements.length > 0 && (
                  <div className="bg-indigo-50/50 rounded-xl p-3 space-y-2 border border-indigo-100/50">
                    <h6 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3" /></svg>
                      {t('replacementSection')}
                    </h6>
                    <div className="space-y-1.5">
                      {orderReplacements.map(r => (
                        <div key={r.id} className="flex justify-between items-center bg-white/60 p-2 rounded-lg border border-indigo-50">
                          <div className="text-[9px] font-bold text-slate-600">
                            <span className="text-indigo-600">{r.productName} ({r.quantity})</span>
                          </div>
                          <button onClick={() => removeReplacement(r.id)} className="text-rose-400 p-1 hover:bg-rose-50 rounded-md transition-all">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={confirmOrder} className="w-full bg-indigo-600 text-white font-black py-2.5 rounded-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-[9px]">Confirm Order</button>
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-slate-50/30 scrollbar-hide">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1.5 mb-1.5 text-left">Orders for {orderShop?.name || 'Shop'}</p>
          {orderShop && orders.filter(o => o.shopId === orderShop.id).length > 0 ? (
            orders.filter(o => o.shopId === orderShop?.id).map(order => (
              <div key={order.id} onClick={() => setSelectedOrderForDetail(order)} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2.5 text-left active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{order.date}</span>
                    <h5 className="font-black text-slate-800 text-xs">Order #{order.id.slice(-5)}</h5>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadOrderPDF(order);
                        }}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <span className="text-xs font-black text-indigo-600 leading-none">৳{order.total}</span>
                    </div>
                    <p className="text-[7px] text-slate-400 font-bold">{order.items.length} items</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 space-y-1">
                   {order.items.slice(0, 3).map((it, idx) => (
                     <div key={idx} className="flex justify-between text-[9px] font-medium text-slate-600">
                       <span>{it.productName} x {it.quantity}</span>
                       <span>৳{calculateFinalPrice(it.price, it.discount) * it.quantity}</span>
                     </div>
                   ))}
                   {order.items.length > 3 && <p className="text-[8px] text-indigo-400 font-bold italic pt-0.5">+ {order.items.length - 3} more items</p>}
                </div>
              </div>
            ))
          ) : ( <div className="py-12 text-center text-slate-300 italic text-xs">No recent orders for this shop.</div> )}
        </div>
      )}
    </div>
  );
};
