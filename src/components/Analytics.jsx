import useStore from '../store/useStore';
import React, { useState, useMemo } from 'react';
import { BarChart2, Package, Star, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function Analytics({ sales, recipes, inventory, costFn, customers, waste, onCustomerClick }) {
  const currency = useStore(s => s.settings?.currency || 'грн');
  const { t } = useTranslation();
  const [period, setPeriod] = useState('all');
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const { filteredSales, filteredWaste, tr, tc, customerStats, totalWasteLoss, p, m, iv, topC } = useMemo(() => {
    const fSales = sales.filter(s => {
      if (s.status === 'planned') return false; 
      if (period === 'all') return true;
      const sDate = new Date(s.date || s.createdAt); 
      if (period === 'month') return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
      if (period === 'year') return sDate.getFullYear() === currentYear;
      if (period === 'lastYear') return sDate.getFullYear() === currentYear - 1;
      return true;
    });

    const fWaste = waste.filter(w => {
      if (period === 'all') return true;
      const wDate = new Date(w.date);
      if (period === 'month') return wDate.getMonth() === currentMonth && wDate.getFullYear() === currentYear;
      if (period === 'year') return wDate.getFullYear() === currentYear;
      if (period === 'lastYear') return wDate.getFullYear() === currentYear - 1;
      return true;
    });

    let localTr = 0, localTc = 0; 
    const cStats = {};

    fSales.forEach(o => { 
      let saleRev = o.decorPrice || 0;
      let dynamicSaleCost = (o.decorPrice || 0) + (o.internalCost || 0);
      
      const is = o.items || [{ recipeId: o.recipeId, fillingId: o.fillingId, quantity: o.quantity, sellPrice: o.sellPrice }]; 
      
      is.forEach(i => { 
        saleRev += (i.sellPrice || 0); 
        const r = recipes.find(rec => rec.id === i.recipeId); 
        if (r) { dynamicSaleCost += (costFn(r, i.fillingId) / Math.max(r.baseYield || 1, 0.001)) * i.quantity; } 
      }); 

      localTr += saleRev;
      localTc += o.historicalCost !== undefined ? o.historicalCost : dynamicSaleCost;

      if (o.customer) {
        const cName = o.customer.trim();
        if (!cStats[cName]) cStats[cName] = { name: cName, spent: 0, count: 0 };
        cStats[cName].spent += saleRev;
        cStats[cName].count += 1;
      }
    });

    const tWL = fWaste.reduce((sum, w) => sum + (w.lossAmount || 0), 0);
    const localP = localTr - localTc - tWL;
    const localM = localTr > 0 ? ((localP / localTr) * 100).toFixed(1) : 0;
    const localIv = inventory.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 0)), 0);
    const topClients = Object.values(cStats).sort((a,b) => b.spent - a.spent).slice(0, 5);

    return {
      filteredSales: fSales,
      filteredWaste: fWaste,
      tr: localTr,
      tc: localTc,
      customerStats: cStats,
      totalWasteLoss: tWL,
      p: localP,
      m: localM,
      iv: localIv,
      topC: topClients
    };
  }, [sales, waste, recipes, inventory, period, currentMonth, currentYear, costFn]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 pb-28 space-y-6">
      
      <div className="flex bg-[#1E1919] border border-[#2A2323] rounded-3xl p-1.5 shadow-sm overflow-x-auto custom-scrollbar">
        <button onClick={() => setPeriod('month')} className={`flex-1 min-w-[80px] py-3 text-[10px] uppercase tracking-widest font-bold rounded-[20px] transition-all ${period === 'month' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A] hover:text-[#F4EFEA]'}`}>{t('analytics.month', 'МІСЯЦЬ')}</button>
        <button onClick={() => setPeriod('year')} className={`flex-1 min-w-[80px] py-3 text-[10px] uppercase tracking-widest font-bold rounded-[20px] transition-all ${period === 'year' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A] hover:text-[#F4EFEA]'}`}>{currentYear} {t('analytics.year', 'РІК')}</button>
        <button onClick={() => setPeriod('lastYear')} className={`flex-1 min-w-[80px] py-3 text-[10px] uppercase tracking-widest font-bold rounded-[20px] transition-all ${period === 'lastYear' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A] hover:text-[#F4EFEA]'}`}>{currentYear - 1} {t('analytics.year', 'РІК')}</button>
        <button onClick={() => setPeriod('all')} className={`flex-1 min-w-[80px] py-3 text-[10px] uppercase tracking-widest font-bold rounded-[20px] transition-all ${period === 'all' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A] hover:text-[#F4EFEA]'}`}>{t('analytics.allTime', 'ВЕСЬ ЧАС')}</button>
      </div>

      <div>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-[#F4EFEA] text-[18px] font-black tracking-tight">{t('analytics.finance', 'Фінанси (Видано)')}</h2>
          <span className="text-[#8C7A7A] text-[11px] font-medium">{filteredSales.length} {t('analytics.ordersCount', 'замовлень')}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#1A1616] border border-[#2A2323] p-5 rounded-[24px] shadow-lg">
            <p className="text-[#8C7A7A] text-[9px] uppercase tracking-widest font-bold mb-1.5">{t('analytics.revenue', 'ВИРУЧКА')}</p>
            <p className="text-[#F4EFEA] text-[22px] font-black">{tr.toFixed(2)} <span className="text-sm font-bold text-[#8C7A7A]">{currency}</span></p>
          </div>
          <div className="bg-[#1A1616] border border-[#2A2323] p-5 rounded-[24px] shadow-lg">
            <p className="text-[#8C7A7A] text-[9px] uppercase tracking-widest font-bold mb-1.5">{t('analytics.cost', 'СОБІВАРТІСТЬ')}</p>
            <p className="text-[#F4EFEA] text-[22px] font-black">{tc.toFixed(2)} <span className="text-sm font-bold text-[#8C7A7A]">{currency}</span></p>
          </div>
        </div>

        <div className="bg-[#1A1616] border border-[#D4AF37]/30 p-6 rounded-[32px] shadow-[0_0_30px_rgba(212,175,55,0.05)] relative overflow-hidden">
          <div className="absolute right-6 top-6 flex gap-1.5 opacity-20">
             <div className="w-2.5 h-10 bg-[#D4AF37] rounded-full"></div>
             <div className="w-2.5 h-16 bg-[#D4AF37] rounded-full"></div>
          </div>
          
          <p className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-1">{t('analytics.netProfit', 'ЧИСТИЙ ПРИБУТОК')}</p>
          <p className="text-[#F4EFEA] text-[34px] font-black tracking-tight mb-8">{p.toFixed(2)} <span className="text-xl font-bold text-[#8C7A7A]">{currency}</span></p>
          
          <div className="w-full h-1.5 bg-[#151212] rounded-full overflow-hidden mb-3 border border-[#2A2323]">
             <div className="h-full bg-[#D4AF37] rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.max(0, Math.min(100, m))}%` }}></div>
          </div>
          
          <div className="flex justify-between items-center">
             <p className="text-[#8C7A7A] text-[11px] font-medium tracking-wide">{t('analytics.margin', 'Рентабельність (маржа)')}</p>
             <p className="text-[#D4AF37] text-xs font-black">{m}%</p>
          </div>

          {totalWasteLoss > 0 && (
            <div className="border-t border-[#2A2323] pt-4 mt-4 flex justify-between items-center">
               <p className="text-red-400/80 text-[10px] uppercase tracking-widest font-bold">{t('analytics.wasteLoss', 'ВТРАТИ НА БРАК')}</p>
               <p className="text-red-400 font-bold text-sm">-{totalWasteLoss.toFixed(2)} {currency}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-[#F4EFEA] text-[18px] font-black mb-4 tracking-tight">{t('analytics.inventoryAssets', 'Активи складу (Поточні)')}</h2>
        <div className="bg-[#1A1616] border border-[#2A2323] p-6 rounded-[32px] shadow-lg flex items-center justify-between">
          <div>
             <p className="text-[#8C7A7A] text-[9px] uppercase tracking-widest font-bold mb-1.5">{t('analytics.moneyInGoods', 'ГРОШЕЙ У ТОВАРІ')}</p>
             <p className="text-[#D4AF37] text-[28px] font-black">{iv.toFixed(2)} <span className="text-[16px] text-[#8C7A7A]">{currency}</span></p>
          </div>
          <div className="bg-[#151212] p-4 rounded-2xl border border-[#2A2323]"><Package size={24} className="text-[#8C7A7A]" /></div>
        </div>
      </div>

      {topC.length > 0 && (
        <div>
          <h2 className="text-[#F4EFEA] text-[18px] font-black mb-4 tracking-tight flex items-center gap-2"><Star size={20} className="text-[#D4AF37]"/> {t('analytics.topClients', 'Топ Клієнти (за обраний час)')}</h2>
          <div className="bg-[#1A1616] border border-[#2A2323] rounded-[32px] shadow-lg overflow-hidden">
            {topC.map((c, idx) => (
              <div 
                key={c.name} 
                onClick={() => onCustomerClick && onCustomerClick(c.name)}
                className={`p-5 flex items-center justify-between cursor-pointer active:bg-[#151212] transition-colors ${idx!==0?'border-t border-[#2A2323]':''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-black text-xs ${idx === 0 ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-[#151212] border-[#2A2323] text-[#8C7A7A]'}`}>{idx+1}</div>
                  <div>
                    <p className="text-[#F4EFEA] font-bold text-[15px] leading-tight mb-0.5">{c.name}</p>
                    <p className="text-[#8C7A7A] text-[9px] uppercase tracking-widest font-bold">{c.count} {t('analytics.ordersLabel', 'ЗАМОВЛЕНЬ')}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                   <p className="text-[#D4AF37] font-black text-[15px]">{c.spent.toFixed(2)} <span className="text-[#8C7A7A] text-xs">{currency}</span></p>
                   <ChevronRight size={18} className="text-[#8C7A7A]/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
