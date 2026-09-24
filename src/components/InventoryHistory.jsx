import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Edit3, Search, Calendar, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function InventoryHistory({ historyLogs, onOrderClick }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // Сортуємо від найновіших до найстаріших
  const sortedLogs = [...(historyLogs || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

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
  const filteredLogs = sortedLogs.filter(log => {
    const translatedReason = translateReason(log.reason);
    return (log.itemName || '').toLowerCase().includes(search.toLowerCase()) ||
           (translatedReason || '').toLowerCase().includes(search.toLowerCase());
  });

  // Визначаємо іконку залежно від типу операції
  const getIcon = (type) => {
    switch(type) {
      case 'usage': return <ArrowDownRight size={18} className="text-[#8C7A7A]" />; // Витрата на десерт
      case 'waste': return <AlertTriangle size={18} className="text-red-400" />; // Брак
      case 'add': return <ArrowUpRight size={18} className="text-[#5B7A5A]" />; // Прихід (закупівля)
      default: return <Edit3 size={18} className="text-[#D4AF37]" />; // Ревізія/Ручне редагування
    }
  };

  // Колір цифри
  const getColor = (change) => {
    if (change > 0) return 'text-[#5B7A5A]'; 
    if (change < 0) return 'text-[#F4EFEA]'; 
    return 'text-[#8C7A7A]'; 
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 pb-28">
      <h2 className="text-[#F4EFEA] text-xl font-bold mb-4 tracking-wide flex items-center gap-2">
         <Calendar size={20} className="text-[#D4AF37]" /> {t('inventoryHistory.title')}
      </h2>

      <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3.5 flex items-center gap-3 shadow-inner mb-6">
         <Search size={18} className="text-[#8C7A7A]" />
         <input
           type="text"
           placeholder={t('inventoryHistory.search')}
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm"
         />
      </div>

      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-2 shadow-lg overflow-hidden">
         {filteredLogs.length === 0 ? (
           <div className="text-center p-8">
               <Package size={48} className="text-[#2A2323] mx-auto mb-3" />
               <p className="text-[#8C7A7A] text-sm">{t('inventoryHistory.empty')}</p>
           </div>
         ) : (
           filteredLogs.map((log, idx) => (
             <div 
               key={log.id} 
               onClick={() => log.orderId && onOrderClick && onOrderClick(log.orderId)}
               className={`p-4 flex items-center justify-between ${idx !== 0 ? 'border-t border-[#2A2323]' : ''} ${log.orderId ? 'cursor-pointer hover:bg-[#151212]' : ''} transition-colors rounded-2xl`}
             >
                <div className="flex items-center gap-4">
                   <div className="bg-[#151212] w-10 h-10 rounded-full flex items-center justify-center border border-[#2A2323] shrink-0">
                      {getIcon(log.type)}
                   </div>
                   <div>
                      <p className="text-[#F4EFEA] font-bold text-sm leading-tight mb-1">{log.itemName}</p>
                      <p className="text-[#8C7A7A] text-[10px] uppercase tracking-widest leading-relaxed">
                        {translateReason(log.reason)}
                      </p>
                      <p className="text-[#8C7A7A] text-[9px] mt-1.5 font-medium">{formatDate(log.date)}</p>
                   </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                   <p className={`font-black text-sm ${getColor(log.change)}`}>
                      {log.change > 0 ? '+' : ''}{log.change} {log.unit}
                   </p>
                </div>
             </div>
           ))
         )}
      </div>
    </div>
  );
}