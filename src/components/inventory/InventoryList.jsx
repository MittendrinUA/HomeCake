import { useTranslation } from "react-i18next";
import React, { useState, useMemo, memo } from 'react';
import { Search, PackageOpen, Package, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../ui/EmptyState';
import useStore from '../../store/useStore';

const InventoryList = memo(function InventoryList({ inventory, onClick }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);

  const filteredInventory = useMemo(() => {
    return [...(inventory || [])]
      .filter((i) => (i?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [inventory, searchTerm]);

  // Скидаємо кількість видимих при пошуку
  useMemo(() => {
    setVisibleCount(50);
  }, [searchTerm]);

  const getUnit = (u) => {
    const map = { 'г': t('addRecipe.g', 'г'), 'кг': t('addRecipe.kg', 'кг'), 'шт': t('addRecipe.pcs', 'шт'), 'мл': t('addRecipe.ml', 'мл') };
    return map[u] || u;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-28">
      <div className="px-4 mb-5">
        <div className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[24px] p-4 flex items-center gap-3 shadow-lg focus-within:border-[#D4AF37]/50 transition-colors">
          <Search size={20} className="text-[#8C7A7A]" />
          <input type="text" placeholder={t("auto.t_49", "Пошук матеріалу...")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm font-medium" />
        </div>
      </div>
      
      {filteredInventory.length === 0 ?
        <EmptyState 
          icon={PackageOpen}
          title={searchTerm ? t("auto.t_50", "Нічого не знайдено.") : t("auto.t_50", "Склад порожній")}
          description={searchTerm ? "Спробуйте змінити пошуковий запит." : "Додайте перші інгредієнти або упаковку на склад."}
          actionLabel={searchTerm ? null : "Додати на склад"}
          onAction={searchTerm ? null : () => document.getElementById('global-add-btn')?.click()}
        /> :

        <div className="px-4 space-y-3">
          <AnimatePresence>
            {filteredInventory.slice(0, visibleCount).map((item, idx) => {
              const isLowStock = item.minThreshold > 0 && item.quantity < item.minThreshold;
              const isOutOfStock = item.quantity <= 0;

              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }} key={item.id} onClick={() => onClick(item)} className={`flex items-center justify-between p-4 bg-gradient-to-b from-[#1E1919] to-[#151212] border ${isLowStock ? 'border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 'border-[#2A2323]'} rounded-[24px] cursor-pointer active:scale-95 transition-all shadow-lg relative overflow-hidden`}>
                  {item.isPrep && <div className="absolute top-0 right-0 bg-[#D4AF37]/20 text-[#D4AF37] text-[8px] uppercase font-black px-3 py-1 rounded-bl-xl shadow-sm">{t("auto.t_51", "Заготівля")}</div>}
                  {!item.isPrep && item.isMix && <div className="absolute top-0 right-0 bg-[#2AABEE]/20 text-[#2AABEE] text-[8px] uppercase font-black px-3 py-1 rounded-bl-xl shadow-sm">{t("auto.t_52", "Мікс (Кошик)")}</div>}
                  
                  <div className="flex items-center gap-4 flex-1">

                    <div className="flex-1 pr-2">
                      <h3 className="text-[#F4EFEA] font-black text-base leading-tight tracking-tight mb-1 flex items-center gap-2">
                        {item.name}
                        {isLowStock && <AlertTriangle size={14} className="text-red-400" />}
                      </h3>
                      <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest">{Number(item.price).toFixed(2)} ₴ / 1 {getUnit(item.unit)}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3 shrink-0">
                    <div className="text-right">
                        <p className={`font-black text-2xl drop-shadow-sm ${isOutOfStock ? "text-red-500" : isLowStock ? "text-red-400" : "text-[#D4AF37]"}`}>{item.quantity}</p>
                        <p className={`text-[9px] uppercase font-bold tracking-widest ${isLowStock ? 'text-red-400' : 'text-[#8C7A7A]'}`}>{getUnit(item.unit)}</p>
                    </div>
                    <ChevronRight size={18} className="text-[#8C7A7A]" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visibleCount < filteredInventory.length && (
            <motion.button 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setVisibleCount(v => v + 50)}
              className="w-full py-4 mt-4 bg-[#1E1919] border border-[#2A2323] text-[#8C7A7A] rounded-2xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg"
            >
              {t("auto.show_more", "Показати більше")} ({filteredInventory.length - visibleCount})
            </motion.button>
          )}
        </div>
      }
    </motion.div>
  );
});

export default InventoryList;