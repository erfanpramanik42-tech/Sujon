
import React, { useMemo, useState } from 'react';
import { Order, Shop, Visit, Area, Product } from '../types';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  MapPin, 
  PieChart, 
  ArrowLeft, 
  Calendar,
  DollarSign,
  Target,
  ChevronRight
} from 'lucide-react';

interface VisualAnalyticsProps {
  orders: Order[];
  shops: Shop[];
  visits: Visit[];
  areas: Area[];
  products: Product[];
  onClose: () => void;
  lang: 'en' | 'bn';
}

type TimePeriod = 'Today' | 'Week' | 'Month' | 'All';

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
  const [period, setPeriod] = useState<TimePeriod>('All');

  // --- Logic: Time Filtering ---
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    return orders.filter(order => {
      if (period === 'All') return true;
      if (period === 'Today') {
        const today = new Date().toISOString().split('T')[0];
        return order.date === today;
      }
      if (period === 'Week') return (now - order.timestamp) < (7 * dayMs);
      if (period === 'Month') return (now - order.timestamp) < (30 * dayMs);
      return true;
    });
  }, [orders, period]);

  const filteredVisits = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return visits.filter(v => {
      if (period === 'All') return true;
      if (period === 'Today') {
        const today = new Date().toISOString().split('T')[0];
        return v.date === today;
      }
      if (period === 'Week') return (now - v.timestamp) < (7 * dayMs);
      if (period === 'Month') return (now - v.timestamp) < (30 * dayMs);
      return true;
    });
  }, [visits, period]);

  // --- Logic: Sales by Area ---
  const salesByArea = useMemo(() => {
    const areaTotals: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const shop = shops.find(s => s.id === order.shopId);
      if (shop) {
        const area = areas.find(a => a.id === shop.areaId);
        const areaName = area?.name || 'Other';
        areaTotals[areaName] = (areaTotals[areaName] || 0) + order.total;
      }
    });
    return Object.entries(areaTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [filteredOrders, shops, areas]);

  const maxSales = Math.max(...salesByArea.map(a => a.total), 1);

  // --- Logic: Visit Efficiency ---
  const visitedCount = filteredVisits.length;
  const totalShops = shops.length || 1;
  const visitRate = Math.min(100, Math.round((visitedCount / totalShops) * 100));

  // --- Logic: Category Distribution ---
  const categoryStats = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'General';
        cats[cat] = (cats[cat] || 0) + item.quantity;
      });
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [filteredOrders, products]);

  const totalRevenue = filteredOrders.reduce((acc, o) => acc + o.total, 0);
  const avgOrder = filteredOrders.length ? Math.round(totalRevenue / filteredOrders.length) : 0;

  return (
    <div className="fixed inset-0 z-[4500] bg-slate-50 flex flex-col animate-fadeIn overflow-hidden">
      <header className="bg-white border-b border-slate-100 p-4 flex items-center gap-4 shrink-0">
        <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all active:scale-90">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{isEn ? 'Performance' : 'পারফরম্যান্স'}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{isEn ? 'Sales & Insights' : 'বিক্রয় ও বিশ্লেষণ'}</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['Today', 'Week', 'All'] as TimePeriod[]).map(p => (
            <button 
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 scrollbar-hide">
        {/* Bento Grid: Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-100 text-white flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/10 rounded-xl"><DollarSign className="w-4 h-4" /></div>
              <TrendingUp className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest mb-0.5">{isEn ? 'Revenue' : 'মোট আয়'}</p>
              <p className="text-xl font-black">৳{totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShoppingBag className="w-4 h-4" /></div>
              <span className="text-[10px] font-black text-emerald-500">+{filteredOrders.length}</span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{isEn ? 'Orders' : 'অর্ডার'}</p>
              <p className="text-xl font-black text-slate-800">{filteredOrders.length}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{isEn ? 'Visits' : 'ভিজিট'}</p>
              <p className="text-xl font-black text-slate-800">{visitedCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Target className="w-4 h-4" /></div>
              <span className="text-[10px] font-black text-rose-500">{visitRate}%</span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{isEn ? 'Efficiency' : 'দক্ষতা'}</p>
              <p className="text-xl font-black text-slate-800">{visitRate}%</p>
            </div>
          </div>
        </div>

        {/* Sales by Area: Compact List */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              {isEn ? 'Top Areas' : 'সেরা এলাকা'}
            </h4>
            <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">By Revenue</span>
          </div>
          
          {salesByArea.length > 0 ? (
            <div className="space-y-3">
              {salesByArea.map((area, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>{area.name}</span>
                      <span>৳{area.total.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(area.total / maxSales) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-300 italic text-[10px]">{isEn ? 'No data' : 'তথ্য নেই'}</div>
          )}
        </div>

        {/* Category Share & Average Order */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 bg-slate-900 text-white p-5 rounded-[2.5rem] shadow-xl">
            <h4 className="font-black text-white/90 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5 text-emerald-400" />
              {isEn ? 'Categories' : 'ক্যাটাগরি'}
            </h4>
            {categoryStats.length > 0 ? (
              <div className="space-y-3">
                {categoryStats.map(([name, qty], idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="truncate pr-2">{name}</span>
                      <span className="text-emerald-400">{qty}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full">
                      <div 
                        className="h-full bg-emerald-400 rounded-full" 
                        style={{ width: `${(qty / categoryStats[0][1]) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] opacity-40 italic">{isEn ? 'No data' : 'তথ্য নেই'}</p>
            )}
          </div>

          <div className="col-span-2 bg-indigo-50 p-5 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-center items-center text-center">
            <div className="p-2 bg-white rounded-2xl shadow-sm mb-2"><Calendar className="w-4 h-4 text-indigo-600" /></div>
            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{isEn ? 'Avg Order' : 'গড় অর্ডার'}</p>
            <p className="text-sm font-black text-indigo-700 leading-none">৳{avgOrder}</p>
          </div>
        </div>

        {/* Bottom Action */}
        <button onClick={onClose} className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
          {isEn ? 'Back to Dashboard' : 'ড্যাশবোর্ডে ফিরে যান'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
