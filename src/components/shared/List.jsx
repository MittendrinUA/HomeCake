import { useTranslation } from "react-i18next";import React, { useState, memo } from 'react';
import { Search, PackageOpen, Utensils, Layers } from 'lucide-react';

const List = memo(function List({ items, costFn, onClick, emptyTxt, showPrice, showThumb }) {const { t } = useTranslation();
  const getUnit = (u) => {
    const map = { 'г': t('addRecipe.g', 'г'), 'кг': t('addRecipe.kg', 'кг'), 'шт': t('addRecipe.pcs', 'шт'), 'мл': t('addRecipe.ml', 'мл') };
    return map[u] || u;
  };
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems = items.filter((i) => (i?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="pb-28">
      <div className="px-4 mb-4">
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3 flex items-center gap-3 shadow-inner">
          <Search size={18} className="text-[#8C7A7A]" />
          <input type="text" placeholder={t("auto.t_113", "Швидкий пошук...")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm" />
        </div>
      </div>

      {filteredItems.length === 0 ?
      <div className="p-8 text-center flex flex-col items-center mt-4">
          <PackageOpen size={48} className="text-[#2A2323] mb-4" />
          <p className="text-[#8C7A7A] font-medium">{emptyTxt}</p>
        </div> :

      [...filteredItems].sort((a, b) => (a?.name || '').localeCompare(b?.name || '')).map((item) => {
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
                  {hasFillings && <p className="text-[#D4AF37]/70 text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-widest"><Layers size={10} /> {item.fillings.length}{t("auto.t_115", "варіантів")}</p>}
                </div>
              </div>
              <div className="text-right shrink-0 bg-[#151212] px-3 py-2 rounded-xl border border-[#2A2323]">
                <p className="text-[#8C7A7A] text-[8px] uppercase font-bold tracking-widest">{t("auto.t_116", "Собівартість")}</p>
                <p className="text-[#F4EFEA] font-bold text-sm">{baseCost.toFixed(2)} ₴</p>
              </div>
            </div>);

      })
      }
    </div>);

});

export default List;