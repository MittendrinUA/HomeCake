import useStore from '../store/useStore';
import React, { memo, useState, useEffect } from 'react';
import { Trash2, Edit2, Camera, MoreVertical, Phone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { compressImage } from '../utils/calculations';

const CustomerDetail = memo(function CustomerDetail({ item, onUpdate, onDelete, askPrompt, sales }) {
  const currency = useStore(s => s.settings?.currency || 'грн');
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [item?.id]);

  if (!item) return null;
  
  const safeName = item?.name ? String(item.name) : t('customerDetail.noName', 'Без імені');
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

  const handleImageChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) {
      const imgUrl = await compressImage(f);
      onUpdate({ imageUrl: imgUrl });
    }
  };

  const copyPhone = async () => {
    if (item.phone) {
      try {
        await navigator.clipboard.writeText(item.phone);
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
  };

  return (
    <div className="p-5 pb-24" onClick={() => setMenuOpen(false)}>
      <div className="bg-[#1A1616] border border-[#2A2323] rounded-[32px] p-6 mb-8 shadow-lg relative">
        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="absolute top-6 right-6 text-[#8C7A7A] hover:text-[#F4EFEA] bg-[#151212] p-2.5 rounded-[14px] border border-[#2A2323] active:scale-95 transition-transform shadow-inner">
          <MoreVertical size={20} />
        </button>
        
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -5 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -5 }} 
              className="absolute top-16 right-6 bg-[#151212] border border-[#2A2323] rounded-[20px] shadow-2xl z-50 overflow-hidden min-w-[180px]"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); askPrompt && askPrompt("Редагувати", [{name: 'val', label: "Ім'я", defaultValue: safeName}], (res) => { if(res.val) onUpdate({name: res.val}) }); }} 
                className="w-full text-left px-5 py-4 text-sm text-[#F4EFEA] hover:bg-[#2A2323]/50 font-bold flex items-center gap-3 border-b border-[#2A2323]/50 transition-colors"
              >
                <Edit2 size={16} className="text-[#8C7A7A]" /> {t('common.edit', 'Редагувати')}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} 
                className="w-full text-left px-5 py-4 text-sm text-red-400 hover:bg-[#2A2323]/50 font-bold flex items-center gap-3 transition-colors"
              >
                <Trash2 size={16} /> {t('common.delete', 'Видалити')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-5 mb-6 pr-14">
           <div className="relative">
             <div className="w-[72px] h-[72px] rounded-full bg-[#151212] border border-[#D4AF37]/50 flex items-center justify-center shadow-inner shrink-0 overflow-hidden bg-cover bg-center" style={{ backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none' }}>
                {!item.imageUrl && <span className="text-[#D4AF37] font-black text-3xl">{safeName.charAt(0).toUpperCase()}</span>}
             </div>
             <label className="absolute bottom-0 right-0 bg-[#D4AF37] p-1.5 rounded-full cursor-pointer shadow-lg active:scale-95 transition-transform border-2 border-[#1A1616]">
               <Camera size={14} className="text-[#151212]" />
               <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
             </label>
           </div>
           
           <div className="flex-1 overflow-hidden">
             <h2 className="text-[22px] font-black text-[#F4EFEA] leading-tight mb-1 truncate">
               {safeName}
             </h2>
             <p className="text-[#8C7A7A] text-[12px] font-medium tracking-wide">{t('customerDetail.clientSince', 'Клієнт з ')}{item.lastOrderDate || 'невідомо'}</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#151212] border border-[#2A2323] p-4 rounded-[20px] text-center shadow-inner">
             <p className="text-[#8C7A7A] text-[9px] uppercase font-bold tracking-widest mb-1.5">{t('customerDetail.revenue', 'ВИРУЧКА')}</p>
             <p className="text-[#D4AF37] font-black text-[22px]">{totalSpent.toFixed(0)} <span className="text-sm font-bold">{currency}</span></p>
          </div>
          <div className="bg-[#151212] border border-[#2A2323] p-4 rounded-[20px] text-center shadow-inner">
             <p className="text-[#8C7A7A] text-[9px] uppercase font-bold tracking-widest mb-1.5">{t('customerDetail.ordersCount', 'ЗАМОВЛЕНЬ')}</p>
             <p className="text-[#F4EFEA] font-black text-[22px]">{orderCount}</p>
          </div>
        </div>

        <div className="space-y-4">
           <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-1.5 block ml-2">{t('customerDetail.phone', 'ТЕЛЕФОН')}</label>
              <div className="flex items-center justify-between bg-[#151212] border border-[#2A2323] p-4 rounded-[20px] shadow-inner">
                 <div onClick={copyPhone} className={`text-[#F4EFEA] text-[15px] font-bold ${!item.phone && 'opacity-50'} flex-1 truncate ${item.phone && 'cursor-pointer active:scale-95 transition-transform origin-left'}`}>{item.phone || t('customerDetail.notSpecified', 'Не вказано')}</div>
                 <div className="flex items-center gap-4 shrink-0 ml-3">
                   {item.phone && (
                     <a href={`tel:${item.phone}`} className="text-[#5B7A5A] hover:text-[#D4AF37] cursor-pointer active:scale-90 transition-transform">
                       <Phone size={18} />
                     </a>
                   )}
                   <Edit2 size={16} className="text-[#8C7A7A] hover:text-[#D4AF37] cursor-pointer active:scale-90 transition-transform" onClick={() => askPrompt && askPrompt("Телефон", [{name: 'val', label: "Номер", type: 'tel', defaultValue: item.phone || ''}], (res) => { onUpdate({phone: res.val}); })}/>
                 </div>
              </div>
           </div>
           <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-1.5 block ml-2">INSTAGRAM / TELEGRAM</label>
              <div className="flex items-center justify-between bg-[#151212] border border-[#2A2323] p-4 rounded-[20px] shadow-inner">
                 <div className={`text-[#F4EFEA] text-[15px] font-bold ${!item.instagram && 'opacity-50'} flex-1 truncate`}>{item.instagram || t('customerDetail.notSpecified', 'Не вказано')}</div>
                 <Edit2 size={16} className="text-[#8C7A7A] hover:text-[#D4AF37] cursor-pointer active:scale-90 transition-transform ml-3 shrink-0" onClick={() => askPrompt && askPrompt("Instagram / Telegram", [{name: 'val', label: "Нікнейм або посилання", defaultValue: item.instagram || ''}], (res) => { onUpdate({instagram: res.val}); })}/>
              </div>
           </div>
           <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-1.5 block ml-2">{t('customerDetail.notes', 'НОТАТКИ (СМАКИ, АЛЕРГІЇ)')}</label>
              <div className="flex items-start justify-between bg-[#151212] border border-[#2A2323] p-4 rounded-[20px] shadow-inner min-h-[100px]">
                 <div className={`text-[#F4EFEA] text-[15px] font-medium leading-relaxed whitespace-pre-wrap flex-1 ${!item.notes && 'opacity-50'}`}>
                   {item.notes || t('customerDetail.notSpecified', 'Не вказано')}
                 </div>
                 <Edit2 size={16} className="text-[#8C7A7A] hover:text-[#D4AF37] cursor-pointer active:scale-90 transition-transform ml-3 mt-0.5 shrink-0" onClick={() => askPrompt && askPrompt("Нотатки", [{name: 'val', label: "Смаки, алергії...", type: 'textarea', defaultValue: item.notes || ''}], (res) => { onUpdate({notes: res.val}); })}/>
              </div>
           </div>
        </div>
      </div>

      <h3 className="text-[#F4EFEA] font-black text-xl mb-4 px-2 tracking-tight">{t('customerDetail.orderHistory', 'Історія замовлень клієнта')}</h3>
      {cSales.length === 0 ? (
         <p className="text-[#8C7A7A] text-[15px] font-medium px-2">{t('customerDetail.noOrders', 'Немає замовлень.')}</p>
      ) : (
         <div className="space-y-3">
           {cSales.map(s => {
             const itemsList = s.items || [{ sellPrice: s.sellPrice || 0 }];
             const orderTotal = itemsList.reduce((sum, i) => sum + (Number(i.sellPrice) || 0), 0) + (Number(s.decorPrice) || 0);
             
             return (
               <div key={s.id} className="bg-[#1A1616] border border-[#2A2323] p-4 rounded-[24px] flex justify-between items-center shadow-lg">
                  <div>
                     <p className="text-[#F4EFEA] font-bold text-[15px] mb-1 leading-tight">{s.date}</p>
                     <p className={`text-[9px] uppercase tracking-widest font-bold ${s.status !== 'planned' ? 'text-[#5B7A5A]' : 'text-[#D4AF37]'}`}>
                       {s.status !== 'planned' ? t('customerDetail.issued', 'ВИДАНО') : t('customerDetail.planned', 'ЗАПЛАНОВАНО')}
                     </p>
                  </div>
                  <div className="text-right">
                     <p className="text-[#D4AF37] font-black text-[17px]">{orderTotal.toFixed(0)} <span className="text-xs text-[#8C7A7A]">{currency}</span></p>
                  </div>
               </div>
             );
           })}
         </div>
      )}
    </div>
  );
});

export default CustomerDetail;
