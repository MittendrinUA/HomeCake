import React, { useState, useEffect, memo } from 'react';
import { ShoppingCart, PackageOpen, Trash2, Users, Clock, AlertCircle, Send } from 'lucide-react';

const AddOrderForm = memo(function AddOrderForm({ recipes, inventory, preps, onSave, customers, initialData }) {
  const [cart, setCart] = useState(initialData?.items || []); 
  const [recipeId, setRecipeId] = useState(''); 
  const [fillingId, setFillingId] = useState(''); 
  const [quantity, setQuantity] = useState('1'); 
  const [itemPrice, setItemPrice] = useState(''); 
  const [customer, setCustomer] = useState(initialData?.customer || ''); 
  const [showCusts, setShowCusts] = useState(false);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]); 
  const [dueTime, setDueTime] = useState(initialData?.dueTime || ''); 
  const [decorPrice, setDecorPrice] = useState(initialData?.decorPrice || ''); 
  const [internalCost, setInternalCost] = useState(initialData?.internalCost || ''); 
  const [status, setStatus] = useState(initialData?.status || 'planned'); 
  const [missingIngredients, setMissingIngredients] = useState([]);

  const selectedRecipe = recipes.find(r => r.id === recipeId);
  
  useEffect(() => { 
    if (selectedRecipe) { 
      if (selectedRecipe.fillings?.length > 0) { 
        if (!fillingId || !selectedRecipe.fillings.find(f => f.id === fillingId)) setFillingId(selectedRecipe.fillings[0].id); 
      } else {
        setFillingId(''); 
      }
      
      if (selectedRecipe.defaultPrice > 0) { 
        const p = (selectedRecipe.defaultPrice / Math.max(selectedRecipe.baseYield || 1, 0.001)) * Number(quantity || 1); 
        setItemPrice(Number.isInteger(p) ? p.toString() : p.toFixed(2)); 
      } 
    } 
  }, [recipeId, quantity, recipes]);
  
  useEffect(() => { 
    if (cart.length === 0 || !inventory) { setMissingIngredients([]); return; } 
    const reqMap = {}; 
    
    const processIngs = (ings, prop) => {
       (ings || []).forEach(ing => {
          if (ing.prepId) {
             const p = preps.find(pr => pr.id === ing.prepId);
             if (p) processIngs(p.ingredients, prop * (ing.amount / Math.max(p.baseYield || 1, 0.001)));
          } else if (ing.invId) {
             reqMap[ing.invId] = (reqMap[ing.invId] || 0) + (ing.amount * prop);
          }
       });
    };

    cart.forEach(item => { 
      const r = recipes.find(r => r.id === item.recipeId); if (!r) return; 
      const p = item.quantity / Math.max(r.baseYield || 1, 0.001); 
      processIngs(r.ingredients, p);
      if (item.fillingId && r.fillings) { 
        const f = r.fillings.find(f => f.id === item.fillingId); 
        if (f) processIngs(f.ingredients, p);
      } 
    }); 
    
    const miss = []; 
    Object.keys(reqMap).forEach(id => { 
      const i = inventory.find(i => i.id === id); 
      const av = i ? i.quantity : 0; 
      if (av < reqMap[id]) miss.push({ name: i ? i.name : '?', missingAmt: (reqMap[id] - av).toFixed(2), unit: i ? i.unit : '?' }); 
    }); 
    setMissingIngredients(miss); 
  }, [cart, inventory, recipes, preps]);

  const handleAddToCart = () => { 
    if (!selectedRecipe || !itemPrice) return; 
    setCart([...cart, { recipeId, fillingId, quantity: Number(quantity), sellPrice: Number(itemPrice) }]); 
    setRecipeId(''); setFillingId(''); setQuantity('1'); setItemPrice(''); 
  };
  
  const totalVal = cart.reduce((s, i) => s + i.sellPrice, 0) + Number(decorPrice || 0);
  const filteredCusts = customers.filter(c => c.name.toLowerCase().includes(customer.toLowerCase()) && customer.length > 0 && c.name !== customer);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-10">
        <div className="flex bg-[#1E1919] border border-[#2A2323] rounded-[20px] p-1.5 mb-6 shadow-sm">
          <button onClick={() => setStatus('planned')} className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-xl transition-all ${status === 'planned' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>На дату</button>
          <button onClick={() => setStatus('completed')} className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-xl transition-all ${status === 'completed' ? 'bg-[#151212] text-[#F4EFEA] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>Видано</button>
        </div>
        
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 mb-5 shadow-lg shadow-black/20">
          <h3 className="text-[#F4EFEA] font-bold text-lg mb-5 flex items-center gap-2 tracking-wide"><ShoppingCart size={20} className="text-[#D4AF37]"/> Кошик</h3>
          
          {cart.length === 0 ? (
            <div className="bg-[#151212] rounded-2xl p-8 text-center border border-dashed border-[#2A2323] mb-6 flex flex-col items-center">
              <PackageOpen size={36} className="text-[#2A2323] mb-3" />
              <p className="text-[#8C7A7A] text-sm font-medium">Ваш кошик порожній.<br/>Час додати туди щось солоденьке!</p>
            </div>
          ) : (
            <div className="bg-[#151212] rounded-2xl p-4 mb-6 border border-[#2A2323]">
              {cart.map((item, idx) => { 
                const rec = recipes.find(r => r.id === item.recipeId); 
                const fil = rec?.fillings?.find(f => f.id === item.fillingId); 
                return (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-[#2A2323] last:border-0">
                    <div className="flex-1 pr-3">
                      <p className="text-[#F4EFEA] font-semibold leading-tight">{rec?.name} {fil ? <span className="text-[#8C7A7A] text-xs font-normal">({fil.name})</span> : ''}</p>
                      <p className="text-[#D4AF37] font-bold text-sm mt-1">{item.quantity} {rec?.unit} <span className="text-[#8C7A7A] font-normal mx-1">на</span> {item.sellPrice.toFixed(2)} ₴</p>
                    </div>
                    <button onClick={() => setCart(cart.filter((_,i)=>i!==idx))} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#1E1919] border border-[#2A2323] rounded-xl"><Trash2 size={16}/></button>
                  </div>
                ) 
              })}
            </div>
          )}

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-5 mb-2">
            <label className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-3 block">Додати позицію</label>
            <select value={recipeId} onChange={e=>setRecipeId(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-xl mb-4 outline-none font-medium appearance-none">
              <option value="">Оберіть десерт...</option>
              {[...recipes].sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            
            {selectedRecipe && selectedRecipe.fillings?.length > 0 && (
              <select value={fillingId} onChange={e=>setFillingId(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-xl mb-4 outline-none font-medium appearance-none">
                {selectedRecipe.fillings.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input type="number" inputMode="decimal" placeholder="К-ть" value={quantity} onChange={e=>setQuantity(e.target.value)} min="1" className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-xl outline-none font-medium text-center" />
              <input type="number" inputMode="decimal" placeholder="Ціна ₴" value={itemPrice} onChange={e=>setItemPrice(e.target.value)} className="w-full bg-[#151212] border border-[#D4AF37]/50 text-[#D4AF37] focus:border-[#D4AF37] p-4 rounded-xl outline-none font-bold text-center" />
            </div>
            
            <button onClick={handleAddToCart} disabled={!recipeId || !itemPrice} className="w-full bg-[#151212] border border-[#D4AF37]/30 disabled:opacity-50 text-[#D4AF37] font-bold py-4 rounded-xl active:scale-95 uppercase text-xs tracking-widest">+ В кошик</button>
          </div>
        </div>
        
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg shadow-black/20 mb-6 relative">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Клієнт</label>
          <input type="text" placeholder="Ім'я" value={customer} onFocus={()=>setShowCusts(true)} onBlur={()=>setTimeout(()=>setShowCusts(false),200)} onChange={e=>setCustomer(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-2xl mb-5 outline-none font-medium" />
          
          {showCusts && filteredCusts.length > 0 && (
            <div className="absolute left-6 right-6 top-24 bg-[#151212] border border-[#D4AF37] rounded-xl z-30 shadow-2xl overflow-hidden">
              {filteredCusts.map(c=>(
                <div key={c.id} onClick={()=>{setCustomer(c.name); setShowCusts(false)}} className="p-4 border-b border-[#2A2323] last:border-0 active:bg-[#1E1919] flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3"><Users size={16} className="text-[#D4AF37]"/><span className="text-[#F4EFEA] font-bold">{c.name}</span></div>
                  <span className="text-[#8C7A7A] text-[10px] uppercase tracking-widest">{c.orderCount} зам.</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">{status === 'completed' ? 'Дата' : 'Дата видачі'}</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-xl outline-none font-medium text-sm" />
            </div>
            {status === 'planned' && (
              <div>
                <label className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><Clock size={12}/> Час</label>
                <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-xl outline-none font-medium text-sm" />
              </div>
            )}
          </div>
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Декор для клієнта (в чек)</label>
          <input type="number" inputMode="decimal" placeholder="Сума (₴)" value={decorPrice} onChange={e=>setDecorPrice(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none font-bold mb-4" />

          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Внутрішня собівартість (Фрукти/Пакування, не в чек)</label>
          <input type="number" inputMode="decimal" placeholder="Сума витрат (₴)" value={internalCost} onChange={e=>setInternalCost(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none font-bold" />
        </div>
        
        {missingIngredients.length > 0 && (
          <div className="mb-6 p-6 bg-[#151212] border border-red-900/50 rounded-[32px] shadow-lg">
            <div className="flex items-center gap-2 mb-4 text-red-400 font-bold text-sm tracking-wide"><AlertCircle size={18} /><span>Дефіцит інгредієнтів:</span></div>
            <ul className="text-[#8C7A7A] text-sm space-y-2 pl-2 mb-6">
              {missingIngredients.map((item, idx) => (
                <li key={idx} className="flex justify-between border-b border-[#2A2323] pb-1"><span>{item.name}</span><span className="font-bold text-red-400">{item.missingAmt} {item.unit}</span></li>
              ))}
            </ul>
            <button onClick={()=>window.open(`https://t.me/share/url?url=${encodeURIComponent(`🛒 *КУПИТИ* ${customer ? `(${customer})` : ''}\n` + missingIngredients.map(i=>`🔹 ${i.name} — ${i.missingAmt}${i.unit}`).join('\n'))}`, '_blank')} className="w-full bg-[#1E1919] border border-[#2A2323] text-[#F4EFEA] font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 text-sm">
              <Send size={18} className="text-[#D4AF37]"/> В Telegram
            </button>
          </div>
        )}
      </div>

      <div className="bg-[#151212]/95 backdrop-blur-md border-t border-[#2A2323] p-5 shrink-0 z-20">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-[#8C7A7A] font-bold uppercase tracking-widest text-xs">Разом:</span>
          <span className="text-[#D4AF37] text-3xl font-black">{totalVal.toFixed(2)} ₴</span>
        </div>
        <button onClick={() => onSave({ items: cart, decorPrice: Number(decorPrice), internalCost: Number(internalCost), customer, date, dueTime: status === 'planned' ? dueTime : null, status, totalPrice: totalVal }, initialData)} disabled={cart.length === 0} className={`w-full disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-bold text-lg active:scale-95 shadow-xl ${status === 'completed' ? 'bg-[#5B7A5A] shadow-[#5B7A5A]/20' : 'bg-[#D4AF37] shadow-[#D4AF37]/20'}`}>
          {initialData ? 'Зберегти зміни' : (status === 'completed' ? 'Зафіксувати продаж' : 'Зберегти замовлення')}
        </button>
      </div>
    </div>
  );
});

export default AddOrderForm;
