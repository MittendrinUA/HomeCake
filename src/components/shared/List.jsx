import { useTranslation } from "react-i18next";
import React, { useState, useMemo, memo } from 'react';
import { Search, PackageOpen, Utensils, Layers } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const List = memo(function List({ items, costFn, onClick, emptyTxt, showPrice, showThumb }) {const { t } = useTranslation();
  const getUnit = (u) => {
    const map = { 'г': t('addRecipe.g', 'г'), 'кг': t('addRecipe.kg', 'кг'), 'шт': t('addRecipe.pcs', 'шт'), 'мл': t('addRecipe.ml', 'мл') };
    return map[u] || u;
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);

  const filteredAndSortedItems = useMemo(() => {
    return [...(items || [])]
      .filter((i) => (i?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [items, searchTerm]);

  useMemo(() => {
    setVisibleCount(50);
  }, [searchTerm]);

  return (
    <div className="pb-28">
      <div className="px-4 mb-4">
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3 flex items-center gap-3 shadow-inner">
          <Search size={18} className="text-[#8C7A7A]" />
          <input type="text" placeholder={t("auto.t_113", "Швидкий пошук...")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm" />
        </div>
      </div>

      {filteredAndSortedItems.length === 0 ?
      <EmptyState 
        icon={PackageOpen}
        title={emptyTxt}
        description="Почніть додавати елементи, щоб вони з'явилися тут."
        actionLabel="Додати"
        onAction={() => document.getElementById('global-add-btn')?.click()}
      /> :

      filteredAndSortedItems.slice(0, visibleCount).map((item) => {
        const hasFillings = item.fillings && item.fillings.length > 0;
        const baseCost = costFn(item);
        return (
          <div key={item.id} onClick={() => onClick(item)} className="flex items-center justify-between p-4 bg-[#1E1919] border border-[#2A2323] mb-3 mx-4 rounded-3xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-black/20">
              <div className="flex flex-1 items-center gap-4">
                {showThumb &&
              <div className="w-14 h-14 rounded-2xl bg-[#151212] border border-[#2A2323] shrink-0 bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none' }}>
                    {!item.imageUrl && <Utensils size={20} className="text-[#2A2323]" />}
                  </div>
              }
                <div className="pr-2">
                  <h3 className="text-[#F4EFEA] font-semibold text-[17px] tracking-tight leading-tight mb-1">{item.name}</h3>
                  {showPrice && item.defaultPrice > 0 && <p className="text-[#D4AF37] text-sm font-bold">{t("auto.t_114", "Прайс:")}{item.defaultPrice} ₴ / {item.baseYield || 1}{getUnit(item.unit || 'шт')}</p>}
                  {hasFillings && <p className="text-[#D4AF37]/70 text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-widest"><Layers size={10} /> {item.fillings.length}</p>}
                </div>
              </div>
              <div className="text-right shrink-0 bg-[#151212] px-3 py-2 rounded-xl border border-[#2A2323]">
                <p className="text-[#8C7A7A] text-[8px] uppercase font-bold tracking-widest">{t("auto.t_116", "Собівартість")}</p>
                <p className="text-[#F4EFEA] font-bold text-sm">{baseCost.toFixed(2)} ₴</p>
              </div>
            </div>);

      })
      }

      {visibleCount < filteredAndSortedItems.length && (
        <div className="px-4">
          <button 
            onClick={() => setVisibleCount(v => v + 50)}
            className="w-full py-4 mt-2 mb-4 bg-[#1E1919] border border-[#2A2323] text-[#8C7A7A] rounded-2xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg"
          >
            {t("auto.show_more", "Показати більше")} ({filteredAndSortedItems.length - visibleCount})
          </button>
        </div>
      )}
    </div>);

});

export default List;