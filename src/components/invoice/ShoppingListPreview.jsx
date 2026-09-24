import React, { memo } from 'react';
import { Send } from 'lucide-react';

const ShoppingListPreview = memo(function ShoppingListPreview({ inventory, sales, recipes, preps }) {
  const plannedSales = sales.filter(s => s.status === 'planned'); 
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

  plannedSales.forEach(order => { 
    const items = order.items || [{ recipeId: order.recipeId, fillingId: order.fillingId, quantity: order.quantity }]; 
    items.forEach(item => { 
      const r = recipes.find(r => r.id === item.recipeId); if (!r) return; 
      const p = item.quantity / Math.max(r.baseYield || 1, 0.001); 
      processIngs(r.ingredients, p);
      if (item.fillingId && r.fillings) { 
        const fil = r.fillings.find(f => f.id === item.fillingId); 
        if (fil) processIngs(fil.ingredients, p);
      } 
    }); 
  }); 
  
  const def = []; 
  inventory.forEach(i => { 
    const av = i.quantity || 0; 
    const rq = reqMap[i.id] || 0; 
    if (rq > 0 && av < rq) def.push({ name: i.name, missingAmt: (rq - av).toFixed(1), unit: i.unit, reason: 'Дефіцит' }); 
  }); 
  
  const dt = new Date().toLocaleDateString('uk-UA');
  
  return (
    <div className="p-4 pb-28">
      <div className="bg-[#FDFBF7] text-[#2A2323] p-6 rounded-sm shadow-lg max-w-full font-mono text-sm relative mb-6 border border-[#D4AF37]/30">
        <div className="text-center mb-6 border-b-2 border-dashed border-[#8C7A7A]/30 pb-4">
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-[#151212]">Whisked</h2>
          <p className="text-[#8C7A7A] text-xs">Список закупівель</p>
          <p className="font-bold mt-2">{dt}</p>
        </div>
        
        {def.length === 0 ? ( 
          <div className="text-center py-10">
            <p className="font-bold text-lg text-[#5B7A5A]">Склад повністю готовий! 📦</p>
            <p className="text-[#8C7A7A] mt-2">Інгредієнтів вистачає на всі замовлення.</p>
          </div> 
        ) : (
          <div className="mb-4">
            {def.sort((a,b) => (a.name||'').localeCompare(b.name||'')).map((i, x) => (
              <div key={x} className="flex justify-between py-3 border-b border-[#8C7A7A]/10 items-center">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 border-2 border-[#2A2323] rounded-sm mt-0.5"></div>
                  <div>
                    <span className="font-bold text-base leading-tight block text-[#151212]">{i.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-lg text-red-600">{i.missingAmt}</span>
                  <span className="font-bold ml-1 text-sm text-[#8C7A7A]">{i.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {def.length > 0 && (
        <button onClick={()=>{ window.open(`https://t.me/share/url?url=${encodeURIComponent(`🛒 *СПИСОК ПОКУПОК Whisked* (${dt})\n\n` + def.map(i=>`🔹 ${i.name} — ${i.missingAmt} ${i.unit}`).join('\n'))}`, '_blank'); }} className="w-full bg-[#2AABEE] text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 text-lg">
          <Send size={20}/> Відправити в Telegram
        </button>
      )}
    </div>
  );
});

export default ShoppingListPreview;
