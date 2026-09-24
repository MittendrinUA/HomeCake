import React, { useState, memo } from 'react';
import { Edit2, Trash2, Camera, Layers, ClipboardList, History } from 'lucide-react';

const InventoryDetail = memo(function InventoryDetail({ item, onUpdate, onDelete, onWaste, askConfirm, askPrompt, showToast, logs, logMovement, compressImage }) {
  const [amount, setAmount] = useState('');
  const [addedCost, setAddedCost] = useState('');
  const [auditAmount, setAuditAmount] = useState('');
  const [compName, setCompName] = useState(''); 

  if (!item) return null;

  const quantity = Number(item.quantity) || 0;
  const price = Number(item.price) || 0;
  const unit = item.unit || 'г';
  const name = item.name || 'Без назви';
  const isMix = item.isMix || false;
  const mixItems = item.mixItems || [];

  const calculateProportionalMix = (invItem, newTotalQty) => {
      if (!invItem.isMix || !invItem.mixItems) return { mixItems: invItem.mixItems || [], price: invItem.price };
      if (newTotalQty <= 0) return { mixItems: [], price: 0 };
      const proportion = newTotalQty / (invItem.quantity || 1);
      const newMixItems = invItem.mixItems.map(mi => ({...mi, quantity: Number((mi.quantity * proportion).toFixed(2)), cost: Number((mi.cost * proportion).toFixed(2))})).filter(mi => mi.quantity > 0.01);
      const tQ = newMixItems.reduce((s,i)=>s+i.quantity,0);
      const tC = newMixItems.reduce((s,i)=>s+i.cost,0);
      const newPrice = tQ > 0 ? Number((tC/tQ).toFixed(2)) : invItem.price;
      return { mixItems: newMixItems, price: newPrice };
  };

  const handleAdd = () => {
    const addedQty = Number(amount);
    if (addedQty <= 0) return;
    
    const newQty = Number(Math.max(0, quantity + addedQty).toFixed(2));
    let updatePayload = { quantity: newQty };
    let movementReason = 'Поповнення';

    if (isMix) {
       if (!compName) { showToast("Введіть назву фрукта/компонента!"); return; }
       const addedC = Number(addedCost) || 0;
       const newMixItem = { id: Date.now().toString(), name: compName, quantity: addedQty, cost: addedC };
       const newMixItems = [...mixItems, newMixItem];
       
       const tQ = newMixItems.reduce((s,i)=>s+i.quantity,0);
       const tC = newMixItems.reduce((s,i)=>s+i.cost,0);
       const newAvgPrice = tQ > 0 ? (tC/tQ) : 0;
       
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

  const handleImageChange = async (e) => { 
    const f = e.target.files[0]; 
    if(f && compressImage){ 
        const img = await compressImage(f); 
        onUpdate({imageUrl: img}); 
    } 
  }

  const itemLogs = logs.filter(l => l.invId === item.id).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="p-4 pb-24">
      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 mb-6 shadow-lg">
        
        <div className="flex justify-between items-start mb-8 gap-2">
          <div className="flex items-center gap-4">
             <div className="relative w-16 h-16 rounded-2xl bg-[#151212] border border-[#2A2323] flex-shrink-0 bg-cover bg-center overflow-hidden shadow-inner group" style={{backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none'}}>
                {!item.imageUrl && <Camera size={24} className="text-[#2A2323] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                <input type="file" accept="image/*" id="inv-img" className="hidden" onChange={handleImageChange} />
                <label htmlFor="inv-img" className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera size={16} className="text-white"/>
                </label>
                <label htmlFor="inv-img" className="absolute bottom-1 right-1 bg-[#151212]/80 p-1 rounded-full cursor-pointer md:hidden border border-[#2A2323]">
                   <Camera size={10} className="text-[#8C7A7A]"/>
                </label>
             </div>
             <div>
               <label className="text-[#8C7A7A] text-xs uppercase font-bold tracking-widest block mb-1">Товар</label>
               <h2 className="text-2xl font-bold text-[#F4EFEA] leading-tight pr-2">
                 {name}
                 {isMix && <span className="ml-2 text-[#2AABEE] bg-[#2AABEE]/20 border border-[#2AABEE]/30 px-2 py-1 rounded-lg text-[9px] uppercase font-bold align-middle">Мікс</span>}
               </h2>
             </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button onClick={() => askPrompt("Назва матеріалу", [{name: 'val', label: 'Назва', defaultValue: name}], (res) => { if(res.val) onUpdate({name:res.val}) })} className="text-[#8C7A7A] hover:text-[#D4AF37] p-2 bg-[#151212] rounded-xl border border-[#2A2323]">
              <Edit2 size={16}/>
            </button>
            <button onClick={onDelete} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#151212] rounded-xl border border-[#2A2323]">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <label className="text-[#8C7A7A] text-xs uppercase font-bold tracking-widest block mb-2">На складі</label>
        <p className="text-[#D4AF37] text-5xl mb-8 font-black">
          {quantity} <span className="text-xl font-medium text-[#8C7A7A]">{unit}</span>
        </p>

        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block mb-2">Собівартість за 1 {unit}</label>
        <div className="flex items-center bg-[#151212] border border-[#2A2323] rounded-2xl p-4">
          <input type="number" inputMode="decimal" value={price} onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })} disabled={isMix} className={`bg-transparent text-[#F4EFEA] text-2xl font-bold w-full outline-none focus:text-[#D4AF37] transition-colors ${isMix ? 'opacity-50' : ''}`}/>
          <span className="text-[#8C7A7A] font-bold ml-3 text-lg">₴</span>
        </div>
        <p className="text-[#8C7A7A] text-[10px] mt-2 px-1">
          {isMix ? 'Ціна міксу розраховується автоматично на основі його складу.' : 'Ви можете змінити цю ціну вручну, або вона перерахується автоматично при поповненні складу нижче.'}
        </p>
      </div>

      {isMix && (
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-4">
             <Layers size={16} className="text-[#2AABEE]"/>
             <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block">Склад міксу на сьогодні</label>
          </div>
          {mixItems.length === 0 ? (
             <p className="text-[#8C7A7A] text-xs text-center py-4 font-medium border border-dashed border-[#2A2323] rounded-2xl">Кошик порожній. Додайте фрукти нижче!</p>
          ) : (
             <div className="space-y-3">
               {mixItems.map((comp, idx) => (
                 <div key={idx} className="flex justify-between items-center py-2 border-b border-[#2A2323] last:border-0">
                   <div>
                     <p className="text-[#F4EFEA] font-bold text-sm leading-tight">{comp.name}</p>
                     <p className="text-[#8C7A7A] text-[10px] mt-0.5">Витрачено: {comp.cost.toFixed(2)} ₴</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[#D4AF37] font-black text-sm">{comp.quantity} {unit}</p>
                     <p className="text-[#8C7A7A] text-[10px]">{comp.quantity > 0 ? (comp.cost/comp.quantity).toFixed(2) : 0} ₴/1{unit}</p>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      )}

      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg mb-6">
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-3 block">Надходження / Списання</label>
        
        {isMix && (
           <input type="text" placeholder="Що саме додаємо? (напр. Полуниця)" value={compName} onChange={(e) => setCompName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-bold text-sm transition-colors mb-3"/>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <input type="number" inputMode="decimal" placeholder={`Кількість (${unit})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-bold text-center text-lg transition-colors"/>
          <input type="number" inputMode="decimal" placeholder="Вартість (₴)" value={addedCost} onChange={(e) => setAddedCost(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#D4AF37] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-bold text-center text-lg transition-colors"/>
        </div>

        {Number(amount) > 0 && Number(addedCost) > 0 && (
           <div className="mb-5 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl flex justify-between items-center">
              <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">{isMix ? 'Компонент міксу:' : 'Нова партія:'}</span>
              <span className="text-[#F4EFEA] font-bold text-sm">{(Number(addedCost) / Number(amount)).toFixed(2)} ₴ <span className="text-[#8C7A7A] text-[10px]">/ 1 {unit}</span></span>
           </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleAdd} disabled={!amount || (isMix && !compName) || (isMix && !addedCost)} className="flex-1 bg-[#D4AF37] text-[#151212] shadow-lg shadow-[#D4AF37]/20 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
            Поповнити
          </button>
          <button onClick={handleSubtract} disabled={!amount} className="flex-1 bg-[#151212] text-[#F4EFEA] border border-[#2A2323] py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
            Списати
          </button>
          <button onClick={handleWasteAction} disabled={!amount} className="flex-1 bg-red-900/20 text-red-400 border border-red-500/20 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
            В брак
          </button>
        </div>
        <p className="text-center text-[#8C7A7A] text-[9px] mt-4 uppercase tracking-widest leading-relaxed">
           {isMix ? 'При поповненні введіть назву фрукта. При списанні - складники зменшаться пропорційно.' : 'При поповненні з вказаною вартістю, програма перерахує середню ціну. "В брак" зафіксує фінансові збитки.'}
        </p>
      </div>

      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg mb-6">
        <div className="flex items-center gap-2 mb-3">
           <ClipboardList size={16} className="text-[#D4AF37]"/>
           <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block">Інвентаризація (Звірка)</label>
        </div>
        <p className="text-[#8C7A7A] text-[10px] mb-4">Введіть фактичну вагу товару, яку показують ваші ваги. Програма сама вирахує різницю.</p>
        <div className="flex gap-3">
          <input type="number" inputMode="decimal" placeholder={`Фактично (${unit})`} value={auditAmount} onChange={(e) => setAuditAmount(e.target.value)} className="w-2/3 bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-bold text-center text-lg transition-colors"/>
          <button onClick={handleAudit} disabled={auditAmount === ''} className="w-1/3 bg-[#151212] text-[#D4AF37] border border-[#D4AF37]/30 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
            Звірити
          </button>
        </div>
      </div>

      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg">
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-4 flex items-center gap-1.5"><History size={14}/> Історія руху товару</label>
        {itemLogs.length === 0 ? (
           <p className="text-[#8C7A7A] text-xs text-center py-4">Історія порожня</p>
        ) : (
           <div className="space-y-3">
             {itemLogs.map(log => (
               <div key={log.id} className="flex justify-between items-center py-2 border-b border-[#2A2323] last:border-0">
                 <div>
                   <p className="text-[#F4EFEA] font-bold text-sm leading-tight">{log.reason}</p>
                   <p className="text-[#8C7A7A] text-[10px] mt-0.5">{new Date(log.timestamp).toLocaleString('uk-UA', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                 </div>
                 <div className="text-right">
                   <p className={`font-black text-sm ${log.type === 'IN' ? 'text-[#D4AF37]' : log.type === 'WASTE' ? 'text-red-400' : 'text-[#F4EFEA]'}`}>
                     {log.type === 'IN' ? '+' : '-'}{log.amount} {log.unit}
                   </p>
                   <p className="text-[#8C7A7A] text-[10px]">{Number(log.price).toFixed(2)} ₴/{log.unit}</p>
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
});

export default InventoryDetail;
