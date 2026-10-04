import React, { useState, useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Edit3, Search, Calendar, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryHistory({ historyLogs, onOrderClick }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);

  const translateReason = (reason) => {
    if (!reason) return '';
    if (reason.includes('Брак / Списування')) return reason.replace('Брак / Списування', t('inventoryHistory.reasonWaste') || 'Брак / Списування');
    if (reason.toLowerCase().includes('продаж')) return t('inventoryHistory.reasonSale') || 'Продаж';
    if (reason.toLowerCase().includes('замовлення')) return t('inventoryHistory.reasonOrder') || 'Замовлення';
    if (reason.includes('Витрата на заготівлю:')) return reason.replace('Витрата на заготівлю:', t('inventoryHistory.reasonPrepUsage') || 'Витрата на заготівлю:');
    if (reason === 'Приготування') return t('inventoryHistory.reasonCooking') || 'Приготування';
    if (reason === 'Початкове внесення') return t('inventoryHistory.reasonInitial') || 'Початкове внесення';
    if (reason.includes('Ревізія')) return reason.replace('Ревізія', t('inventoryHistory.reasonRevision') || 'Ревізія');
    if (reason.includes('Дефіцит')) return reason.replace('Дефіцит', t('shoppingListPreview.deficit') || 'Дефіцит');
    return reason;
  };

  // Фільтр по назві або причині
  const filteredLogs = useMemo(() => {
    const sortedLogs = [...(historyLogs || [])].sort((a, b) => {
      const timeA = a.timestamp || new Date(a.date).getTime() || 0;
      const timeB = b.timestamp || new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });
    return sortedLogs.filter(log => {
      const translatedReason = translateReason(log.reason);
      return (log.itemName || '').toLowerCase().includes(search.toLowerCase()) ||
             (translatedReason || '').toLowerCase().includes(search.toLowerCase());
    });
  }, [historyLogs, search]);

  useMemo(() => {
    setVisibleCount(50);
  }, [search]);

  // Визначаємо іконку залежно від типу операції
  const getIcon = (type) => {
    switch(type) {
      case 'usage': return <ArrowDownRight size={18} className="text-[#F4EFEA]" />; // Витрата на десерт
      case 'waste': return <AlertTriangle size={18} className="text-red-400" />; // Брак
      case 'add': return <ArrowUpRight size={18} className="text-[#D4AF37]" />; // Прихід (закупівля)
      default: return <Edit3 size={18} className="text-[#2AABEE]" />; // Ревізія/Ручне редагування
    }
  };

  // Колір цифри
  const getColor = (change) => {
    if (change > 0) return 'text-[#D4AF37]'; 
    if (change < 0) return 'text-[#F4EFEA]'; 
    return 'text-[#8C7A7A]'; 
  };

  const formatDate = (val) => {
    if (!val) return '';
    const d = new Date(val); // Works for timestamp (number) and string
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 pb-28">
      <h2 className="text-[#F4EFEA] text-xl font-black mb-5 tracking-tight flex items-center gap-3 drop-shadow-sm">
         <div className="bg-[#D4AF37]/10 p-2 rounded-xl border border-[#D4AF37]/20">
           <Calendar size={20} className="text-[#D4AF37]" />
         </div>
         {t('inventoryHistory.title', 'Історія руху товарів')}
      </h2>

      <div className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[24px] p-4 flex items-center gap-3 shadow-lg mb-6 focus-within:border-[#D4AF37]/50 transition-colors">
         <Search size={20} className="text-[#8C7A7A]" />
         <input
           type="text"
           placeholder={t('inventoryHistory.search', 'Пошук за інгредієнтом чи причиною...')}
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm font-medium"
         />
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center p-10 flex flex-col items-center">
            <Package size={56} className="text-[#2A2323] mx-auto mb-4" />
            <p className="text-[#8C7A7A] text-sm font-bold tracking-widest uppercase">{t('inventoryHistory.empty', 'Історія порожня')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredLogs.slice(0, visibleCount).map((log, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                key={log.id} 
                onClick={() => log.orderId && onOrderClick && onOrderClick(log.orderId)}
                className={`p-5 flex items-center justify-between bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[24px] shadow-lg ${log.orderId ? 'cursor-pointer active:scale-95 hover:border-[#D4AF37]/30' : ''} transition-all`}
              >
                 <div className="flex items-center gap-4">
                    <div className="bg-[#110E0E] w-12 h-12 rounded-2xl flex items-center justify-center border border-[#2A2323] shrink-0 shadow-inner">
                       {getIcon(log.type)}
                    </div>
                    <div>
                       <p className="text-[#F4EFEA] font-black text-sm leading-tight mb-1">{log.itemName}</p>
                       <p className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest leading-relaxed">
                         {translateReason(log.reason)}
                       </p>
                       <p className="text-[#8C7A7A] text-[9px] mt-1 font-medium">{formatDate(log.timestamp || log.date)}</p>
                    </div>
                 </div>
                 <div className="text-right shrink-0 ml-3">
                    <p className={`font-black text-xl drop-shadow-sm ${getColor(log.change)}`}>
                       {log.change > 0 ? '+' : ''}{log.change}
                    </p>
                    <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest mt-0.5">
                      {{'г': t('addRecipe.g', 'г'), 'кг': t('addRecipe.kg', 'кг'), 'шт': t('addRecipe.pcs', 'шт'), 'мл': t('addRecipe.ml', 'мл')}[log.unit] || log.unit}
                    </p>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {visibleCount < filteredLogs.length && (
            <motion.button 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setVisibleCount(v => v + 50)}
              className="w-full py-4 mt-4 bg-[#1E1919] border border-[#2A2323] text-[#8C7A7A] rounded-2xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg"
            >
              {t("auto.show_more", "Показати більше")} ({filteredLogs.length - visibleCount})
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}