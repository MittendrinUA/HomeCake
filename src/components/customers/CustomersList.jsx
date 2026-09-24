import { useTranslation } from "react-i18next";import React, { useState, memo } from 'react';
import { Search, Users, ChevronRight } from 'lucide-react';

const CustomersList = memo(function CustomersList({ customers, sales, onClick }) {const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const enhancedCustomers = React.useMemo(() => customers.map((c) => {
    const safeName = c?.name ? String(c.name) : 'Без імені';
    const cSales = sales.filter((s) => s.customer?.toString().toLowerCase().trim() === safeName.toLowerCase().trim());
    const orderCount = cSales.length;
    const totalSpent = cSales.reduce((sum, s) => {
      const itemsList = s.items || [{ sellPrice: s.sellPrice }];
      return sum + itemsList.reduce((acc, i) => acc + (i.sellPrice || 0), 0) + (s.decorPrice || 0);
    }, 0);
    return { ...c, name: safeName, orderCount, totalSpent };
  }), [customers, sales]);

  const filtered = enhancedCustomers.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="pb-28">
      <div className="px-4 mb-4">
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3 flex items-center gap-3 shadow-inner">
          <Search size={18} className="text-[#8C7A7A]" />
          <input type="text" placeholder={t("auto.t_18", "Пошук клієнта...")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm" />
        </div>
      </div>
      
      {filtered.length === 0 ?
      <div className="p-8 text-center flex flex-col items-center mt-4">
          <Users size={48} className="text-[#2A2323] mb-4" />
          <p className="text-[#8C7A7A] font-medium">{t("auto.t_19", "Клієнтів не знайдено.")}</p>
        </div> :

      [...filtered].sort((a, b) => b.totalSpent - a.totalSpent).map((c) =>
      <div key={c.id} onClick={() => onClick(c)} className="flex items-center justify-between p-4 bg-[#1E1919] border border-[#2A2323] mb-3 mx-4 rounded-3xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center gap-4 flex-1">
               <div className="w-12 h-12 rounded-full bg-[#151212] border border-[#D4AF37]/30 flex items-center justify-center shadow-inner shrink-0">
                  <span className="text-[#D4AF37] font-bold text-lg">{c.name.charAt(0).toUpperCase()}</span>
               </div>
               <div className="flex-1 overflow-hidden">
                 <h3 className="text-[#F4EFEA] font-bold text-base leading-tight mb-0.5 truncate">{c.name}</h3>
                 <p className="text-[#8C7A7A] text-[10px] uppercase tracking-widest">{c.orderCount || 0}{t("auto.t_20", "замовлень")}</p>
               </div>
            </div>
            <div className="text-right flex items-center gap-3 shrink-0 pl-2">
              <p className="text-[#D4AF37] font-black text-lg">{(c.totalSpent || 0).toFixed(0)} ₴</p>
              <ChevronRight size={20} className="text-[#8C7A7A]" />
            </div>
          </div>
      )
      }
    </div>);

});

export default CustomersList;