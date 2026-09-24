import React from 'react';
import { Trash2, RotateCcw, XCircle, AlertTriangle } from 'lucide-react';

export default function Trash({ 
  recipes, categories, inventory, preps, sales, customers, 
  onRestore, onPermanentDelete, onEmptyTrash 
}) {
  
  // Збираємо всі видалені елементи в один масив
  const deletedItems = [
    ...recipes.filter(i => i.isDeleted).map(i => ({ ...i, colName: 'recipes', typeName: 'Рецепт' })),
    ...categories.filter(i => i.isDeleted).map(i => ({ ...i, colName: 'categories', typeName: 'Папка' })),
    ...inventory.filter(i => i.isDeleted).map(i => ({ ...i, colName: 'inventory', typeName: 'Склад' })),
    ...preps.filter(i => i.isDeleted).map(i => ({ ...i, colName: 'preps', typeName: 'Заготівля' })),
    ...sales.filter(i => i.isDeleted).map(i => ({ ...i, colName: 'sales', typeName: 'Замовлення' })),
    ...customers.filter(i => i.isDeleted).map(i => ({ ...i, colName: 'customers', typeName: 'Клієнт' }))
  ].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  const daysLeft = (timestamp) => {
    if (!timestamp) return 30;
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - days);
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-xl font-bold text-[#F4EFEA] flex items-center gap-2">
          <Trash2 className="text-[#D4AF37]" size={24} />
          Кошик
        </h2>
        {deletedItems.length > 0 && (
          <button 
            onClick={onEmptyTrash}
            className="text-xs text-red-400 font-bold tracking-widest uppercase bg-red-400/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            Очистити все
          </button>
        )}
      </div>

      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 rounded-xl mb-4 flex gap-3 items-start">
        <AlertTriangle className="text-[#D4AF37] shrink-0 mt-0.5" size={20} />
        <p className="text-[#F4EFEA] text-sm leading-snug">
          Елементи в кошику автоматично видаляються через <span className="font-bold text-[#D4AF37]">30 днів</span>.
        </p>
      </div>

      {deletedItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 opacity-50 pb-20">
          <Trash2 size={48} className="text-[#8C7A7A] mb-4" />
          <p className="text-lg font-bold text-[#F4EFEA]">Кошик порожній</p>
          <p className="text-sm text-[#8C7A7A] mt-1">Тут будуть відображатися видалені файли</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-24 hide-scrollbar">
          {deletedItems.map(item => (
            <div key={item.id + item.colName} className="bg-[#1E1919] p-4 rounded-[20px] border border-[#2A2323] flex items-center justify-between gap-3 shadow-md">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-[#2A2323] text-[#8C7A7A] px-2 py-0.5 rounded-full">
                    {item.typeName}
                  </span>
                  <span className="text-[10px] text-red-400 font-bold">
                    Залишилось: {daysLeft(item.deletedAt)} дн.
                  </span>
                </div>
                <h3 className="font-bold text-[#F4EFEA] text-base truncate">
                  {item.name || item.customerName || (item.colName === 'sales' ? `Замовлення #${item.id.slice(-4)}` : 'Без назви')}
                </h3>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => onRestore(item.colName, item.id)}
                  className="p-2.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/20 active:scale-90 transition-all"
                  title="Відновити"
                >
                  <RotateCcw size={20} />
                </button>
                <button 
                  onClick={() => onPermanentDelete(item.colName, item.id, item.typeName)}
                  className="p-2.5 bg-red-400/10 text-red-400 rounded-xl hover:bg-red-400/20 active:scale-90 transition-all"
                  title="Видалити назавжди"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
