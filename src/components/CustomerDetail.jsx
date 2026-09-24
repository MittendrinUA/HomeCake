import useStore from '../store/useStore';
import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CustomerDetail({ item, onUpdate, onDelete, askPrompt, sales }) {
  const currency = useStore(s => s.settings?.currency || 'грн');
  const { t } = useTranslation();
  if (!item) return null;
  
  const safeName = item?.name ? String(item.name) : t('customerDetail.noName');
  const safeSales = sales || []; 
  
  const cSales = safeSales.filter(s => {
    const sName = s.customer ? String(s.customer) : '';
    return sName.toLowerCase().trim() === safeName.toLowerCase().trim();
  }).sort((a, b) => {
    const tA = a.createdAt?.seconds || 0;
    const tB = b.createdAt?.seconds || 0;
    return tB - tA;
  });

  const orderCount = cSales.length;
  const totalSpent = cSales.reduce((sum, s) => {
      const itemsList = s.items || [{ sellPrice: s.sellPrice || 0 }];
      return sum + itemsList.reduce((acc, i) => acc + (Number(i.sellPrice) || 0), 0) + (Number(s.decorPrice) || 0);
  }, 0);

  return (
    <div className="p-4 pb-24">
      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 mb-6 shadow-lg relative">
        <button onClick={onDelete} className="absolute top-6 right-6 text-[#8C7A7A] hover:text-red-400 bg-[#151212] p-2 rounded-xl border border-[#2A2323] active:scale-95 transition-transform">
          <Trash2 size={16} />
        </button>
        <div className="flex items-center gap-4 mb-6">
           <div className="w-16 h-16 rounded-full bg-[#151212] border border-[#D4AF37]/50 flex items-center justify-center shadow-inner shrink-0">
              <span className="text-[#D4AF37] font-black text-2xl">{safeName.charAt(0).toUpperCase()}</span>
           </div>
           <div className="pr-10">
             <h2 className="text-2xl font-bold text-[#F4EFEA] leading-tight mb-1">
               {safeName}
               <Edit2 size={14} className="inline text-[#8C7A7A] hover:text-[#D4AF37] ml-2 cursor-pointer mb-1 active:scale-90 transition-transform" onClick={() => askPrompt && askPrompt(t('customerDetail.promptName'), [{name: 'val', label: t('customerDetail.promptNameLabel'), defaultValue: safeName}], (res) => { if(res.val) onUpdate({name: res.val}) })}/>
             </h2>
             <p className="text-[#8C7A7A] text-xs font-medium">{t('customerDetail.clientSince')}{item.lastOrderDate || t('customerDetail.unknown')}</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#151212] border border-[#2A2323] p-4 rounded-2xl text-center shadow-inner">
             <p className="text-[#8C7A7A] text-[9px] uppercase font-bold tracking-widest mb-1">{t('customerDetail.revenue')}</p>
             <p className="text-[#D4AF37] font-black text-xl">{totalSpent.toFixed(0)} {currency}</p>
          </div>
          <div className="bg-[#151212] border border-[#2A2323] p-4 rounded-2xl text-center shadow-inner">
             <p className="text-[#8C7A7A] text-[9px] uppercase font-bold tracking-widest mb-1">{t('customerDetail.ordersCount')}</p>
             <p className="text-[#F4EFEA] font-black text-xl">{orderCount}</p>
          </div>
        </div>

        <div className="space-y-4">
           <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-1.5 block ml-1">{t('customerDetail.phone')}</label>
              <div className="flex items-center justify-between bg-[#151212] border border-[#2A2323] p-3.5 rounded-xl">
                 <span className="text-[#F4EFEA] text-sm font-medium">{item.phone || t('customerDetail.notSpecified')}</span>
                 <Edit2 size={14} className="text-[#8C7A7A] hover:text-[#D4AF37] cursor-pointer active:scale-90 transition-transform" onClick={() => askPrompt && askPrompt(t('customerDetail.phone'), [{name: 'val', label: t('customerDetail.promptPhoneLabel'), type: 'tel', defaultValue: item.phone || ''}], (res) => { onUpdate({phone: res.val}); })}/>
              </div>
           </div>
           <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-1.5 block ml-1">{t('customerDetail.socials')}</label>
              <div className="flex items-center justify-between bg-[#151212] border border-[#2A2323] p-3.5 rounded-xl">
                 <span className="text-[#F4EFEA] text-sm font-medium">{item.instagram || t('customerDetail.notSpecified')}</span>
                 <Edit2 size={14} className="text-[#8C7A7A] hover:text-[#D4AF37] cursor-pointer active:scale-90 transition-transform" onClick={() => askPrompt && askPrompt(t('customerDetail.promptSocials'), [{name: 'val', label: t('customerDetail.promptSocialsLabel'), defaultValue: item.instagram || ''}], (res) => { onUpdate({instagram: res.val}); })}/>
              </div>
           </div>
           <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-1.5 block ml-1">{t('customerDetail.notes')}</label>
              <div className="relative">
                 <textarea 
                   defaultValue={item.notes || ''} 
                   onBlur={(e) => onUpdate({notes: e.target.value})}
                   placeholder={t('customerDetail.notesPlaceholder')} 
                   className="w-full bg-[#151212] text-[#F4EFEA] p-4 rounded-xl border border-[#2A2323] outline-none focus:border-[#D4AF37] min-h-[100px] text-sm resize-y custom-scrollbar transition-colors"
                 />
              </div>
           </div>
        </div>
      </div>

      <h3 className="text-[#F4EFEA] font-bold text-lg mb-4 px-2 tracking-wide">{t('customerDetail.orderHistory')}</h3>
      {cSales.length === 0 ? (
         <p className="text-[#8C7A7A] text-sm px-2">{t('customerDetail.noOrders')}</p>
      ) : (
         cSales.map(s => {
           const itemsList = s.items || [{ sellPrice: s.sellPrice || 0 }];
           const orderTotal = itemsList.reduce((sum, i) => sum + (Number(i.sellPrice) || 0), 0) + (Number(s.decorPrice) || 0);
           
           return (
             <div key={s.id} className="bg-[#1E1919] border border-[#2A2323] p-4 rounded-[24px] mb-3 flex justify-between items-center shadow-lg">
                <div>
                   <p className="text-[#F4EFEA] font-bold text-sm mb-1">{s.date}</p>
                   <p className={`text-[10px] uppercase tracking-widest font-bold ${s.status !== 'planned' ? 'text-[#5B7A5A]' : 'text-[#D4AF37]'}`}>
                     {s.status !== 'planned' ? t('customerDetail.issued') : t('customerDetail.planned')}
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-[#D4AF37] font-black">{orderTotal.toFixed(0)} {currency}</p>
                </div>
             </div>
           );
         })
      )}
    </div>
  );
}
