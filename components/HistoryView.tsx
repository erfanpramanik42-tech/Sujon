
import React from 'react';
import { SalesRoute, Order } from '../types';

interface HistoryViewProps {
  historyTab: 'routes' | 'orders';
  setHistoryTab: (val: 'routes' | 'orders') => void;
  selectedOrderForDetail: Order | null;
  setSelectedOrderForDetail: (val: Order | null) => void;
  renderOrderDetail: (order: Order) => React.ReactNode;
  activeRoutes: SalesRoute[];
  setViewingRoute: (route: SalesRoute) => void;
  deleteRoute: (id: string, e: React.MouseEvent) => void;
  orders: Order[];
  t: (key: string) => string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyTab,
  setHistoryTab,
  selectedOrderForDetail,
  setSelectedOrderForDetail,
  renderOrderDetail,
  activeRoutes,
  setViewingRoute,
  deleteRoute,
  orders,
  t
}) => {
  return (
    <div className="h-full flex flex-col relative animate-fadeIn pb-24 overflow-hidden">
      <div className="flex bg-slate-200/50 p-1 rounded-xl w-full max-w-[280px] mx-auto mb-3 shrink-0">
        <button 
          onClick={() => { setHistoryTab('routes'); setSelectedOrderForDetail(null); }} 
          className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${historyTab === 'routes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
        >
          Routes
        </button>
        <button 
          onClick={() => { setHistoryTab('orders'); setSelectedOrderForDetail(null); }} 
          className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${historyTab === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
        >
          Orders
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {selectedOrderForDetail ? (
          <div className="animate-fadeIn p-3">
            <button onClick={() => setSelectedOrderForDetail(null)} className="mb-3 flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase bg-white px-4 py-2 rounded-full border border-indigo-100 shadow-sm transition-all active:scale-95">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M15 19l-7-7 7-7" /></svg> Back to List
            </button>
            {renderOrderDetail(selectedOrderForDetail)}
          </div>
        ) : historyTab === 'routes' ? (
          <div className="space-y-2 pb-6">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5 px-4 text-left text-xs">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('history')}
            </h4>
            <div className="px-4 space-y-2">
              {activeRoutes.length > 0 ? activeRoutes.map(route => (
                <div key={route.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-all active:scale-[0.98]" onClick={() => setViewingRoute(route)}>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col flex-1 text-left">
                      <span className="text-xs font-black text-slate-800 leading-tight">{route.customAreaName || 'Trip'}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{route.day ? `${route.day}, ` : ''}{route.date}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="flex gap-1">
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">{route.path.length} Pts</span>
                        <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">{route.stops?.length || 0} Stops</span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => deleteRoute(route.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )) : <div className="py-12 text-center text-slate-400 text-xs">No route history yet.</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-2 pb-6">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5 px-4 text-left text-xs">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              Recent Orders
            </h4>
            <div className="px-4 space-y-2">
              {orders.length > 0 ? orders.map(order => (
                <div key={order.id} onClick={() => setSelectedOrderForDetail(order)} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer transition-all active:scale-[0.98]">
                  <div className="text-left">
                    <p className="text-[9px] font-black text-indigo-400 leading-none mb-0.5">{order.date}</p>
                    <h5 className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">{order.shopName}</h5>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 leading-none mb-0.5">৳{order.total}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase">#{order.id.slice(-5).toUpperCase()}</p>
                  </div>
                </div>
              )) : <div className="py-12 text-center text-slate-400 text-xs">No orders placed yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
