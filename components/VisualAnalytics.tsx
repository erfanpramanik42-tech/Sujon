
import React, { useMemo } from 'react';
import { Order, Shop, Visit, Area, Product } from '../types';

interface VisualAnalyticsProps {
  orders: Order[];
  shops: Shop[];
  visits: Visit[];
  areas: Area[];
  products: Product[];
  onClose: () => void;
  lang: 'en' | 'bn';
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({
  orders,
  shops,
  visits,
  areas,
  products,
  onClose,
  lang
}) => {
  const isEn = lang === 'en';

  // --- Logic: Sales by Area ---
  const salesByArea = useMemo(() => {
    const areaTotals: Record<string, number> = {};
    orders.forEach(order => {
      const shop = shops.find(s => s.id === order.shopId);
      if (shop) {
        const area = areas.find(a => a.id === shop.areaId);
        const areaName = area?.name || 'Other';
        areaTotals[areaName] = (areaTotals[areaName] || 0) + order.total;
      }
    });
    return Object.entries(areaTotals).map(([name, total]) => ({ name, total }));
  }, [orders, shops, areas]);

  const maxSales = Math.max(...salesByArea.map(a => a.total), 1);

  // --- Logic: Visit Status ---
  const todayIso = new Date().toISOString().split('T')[0];
  const visitedCount = visits.filter(v => v.date === todayIso).length;
  const totalShops = shops.length || 1;
  const visitRate = Math.round((visitedCount / totalShops) * 100);

  // --- Logic: Category Distribution ---
  const categoryStats = useMemo(() => {
    const cats: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'General';
        cats[cat] = (cats[cat] || 0) + item.quantity;
      });
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders, products]);

  return (
    <div className="fixed inset-0 z-[4500] bg-slate-50 flex flex-col animate-fadeIn overflow-hidden">
      <header className="bg-indigo-700 text-white p-4 shadow-lg flex items-center gap-4 shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h3 className="text-lg font-black uppercase tracking-tight">{isEn ? 'Visual Reports' : 'ভিজ্যুয়াল রিপোর্ট'}</h3>
          <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">{isEn ? 'Sales & Performance Insights' : 'বিক্রয় ও পারফরম্যান্স বিশ্লেষণ'}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 scrollbar-hide">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Total Revenue' : 'মোট আয়'}</p>
            <p className="text-2xl font-black text-indigo-600">৳{orders.reduce((acc, o) => acc + o.total, 0)}</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Avg Order' : 'গড় অর্ডার'}</p>
            <p className="text-2xl font-black text-emerald-600">৳{orders.length ? Math.round(orders.reduce((acc, o) => acc + o.total, 0) / orders.length) : 0}</p>
          </div>
        </div>

        {/* Visit Efficiency Donut */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeDasharray="100, 100" strokeWidth="3.5" stroke="currentColor" fill="transparent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-indigo-600" strokeDasharray={`${visitRate}, 100`} strokeLinecap="round" strokeWidth="3.5" stroke="currentColor" fill="transparent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.5" className="font-black text-[8px]" textAnchor="middle" fill="#1e293b">{visitRate}%</text>
            </svg>
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm mb-1">{isEn ? 'Visit Efficiency' : 'ভিজিট দক্ষতা'}</h4>
            <p className="text-xs text-slate-500 leading-tight">
              {isEn ? `You have visited ${visitedCount} out of ${totalShops} shops today.` : `আপনি আজ ${totalShops}টি দোকানের মধ্যে ${visitedCount}টি ভিজিট করেছেন।`}
            </p>
          </div>
        </div>

        {/* Sales by Area Bar Chart */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{isEn ? 'Sales by Area' : 'এলাকা ভিত্তিক বিক্রয়'}</h4>
          {salesByArea.length > 0 ? (
            <div className="space-y-4">
              {salesByArea.map((area, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span className="truncate pr-2">{area.name}</span>
                    <span className="text-indigo-600">৳{area.total}</span>
                  </div>
                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(area.total / maxSales) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-300 italic text-xs">{isEn ? 'No sales data to visualize' : 'দেখানোর মতো কোনো বিক্রয় ডাটা নেই'}</div>
          )}
        </div>

        {/* Category Share */}
        <div className="bg-indigo-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h4 className="font-black text-white/90 text-sm uppercase tracking-widest">{isEn ? 'Top Categories' : 'সেরা ক্যাটাগরি'}</h4>
            {categoryStats.length > 0 ? (
              <div className="space-y-3">
                {categoryStats.map(([name, qty], idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black text-xs">{idx + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>{name}</span>
                        <span className="opacity-60">{qty} items</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full">
                        <div 
                          className="h-full bg-emerald-400 rounded-full" 
                          style={{ width: `${(qty / categoryStats[0][1]) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs opacity-50 italic">{isEn ? 'Take orders to see category insights' : 'ক্যাটাগরি ভিত্তিক তথ্য দেখতে অর্ডার নিন'}</p>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
        </div>
      </div>
    </div>
  );
};
