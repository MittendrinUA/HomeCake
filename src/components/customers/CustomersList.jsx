import { useTranslation } from "react-i18next";
import React, { useState, memo } from 'react';
import { Search, Users, ChevronRight } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const CustomersList = memo(function CustomersList({ customers, sales, onClick }) {
  const { t } = useTranslation();
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
    <div className="pb-28 pt-4">
      <div className="px-5 mb-6">
        <div className="bg-[#1A1616] border border-[#2A2323] rounded-[20px] p-3.5 flex items-center gap-3 shadow-inner">
          <Search size={18} className="text-[#8C7A7A]" />
          <input 
            type="text" 
            placeholder={t("auto.t_18", "Пошук клієнта...")} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-[15px]" 
          />
        </div>
      </div>
      
      {filtered.length === 0 ? (
        <EmptyState 
          icon={Users}
          title={searchTerm ? t("auto.t_19", "Клієнтів не знайдено.") : t("auto.t_19", "Немає клієнтів")}
          description={searchTerm ? "Спробуйте змінити пошуковий запит." : "Додайте першого клієнта до вашої бази."}
          actionLabel={searchTerm ? null : "Додати клієнта"}
          onAction={searchTerm ? null : () => document.getElementById('global-add-btn')?.click()}
        />
      ) : (
        <div className="px-5 space-y-3">
          {[...filtered].sort((a, b) => b.totalSpent - a.totalSpent).map((c) => (
            <div 
              key={c.id} 
              onClick={() => onClick(c)} 
              className="flex items-center justify-between p-4 bg-[#1A1616] border border-[#2A2323] rounded-[24px] cursor-pointer active:scale-95 transition-all shadow-lg"
            >
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                 <div className="w-12 h-12 rounded-full bg-[#151212] border border-[#2A2323] flex items-center justify-center shadow-inner shrink-0 text-[#8C7A7A]">
                    <span className="font-bold text-lg">{c.name.charAt(0).toUpperCase()}</span>
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <h3 className="text-[#F4EFEA] font-bold text-[15px] leading-tight mb-0.5 truncate">{c.name}</h3>
                   <p className="text-[#8C7A7A] text-[9px] uppercase font-bold tracking-widest">{c.orderCount || 0} {t("auto.t_20", "замовлень")}</p>
                 </div>
              </div>
              <div className="text-right flex items-center gap-3 shrink-0 pl-2">
                <p className="text-[#D4AF37] font-black text-[15px]">{(c.totalSpent || 0).toFixed(0)} <span className="text-[#8C7A7A] text-xs font-bold">₴</span></p>
                <ChevronRight size={18} className="text-[#8C7A7A]/50" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default CustomersList;