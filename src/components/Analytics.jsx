import React, { useState } from 'react';
import { BarChart2, Package, Star, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Analytics({ sales, recipes, inventory, costFn, customers, waste, onCustomerClick }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('month');
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredSales = sales.filter(s => {
    if (s.status === 'planned') return false; 
    if (period === 'all') return true;
    const sDate = new Date(s.date || s.createdAt); 
    if (period === 'month') return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
    if (period === 'year') return sDate.getFullYear() === currentYear;
    if (period === 'lastYear') return sDate.getFullYear() === currentYear - 1;
    return true;
  });

  const filteredWaste = waste.filter(w => {
    if (period === 'all') return true;
    const wDate = new Date(w.date);
    if (period === 'month') return wDate.getMonth() === currentMonth && wDate.getFullYear() === currentYear;
    if (period === 'year') return wDate.getFullYear() === currentYear;
    if (period === 'lastYear') return wDate.getFullYear() === currentYear - 1;
    return true;
  });

  let tr = 0, tc = 0; 
  const customerStats = {};

  filteredSales.forEach(o => { 
    let saleRev = o.decorPrice || 0;
    let dynamicSaleCost = (o.decorPrice || 0) + (o.internalCost || 0);
    
    const is = o.items || [{ recipeId: o.recipeId, fillingId: o.fillingId, quantity: o.quantity, sellPrice: o.sellPrice }]; 
    
    is.forEach(i => { 
      saleRev += (i.sellPrice || 0); 
      const r = recipes.find(r => r.id === i.recipeId); 
      if (r) { dynamicSaleCost += (costFn(r, i.fillingId) / Math.max(r.baseYield || 1, 0.001)) * i.quantity; } 
    }); 

    tr += saleRev;
    tc += o.historicalCost !== undefined ? o.historicalCost : dynamicSaleCost;

    if (o.customer) {
      const cName = o.customer.trim();
      if (!customerStats[cName]) customerStats[cName] = { name: cName, spent: 0, count: 0 };
      customerStats[cName].spent += saleRev;
      customerStats[cName].count += 1;
    }
  });

  const totalWasteLoss = filteredWaste.reduce((sum, w) => sum + (w.lossAmount || 0), 0);
  const p = tr - tc - totalWasteLoss;
  const m = tr > 0 ? ((p / tr) * 100).toFixed(1) : 0;
  const iv = inventory.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 0)), 0);
  const topC = Object.values(customerStats).sort((a,b) => b.spent - a.spent).slice(0, 5);

  return (
    <div className="p-4 pb-28">
      <div className="flex bg-[#1E1919] border border-[#2A2323] rounded-[20px] p-1.5 mb-6 shadow-sm overflow-x-auto custom-scrollbar">
        <button onClick={() => setPeriod('month')} className={`flex-1 min-w-[80px] py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${period === 'month' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>{t('analytics.month')}</button>
        <button onClick={() => setPeriod('year')} className={`flex-1 min-w-[80px] py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${period === 'year' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>{currentYear}{t('analytics.year')}</button>
        <button onClick={() => setPeriod('lastYear')} className={`flex-1 min-w-[80px] py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${period === 'lastYear' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>{currentYear - 1}{t('analytics.year')}</button>
        <button onClick={() => setPeriod('all')} className={`flex-1 min-w-[80px] py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${period === 'all' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>{t('analytics.allTime')}</button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#F4EFEA] text-xl font-bold tracking-wide">{t('analytics.finance')}</h2>
        <span className="text-[#8C7A7A] text-xs font-medium">{filteredSales.length} {t('analytics.ordersCount')}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#1E1919] border border-[#2A2323] p-5 rounded-[24px] shadow-lg">
          <p className="text-[#8C7A7A] text-[10px] uppercase tracking-widest font-bold mb-1">{t('analytics.revenue')}</p>
          <p className="text-[#F4EFEA] text-2xl font-bold">{tr.toFixed(2)} ₴</p>
        </div>
        <div className="bg-[#1E1919] border border-[#2A2323] p-5 rounded-[24px] shadow-lg">
          <p className="text-[#8C7A7A] text-[10px] uppercase tracking-widest font-bold mb-1">{t('analytics.cost')}</p>
          <p className="text-[#F4EFEA] text-2xl font-bold">{tc.toFixed(2)} ₴</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#151212] border border-[#D4AF37]/30 p-6 rounded-[32px] mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4"><BarChart2 size={120} /></div>
        <p className="text-[#D4AF37] text-xs uppercase font-bold tracking-widest mb-1">{t('analytics.netProfit')}</p>
        <p className="text-[#F4EFEA] text-4xl font-black mb-4">{p.toFixed(2)} ₴</p>
        
        <div className="w-full h-2 bg-[#1E1919] rounded-full overflow-hidden mb-2 border border-[#2A2323]">
           <div className="h-full bg-[#D4AF37] rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(100, m))}%` }}></div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
           <p className="text-[#8C7A7A] text-xs font-medium tracking-wide">{t('analytics.margin')}</p>
           <p className="text-[#D4AF37] text-sm font-bold">{m}%</p>
        </div>

        {totalWasteLoss > 0 && (
          <div className="border-t border-[#D4AF37]/20 pt-3 mt-1 flex justify-between items-center">
             <p className="text-red-400/80 text-[10px] uppercase tracking-widest font-bold">{t('analytics.wasteLoss')}</p>
             <p className="text-red-400 font-bold text-sm">-{totalWasteLoss.toFixed(2)} ₴</p>
          </div>
        )}
      </div>

      <h2 className="text-[#F4EFEA] text-xl font-bold mb-4 tracking-wide">{t('analytics.inventoryAssets')}</h2>
      <div className="bg-[#1E1919] border border-[#2A2323] p-6 rounded-[32px] shadow-lg mb-8 flex items-center justify-between">
        <div>
           <p className="text-[#8C7A7A] text-[10px] uppercase tracking-widest font-bold mb-1">{t('analytics.moneyInGoods')}</p>
           <p className="text-[#D4AF37] text-3xl font-black">{iv.toFixed(2)} <span className="text-xl text-[#8C7A7A]">₴</span></p>
        </div>
        <div className="bg-[#151212] p-3 rounded-2xl border border-[#2A2323]"><Package size={24} className="text-[#8C7A7A]" /></div>
      </div>

      {topC.length > 0 && (
        <>
          <h2 className="text-[#F4EFEA] text-xl font-bold mb-4 tracking-wide flex items-center gap-2"><Star size={20} className="text-[#D4AF37]"/> {t('analytics.topClients')}</h2>
          <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] shadow-lg overflow-hidden">
            {topC.map((c, idx) => (
              <div 
                key={c.name} 
                onClick={() => onCustomerClick && onCustomerClick(c.name)}
                className={`p-4 flex items-center justify-between cursor-pointer active:bg-[#151212] transition-colors ${idx!==0?'border-t border-[#2A2323]':''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#151212] w-8 h-8 rounded-full flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37] font-bold text-xs">{idx+1}</div>
                  <div>
                    <p className="text-[#F4EFEA] font-bold text-sm leading-tight">{c.name}</p>
                    <p className="text-[#8C7A7A] text-[10px] uppercase tracking-widest">{c.count} {t('analytics.ordersLabel')}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                   <p className="text-[#D4AF37] font-black">{c.spent.toFixed(2)} ₴</p>
                   <ChevronRight size={18} className="text-[#8C7A7A]" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}