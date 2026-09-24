import React, { useState, useEffect, memo, useMemo } from 'react';
import { PackageOpen, CheckCircle, CheckSquare, Square, Edit2, Trash2, CalendarClock, ChevronRight } from 'lucide-react';

const OrdersList = memo(function OrdersList({ sales, recipes, costFn, onDelete, onComplete, invoiceMode, selectedForInvoice, toggleSelection, onEditOrder }) {
  const [filter, setFilter] = useState('planned'); 
  useEffect(() => { if(invoiceMode) setFilter('completed'); }, [invoiceMode]);
  
  const processedSales = useMemo(() => {
    const filteredSales = sales.filter(s => filter === 'completed' ? s.status !== 'planned' : s.status === 'planned');
    const sortedSales = [...filteredSales].sort((a,b) => { 
      if (filter === 'planned') { 
        const timeA = new Date(`${a.date || '1970-01-01'}T${a.dueTime||'00:00'}`).getTime(); 
        const timeB = new Date(`${b.date || '1970-01-01'}T${b.dueTime||'00:00'}`).getTime(); 
        return timeA - timeB; 
      } 
      return (b.createdAt || 0) - (a.createdAt || 0); 
    });

    return sortedSales.map(order => {
      const items = order.items || [{ recipeId: order.recipeId, fillingId: order.fillingId, quantity: order.quantity, sellPrice: order.sellPrice }]; 
      let tr = (order.decorPrice || 0); 
      let dynamicTc = (order.decorPrice || 0) + (order.internalCost || 0); 
      
      const itemsDisplay = items.map((item, idx) => { 
        const rec = recipes.find(r => r.id === item.recipeId); if (!rec) return null; 
        const fil = rec.fillings?.find(f => f.id === item.fillingId); 
        const dN = fil ? `${rec.name} (${fil.name})` : rec.name; 
        dynamicTc += (costFn(rec, item.fillingId) / Math.max(rec.baseYield || 1, 0.001)) * item.quantity; 
        tr += (item.sellPrice || 0); 
        
        return {
          id: idx,
          name: dN,
          quantity: item.quantity,
          unit: rec.unit
        };
      }); 
      
      const tc = order.historicalCost !== undefined ? order.historicalCost : dynamicTc;
      const profit = tr - tc; 
      
      return { ...order, tr, tc, profit, itemsDisplay };
    });
  }, [sales, filter, recipes, costFn]);

  const [swipeId, setSwipeId] = useState(null); 
  let startX = 0; let startY = 0;

  useEffect(() => { setSwipeId(null); }, [sales, filter]);
  
  const handleTouchStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
  const handleTouchEnd = (e, id, order) => { 
    const dx = e.changedTouches[0].clientX - startX; 
    const dy = Math.abs(e.changedTouches[0].clientY - startY); 
    if(filter === 'planned' && !invoiceMode && dx > 90 && dy < 40) { 
      setSwipeId(id); 
      setTimeout(() => {
         onComplete(order);
         setSwipeId(null);
      }, 150); 
    } 
  };

  return (
    <div className="pb-36">
      {!invoiceMode && (
        <div className="flex bg-[#1E1919] mx-4 rounded-[20px] p-1.5 mb-5 shadow-sm border border-[#2A2323]">
          <button onClick={() => setFilter('planned')} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-xl transition-all border ${filter === 'planned' ? 'bg-[#151212] text-[#D4AF37] shadow-md border-[#2A2323]' : 'text-[#8C7A7A] border-transparent'}`}>Активні</button>
          <button onClick={() => setFilter('completed')} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-xl transition-all border ${filter === 'completed' ? 'bg-[#151212] text-[#F4EFEA] shadow-md border-[#2A2323]' : 'text-[#8C7A7A] border-transparent'}`}>Історія</button>
        </div>
      )}
      
      {processedSales.length === 0 && (
        <div className="p-8 text-center flex flex-col items-center mt-10">
          <PackageOpen size={48} className="text-[#2A2323] mb-4" />
          <p className="text-[#8C7A7A] font-medium">Список порожній.</p>
        </div>
      )}
      
      {processedSales.map(order => { 
        const isSelected = selectedForInvoice.includes(order.id); 
        
        return (
          <div key={order.id} className="relative mb-4 mx-4">
            {filter==='planned'&&!invoiceMode && (
              <div className="absolute inset-0 bg-[#5B7A5A] rounded-[32px] flex items-center pl-8">
                <CheckCircle className="text-white" size={32}/>
              </div>
            )}
            
            <div 
              onTouchStart={handleTouchStart} 
              onTouchEnd={(e)=>handleTouchEnd(e, order.id, order)} 
              onClick={() => invoiceMode && toggleSelection(order.id)} 
              className={`p-5 rounded-[32px] shadow-lg relative transition-all duration-150 z-10 ${swipeId === order.id ? 'translate-x-[120%]' : ''} ${invoiceMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-[#1E1919] border-2 border-[#D4AF37]' : 'bg-[#1E1919] border border-[#2A2323] shadow-black/30'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-start w-full">
                  {invoiceMode && <div className="mt-1">{isSelected ? <CheckSquare className="text-[#D4AF37]" size={20}/> : <Square className="text-[#8C7A7A]" size={20}/>}</div>}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-3">
                      {filter === 'planned' ? (
                        <div className="flex items-center gap-1.5 text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl text-xs border border-[#D4AF37]/20">
                          <CalendarClock size={14} /> {order.date} {order.dueTime ? `о ${order.dueTime}` : ''}
                        </div>
                      ) : ( <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest">{order.date}</p> )}
                      
                      {!invoiceMode && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); onEditOrder(order); }} className="text-[#8C7A7A] hover:text-[#D4AF37] p-2 bg-[#151212] rounded-xl border border-[#2A2323]"><Edit2 size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(order.id); }} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#151212] rounded-xl border border-[#2A2323]"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                    
                    {order.customer && <p className="text-[#F4EFEA] font-black text-xl mb-3 tracking-tight">{order.customer}</p>}
                    
                    <div className="bg-[#151212] rounded-2xl p-4 mb-4 border border-[#2A2323]">
                      {order.itemsDisplay.map(item => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-[#2A2323] last:border-0">
                          <span className="text-[#F4EFEA] text-sm pr-2 flex-1 font-medium">• {item.name}</span>
                          <span className="text-[#D4AF37] font-bold text-xs bg-[#151212] px-2 py-1 rounded-lg border border-[#2A2323]">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                      {order.decorPrice > 0 && <div className="flex justify-between py-2 text-[#8C7A7A] text-xs mt-1 border-t border-[#2A2323] pt-2 font-medium"><span>+ Декор / Коробка</span><span className="text-[#F4EFEA]">{order.decorPrice} ₴</span></div>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`grid grid-cols-3 gap-2 p-3 rounded-2xl ${isSelected ? 'bg-[#D4AF37]/5' : 'bg-[#151212]'} border border-[#2A2323]`}>
                <div className="text-center"><p className="text-[8px] uppercase font-bold text-[#8C7A7A] mb-1 tracking-widest">Заг. Чек</p><p className="text-[#D4AF37] font-bold text-base">{order.tr.toFixed(2)}₴</p></div>
                <div className="text-center border-l border-r border-[#2A2323]"><p className="text-[8px] uppercase font-bold text-[#8C7A7A] mb-1 tracking-widest">Витрати</p><p className="text-[#F4EFEA] font-bold text-base">{order.tc.toFixed(2)}₴</p></div>
                <div className="text-center"><p className="text-[8px] uppercase font-bold text-[#8C7A7A] mb-1 tracking-widest">Прибуток</p><p className="text-[#5B7A5A] font-black text-base">{order.profit > 0 ? '+' : ''}{order.profit.toFixed(2)}₴</p></div>
              </div>
              
              {filter === 'planned' && !invoiceMode && (
                <p className="text-center text-[#8C7A7A] text-[10px] mt-4 flex justify-center items-center gap-1 uppercase tracking-widest font-bold"><ChevronRight size={14}/> Свайп вправо для видачі <ChevronRight size={14}/></p>
              )}
            </div>
          </div>
        ); 
      })}
    </div>
  );
});

export default OrdersList;
