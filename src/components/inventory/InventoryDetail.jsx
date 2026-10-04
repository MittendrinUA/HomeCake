import { useTranslation } from "react-i18next";
import React, { useState, useEffect, memo } from 'react';
import { Edit2, Trash2, Camera, Layers, ClipboardList, History, MoreVertical, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

const InventoryDetail = memo(function InventoryDetail({ item, onUpdate, onDelete, onWaste, askConfirm, askPrompt, showToast, logs, logMovement, compressImage }) {
  const { settings } = useStore();
  const showImages = settings?.showInventoryImages !== false;
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [addedCost, setAddedCost] = useState('');
  const [auditAmount, setAuditAmount] = useState('');
  const [compName, setCompName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [item?.id]);

  if (!item) return null;

  const quantity = Number(item.quantity) || 0;
  const price = Number(item.price) || 0;
  const getUnit = (u) => {
    const map = { 'г': t('addRecipe.g', 'г'), 'кг': t('addRecipe.kg', 'кг'), 'шт': t('addRecipe.pcs', 'шт'), 'мл': t('addRecipe.ml', 'мл') };
    return map[u] || u;
  };
  const unit = getUnit(item.unit || 'г');
  const name = item.name || 'Без назви';
  const isMix = item.isMix || false;
  const mixItems = item.mixItems || [];
  const minThreshold = Number(item.minThreshold) || 0;

  const calculateProportionalMix = (invItem, newTotalQty) => {
    if (!invItem.isMix || !invItem.mixItems) return { mixItems: invItem.mixItems || [], price: invItem.price };
    if (newTotalQty <= 0) return { mixItems: [], price: 0 };
    const proportion = newTotalQty / (invItem.quantity || 1);
    const newMixItems = invItem.mixItems.map((mi) => ({ ...mi, quantity: Number((mi.quantity * proportion).toFixed(2)), cost: Number((mi.cost * proportion).toFixed(2)) })).filter((mi) => mi.quantity > 0.01);
    const tQ = newMixItems.reduce((s, i) => s + i.quantity, 0);
    const tC = newMixItems.reduce((s, i) => s + i.cost, 0);
    const newPrice = tQ > 0 ? Number((tC / tQ).toFixed(2)) : invItem.price;
    return { mixItems: newMixItems, price: newPrice };
  };

  const handleAdd = () => {
    const addedQty = Number(amount);
    if (addedQty <= 0) return;

    const newQty = Number(Math.max(0, quantity + addedQty).toFixed(2));
    let updatePayload = { quantity: newQty };
    let movementReason = 'Поповнення';

    if (isMix) {
      if (!compName) {showToast("Введіть назву фрукта/компонента!");return;}
      const addedC = Number(addedCost) || 0;
      const newMixItem = { id: Date.now().toString(), name: compName, quantity: addedQty, cost: addedC };
      const newMixItems = [...mixItems, newMixItem];

      const tQ = newMixItems.reduce((s, i) => s + i.quantity, 0);
      const tC = newMixItems.reduce((s, i) => s + i.cost, 0);
      const newAvgPrice = tQ > 0 ? tC / tQ : 0;

      updatePayload = { quantity: Number(tQ.toFixed(2)), price: Number(newAvgPrice.toFixed(2)), mixItems: newMixItems };
      movementReason = `Додано в мікс: ${compName}`;
      setCompName('');
    } else {
      let newAvgPrice = price;
      if (addedCost && Number(addedCost) > 0) {
        const totalOldValue = quantity * price;
        const totalNewValue = Number(addedCost);
        newAvgPrice = (totalOldValue + totalNewValue) / newQty;
      }
      updatePayload.price = Number(newAvgPrice.toFixed(2));
    }

    onUpdate(updatePayload);
    logMovement(item.id, name, 'IN', addedQty, unit, updatePayload.price || price, movementReason);
    setAmount('');
    setAddedCost('');
  };

  const handleSubtract = () => {
    const deductQty = Number(amount);
    if (deductQty <= 0) return;
    const newQty = Number(Math.max(0, quantity - deductQty).toFixed(2));

    let updatePayload = { quantity: newQty };
    if (isMix) {
      const mixData = calculateProportionalMix(item, newQty);
      updatePayload = { ...updatePayload, mixItems: mixData.mixItems, price: mixData.price };
    }

    onUpdate(updatePayload);
    logMovement(item.id, name, 'OUT', deductQty, unit, price, 'Списання вручну');
    setAmount('');
    setAddedCost('');
  };

  const handleWasteAction = () => {
    const wasteQty = Number(amount);
    if (wasteQty <= 0) return;
    askConfirm("Списання браку", `Списати ${wasteQty} ${unit} в брак? Сума збитків: ${(wasteQty * price).toFixed(2)} ₴. Це відобразиться в аналітиці.`, () => {
      onWaste(item, wasteQty);
      setAmount('');
      setAddedCost('');
    });
  };

  const handleAudit = () => {
    if (auditAmount === '') return;
    const actualQty = Number(auditAmount);
    const diff = Number((actualQty - quantity).toFixed(2));

    if (diff === 0) {
      showToast("Кількість збігається!");
      setAuditAmount('');
      return;
    }

    const type = diff > 0 ? 'IN' : 'OUT';
    const reason = diff > 0 ? 'Ревізія (Надлишок)' : 'Ревізія (Нестача)';

    askConfirm("Підтвердження ревізії", `Система виявила ${diff > 0 ? 'надлишок' : 'нестачу'} ${Math.abs(diff)} ${unit}. Зберегти фактичний залишок ${actualQty} ${unit}?`, () => {
      let updatePayload = { quantity: actualQty };
      if (isMix) {
        const mixData = calculateProportionalMix(item, actualQty);
        updatePayload = { ...updatePayload, mixItems: mixData.mixItems, price: mixData.price };
      }

      onUpdate(updatePayload);
      logMovement(item.id, name, type, Math.abs(diff), unit, updatePayload.price || price, reason);
      setAuditAmount('');
      showToast("Залишки оновлено!");
    });
  };

  const itemLogs = logs.filter((l) => l.invId === item.id).sort((a, b) => b.timestamp - a.timestamp);
  const isLowStock = minThreshold > 0 && quantity < minThreshold;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-28" onClick={() => setMenuOpen(false)}>
      
        <div className="bg-[#1E1919] p-6 shadow-2xl rounded-b-[40px] relative border-b border-[#2A2323]">
           <div className="absolute top-4 right-4 z-20">
             <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="bg-[#151212]/60 backdrop-blur-xl p-2.5 rounded-full border border-[#2A2323]/50 text-white active:scale-90 transition-all shadow-lg hover:bg-[#151212]/80">
               <MoreVertical size={20} />
             </button>
             
             <AnimatePresence>
               {menuOpen && (
                 <motion.div initial={{ opacity: 0, scale: 0.9, originTopRight: 1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute top-12 right-0 w-56 bg-[#151212]/95 backdrop-blur-xl border border-[#2A2323] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                   <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); askPrompt("Назва матеріалу", [{ name: 'val', label: 'Назва', defaultValue: name }], (res) => {if (res.val) onUpdate({ name: res.val });}); }} className="w-full text-left px-4 py-3.5 text-xs text-white hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 border-b border-[#2A2323]/50 transition-colors">
                     <Edit2 size={14} className="text-[#D4AF37]"/> {t('common.editName', 'Редагувати назву')}
                   </button>
                   <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); askPrompt("Мінімальний залишок", [{ name: 'val', label: `Мінімум (${unit})`, type: 'number', defaultValue: minThreshold }], (res) => {if (res.val !== undefined) onUpdate({ minThreshold: Number(res.val) || 0 });}); }} className="w-full text-left px-4 py-3.5 text-xs text-white hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 border-b border-[#2A2323]/50 transition-colors">
                     <AlertTriangle size={14} className="text-[#D4AF37]"/> Мін. залишок ({minThreshold})
                   </button>
                   <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} className="w-full text-left px-4 py-3.5 text-xs text-red-400 hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 transition-colors">
                     <Trash2 size={14} /> {t('common.delete', 'Видалити')}
                   </button>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           
           <div className="pt-2">
              {isMix && <span className="text-[#2AABEE] bg-[#2AABEE]/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-3 inline-block border border-[#2AABEE]/30 shadow-sm">{t("auto.t_32", "Мікс")}</span>}
              <h2 className="text-3xl font-black text-white leading-tight drop-shadow-2xl pr-4">
                {name}
              </h2>
           </div>
        </div>

      <div className="px-6 py-6 bg-gradient-to-b from-[#1E1919] to-[#151212] mb-6 flex justify-between items-center shadow-xl shadow-black/20 rounded-[32px] mx-4 -mt-4 relative z-10 border border-[#2A2323]">
         <div>
           <p className="text-[#8C7A7A] text-[10px] font-bold mb-1.5 uppercase tracking-widest flex items-center gap-1">{t("auto.t_33", "На складі")} {isLowStock && <AlertTriangle size={12} className="text-red-400" />}</p>
           <p className={`text-4xl font-black tracking-tight drop-shadow-md ${quantity <= 0 ? "text-red-500" : isLowStock ? "text-red-400" : "text-[#D4AF37]"}`}>
             {quantity} <span className="text-lg font-medium text-[#8C7A7A]">{unit}</span>
           </p>
         </div>
         <div className="text-right">
            <span className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest block mb-1.5">Собівартість (за 1 {unit})</span>
            <div className="flex items-center justify-end">
              <input type="number" inputMode="decimal" value={price} onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })} disabled={isMix} className={`bg-[#110E0E] border border-[#2A2323] text-white px-3 py-1.5 rounded-xl text-sm font-bold w-20 text-right outline-none focus:border-[#D4AF37] ${isMix ? 'opacity-50' : ''} transition-all shadow-inner`} />
              <span className="text-[#8C7A7A] font-bold ml-2 text-sm">₴</span>
            </div>
         </div>
      </div>

      <div className="px-4 space-y-6">
        {isMix &&
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[32px] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Layers size={100} /></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
               <Layers size={16} className="text-[#2AABEE]" />
               <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block">{t("auto.t_35", "Склад міксу на сьогодні")}</label>
            </div>
            {mixItems.length === 0 ?
              <p className="text-[#8C7A7A] text-xs text-center py-6 font-bold tracking-wider uppercase border border-dashed border-[#2A2323] rounded-2xl relative z-10">{t("auto.t_36", "Кошик порожній")}</p> :

              <div className="space-y-3 relative z-10">
                 {mixItems.map((comp, idx) =>
                    <div key={idx} className="flex justify-between items-center py-3 border-b border-[#2A2323] last:border-0">
                       <div>
                         <p className="text-[#F4EFEA] font-bold text-sm leading-tight">{comp.name}</p>
                         <p className="text-[#8C7A7A] text-[10px] mt-1 font-medium">{t("auto.t_37", "Витрачено:")} <span className="text-[#D4AF37]">{comp.cost.toFixed(2)} ₴</span></p>
                       </div>
                       <div className="text-right">
                         <p className="text-[#2AABEE] font-black text-sm">{comp.quantity} {unit}</p>
                         <p className="text-[#8C7A7A] text-[10px] font-medium">{comp.quantity > 0 ? (comp.cost / comp.quantity).toFixed(2) : 0} ₴ / 1 {unit}</p>
                       </div>
                    </div>
                 )}
               </div>
            }
          </motion.div>
        }

        <div className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[32px] p-6 shadow-xl">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-4 block">{t("auto.t_38", "Надходження / Списання")}</label>
          
          {isMix &&
            <input type="text" placeholder={t("auto.t_39", "Що саме додаємо? (напр. Полуниця)")} value={compName} onChange={(e) => setCompName(e.target.value)} className="w-full bg-[#110E0E] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 rounded-2xl p-4 outline-none font-bold text-sm transition-all shadow-inner mb-4" />
          }

          <div className="grid grid-cols-2 gap-3 mb-4">
            <input type="number" inputMode="decimal" placeholder={`${t('inventoryDetail.qty', 'Кількість')} (${unit})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#110E0E] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 rounded-2xl p-4 outline-none font-bold text-center text-lg transition-all shadow-inner" />
            <input type="number" inputMode="decimal" placeholder={t("auto.t_40", "Вартість (₴)")} value={addedCost} onChange={(e) => setAddedCost(e.target.value)} className="w-full bg-[#110E0E] border border-[#2A2323] text-[#D4AF37] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 rounded-2xl p-4 outline-none font-bold text-center text-lg transition-all shadow-inner" />
          </div>

          <AnimatePresence>
            {Number(amount) > 0 && Number(addedCost) > 0 &&
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5 p-4 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl flex justify-between items-center shadow-sm">
                <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">{isMix ? t('inventoryDetail.mixComponent', 'Компонент міксу:') : t('inventoryDetail.newBatch', 'Нова партія:')}</span>
                <span className="text-[#F4EFEA] font-black text-sm">{(Number(addedCost) / Number(amount)).toFixed(2)} ₴ <span className="text-[#8C7A7A] text-[10px] font-medium">/ 1 {unit}</span></span>
              </motion.div>
            }
          </AnimatePresence>

          <div className="flex gap-3 mt-2">
            <button onClick={handleAdd} disabled={!amount || isMix && !compName || isMix && !addedCost} className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#151212] shadow-[0_0_20px_rgba(212,175,55,0.3)] py-4 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all disabled:opacity-50">{t("auto.t_41", "Поповнити")}</button>
            <button onClick={handleSubtract} disabled={!amount} className="flex-1 bg-[#110E0E] text-[#F4EFEA] border border-[#2A2323] py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all disabled:opacity-50 hover:bg-[#1E1919]">{t("auto.t_42", "Списати")}</button>
            <button onClick={handleWasteAction} disabled={!amount} className="flex-1 bg-red-900/20 text-red-400 border border-red-500/30 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all disabled:opacity-50 hover:bg-red-900/30">{t("auto.t_43", "В брак")}</button>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[32px] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
             <ClipboardList size={16} className="text-[#D4AF37]" />
             <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block">{t("auto.t_44", "Інвентаризація (Звірка)")}</label>
          </div>
          <div className="flex gap-3">
            <input type="number" inputMode="decimal" placeholder={`${t('inventoryDetail.actual', 'Фактично')} (${unit})`} value={auditAmount} onChange={(e) => setAuditAmount(e.target.value)} className="w-2/3 bg-[#110E0E] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 rounded-2xl p-4 outline-none font-bold text-center text-lg transition-all shadow-inner" />
            <button onClick={handleAudit} disabled={auditAmount === ''} className="w-1/3 bg-[#110E0E] text-[#D4AF37] border border-[#D4AF37]/30 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all disabled:opacity-50 shadow-sm">{t("auto.t_46", "Звірити")}</button>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[32px] p-6 shadow-xl">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-4 flex items-center gap-2"><History size={14} className="text-[#D4AF37]" />{t("auto.t_47", "Історія руху товару")}</label>
          {itemLogs.length === 0 ?
          <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest text-center py-6 border border-dashed border-[#2A2323] rounded-2xl">{t("auto.t_48", "Історія порожня")}</p> :

          <div className="space-y-3">
               {itemLogs.slice(0, 10).map((log) =>
            <div key={log.id} className="flex justify-between items-center py-3 border-b border-[#2A2323] last:border-0">
                   <div>
                     <p className="text-[#F4EFEA] font-bold text-xs leading-tight mb-1">{log.reason}</p>
                     <p className="text-[#8C7A7A] text-[9px] font-medium tracking-wide">{new Date(log.timestamp).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                   <div className="text-right">
                     <p className={`font-black text-sm ${log.type === 'IN' ? 'text-[#D4AF37]' : log.type === 'WASTE' ? 'text-red-400' : 'text-[#F4EFEA]'}`}>
                       {log.type === 'IN' ? '+' : '-'}{log.amount} {log.unit}
                     </p>
                     <p className="text-[#8C7A7A] text-[9px] font-medium mt-0.5">{Number(log.price).toFixed(2)} ₴/{log.unit}</p>
                   </div>
                 </div>
            )}
            {itemLogs.length > 10 && <p className="text-center text-[#8C7A7A] text-[10px] mt-4 font-bold uppercase">Показано останні 10 записів</p>}
             </div>
          }
        </div>
      </div>
    </motion.div>
  );
});

export default InventoryDetail;