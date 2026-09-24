import { useTranslation } from "react-i18next";import React, { useState, memo } from 'react';
import { Search, PackageOpen, Package, ChevronRight } from 'lucide-react';

const InventoryList = memo(function InventoryList({ inventory, onClick }) {const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredInventory = inventory.filter((i) => (i?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const getUnit = (u) => {
    const map = { 'г': t('addRecipe.g', 'г'), 'кг': t('addRecipe.kg', 'кг'), 'шт': t('addRecipe.pcs', 'шт'), 'мл': t('addRecipe.ml', 'мл') };
    return map[u] || u;
  };

  return (
    <div className="pb-28">
      <div className="px-4 mb-4">
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3 flex items-center gap-3 shadow-inner">
          <Search size={18} className="text-[#8C7A7A]" />
          <input type="text" placeholder={t("auto.t_49", "Пошук матеріалу...")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm" />
        </div>
      </div>
      
      {filteredInventory.length === 0 ?
      <div className="p-8 text-center flex flex-col items-center mt-4">
          <PackageOpen size={48} className="text-[#2A2323] mb-4" />
          <p className="text-[#8C7A7A] font-medium">{t("auto.t_50", "Нічого не знайдено.")}</p>
        </div> :

      [...filteredInventory].sort((a, b) => (a?.name || '').localeCompare(b?.name || '')).map((item) =>
      <div key={item.id} onClick={() => onClick(item)} className="flex items-center justify-between p-4 bg-[#1E1919] border border-[#2A2323] mb-3 mx-4 rounded-3xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-black/20 relative overflow-hidden">
            {item.isPrep && <div className="absolute top-0 right-0 bg-[#D4AF37]/20 text-[#D4AF37] text-[8px] uppercase font-bold px-3 py-1 rounded-bl-xl">{t("auto.t_51", "Заготівля")}</div>}
            {!item.isPrep && item.isMix && <div className="absolute top-0 right-0 bg-[#2AABEE]/20 text-[#2AABEE] text-[8px] uppercase font-bold px-3 py-1 rounded-bl-xl">{t("auto.t_52", "Мікс (Кошик)")}</div>}
            
            <div className="flex items-center gap-4 flex-1">
               <div className="w-14 h-14 rounded-2xl bg-[#151212] border border-[#2A2323] shrink-0 bg-cover bg-center flex items-center justify-center shadow-inner" style={{ backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none' }}>
                  {!item.imageUrl && <Package size={20} className="text-[#2A2323]" />}
               </div>
               <div className="flex-1 pr-2">
                 <h3 className="text-[#F4EFEA] font-bold text-[16px] leading-tight tracking-tight mb-1">{item.name}</h3>
                 <p className="text-[#8C7A7A] text-[11px] font-bold uppercase tracking-widest">{Number(item.price).toFixed(2)} ₴ / 1 {getUnit(item.unit)}</p>
               </div>
            </div>

            <div className="text-right flex items-center gap-3 shrink-0">
              <div className="text-right">
                 <p className={item.quantity <= 0 ? "text-red-400 font-black text-2xl" : "text-[#D4AF37] font-black text-2xl"}>{item.quantity}</p>
                 <p className="text-[#8C7A7A] text-[9px] uppercase font-bold tracking-widest">{getUnit(item.unit)}</p>
              </div>
              <ChevronRight size={20} className="text-[#8C7A7A]" />
            </div>
          </div>
      )
      }
    </div>);

});

export default InventoryList;