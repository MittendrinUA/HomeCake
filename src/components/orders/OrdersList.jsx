import { useTranslation } from "react-i18next";
import React, { useState, useEffect, memo, useMemo } from 'react';
import { PackageOpen, CheckCircle, CheckSquare, Square, Edit2, Trash2, CalendarClock, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import EmptyState from '../ui/EmptyState';

const OrderItem = memo(({ order, filter, invoiceMode, isSelected, onDelete, onComplete, onRestore, toggleSelection, onEditOrder }) => {
  const { t } = useTranslation();
  const [isCompletedAnim, setIsCompletedAnim] = useState(false);
  const [isExpanded, setIsExpanded] = useState(filter === 'planned');
  const x = useMotionValue(0);

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 110) {
      setIsCompletedAnim(true);
      setTimeout(() => {
        onComplete(order);
      }, 700);
    }
  };

  const handleCardClick = () => {
    if (invoiceMode) {
      toggleSelection(order.id);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      animate={isCompletedAnim ? { height: 0, opacity: 0, marginBottom: 0, scale: 0.9, transition: { delay: 0.4, duration: 0.3 } } : {}}
      className="relative mb-5 mx-4">
      
      {isCompletedAnim &&
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 0 }}
        animate={{ scale: [0, 1.2, 1, 0.8], opacity: [0, 1, 1, 0], y: [0, -10, -10, -30] }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="bg-gradient-to-tr from-[#5B7A5A] to-[#7DAA7D] rounded-full p-4 shadow-[0_0_30px_rgba(91,122,90,0.6)] border-2 border-[#1E1919]">
            <CheckCircle className="text-white drop-shadow-md" size={48} />
          </div>
        </motion.div>
      }
      
      <motion.div
        style={{ x }}
        animate={isCompletedAnim ? { scale: 0.9, opacity: 0, transition: { duration: 0.3 } } : { scale: 1, opacity: 1 }}
        drag={filter === 'planned' && !invoiceMode && !isCompletedAnim ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.6 }}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        className={`p-5 rounded-3xl relative z-10 bg-gradient-to-b from-[#1E1919] to-[#151212] transition-all duration-300 ${!isExpanded ? 'py-4' : ''} ${invoiceMode || filter === 'completed' || filter === 'planned' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} ${isSelected ? 'border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'border border-[#2A2323] shadow-xl shadow-black/40 hover:border-[#3A3333]'}`}>
        
        {!isExpanded ? (
          // Компактний вигляд (згорнуто)
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-3 items-center flex-1 overflow-hidden">
              {invoiceMode && <div>{isSelected ? <CheckSquare className="text-[#D4AF37]" size={20} /> : <Square className="text-[#8C7A7A]" size={20} />}</div>}
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-bold text-lg truncate">{order.customer || order.itemsDisplay[0]?.name || 'Замовлення'}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-wider">{order.date}</span>
                  {filter === 'planned' && order.dueTime && <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">о {order.dueTime}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 pl-3">
              <div className="text-right">
                <span className="text-[#D4AF37] font-black text-lg">{order.tr.toFixed(2)} <span className="text-xs opacity-80">₴</span></span>
              </div>
              <ChevronRight size={20} className="text-[#8C7A7A]" />
            </div>
          </div>
        ) : (
          // Розгорнутий вигляд (як було)
          <>
            <div className="flex justify-between items-start mb-4 pointer-events-none">
              <div className="flex gap-3 items-start w-full">
                {invoiceMode && <div className="mt-1">{isSelected ? <CheckSquare className="text-[#D4AF37]" size={20} /> : <Square className="text-[#8C7A7A]" size={20} />}</div>}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-4 pointer-events-auto">
                    {filter === 'planned' ?
                    <div className="flex items-center gap-1.5 text-[#D4AF37] font-semibold bg-gradient-to-r from-[#D4AF37]/10 to-transparent pr-4 pl-3 py-1.5 rounded-full text-xs border border-[#D4AF37]/20 shadow-sm">
                        <CalendarClock size={14} /> {order.date} {order.dueTime ? `о ${order.dueTime}` : ''}
                      </div> :
                    <div className="bg-[#151212] px-3 py-1.5 rounded-full border border-[#2A2323] shadow-sm">
                      <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-wider">{order.date}</p>
                    </div>}
                    
                    {!invoiceMode &&
                    <div className="flex items-center gap-2">
                        {filter === 'completed' && onRestore &&
                      <button onClick={(e) => {e.stopPropagation();onRestore(order);}} className="text-[#8C7A7A] hover:text-[#5B7A5A] p-2 bg-[#1A1616] rounded-full border border-[#2A2323] hover:border-[#5B7A5A]/50 active:scale-90 transition-all shadow-sm"><RotateCcw size={14} /></button>
                      }
                        <button onClick={(e) => {e.stopPropagation();onEditOrder(order);}} className="text-[#8C7A7A] hover:text-[#D4AF37] p-2 bg-[#1A1616] rounded-full border border-[#2A2323] hover:border-[#D4AF37]/50 active:scale-90 transition-all shadow-sm"><Edit2 size={14} /></button>
                        <button onClick={(e) => {e.stopPropagation();onDelete(order.id);}} className="text-[#8C7A7A] hover:text-[#E57373] p-2 bg-[#1A1616] rounded-full border border-[#2A2323] hover:border-[#E57373]/50 active:scale-90 transition-all shadow-sm"><Trash2 size={14} /></button>
                        <div className="w-px h-6 bg-[#2A2323] mx-1"></div>
                        <ChevronRight size={20} className="text-[#8C7A7A] transform rotate-90" />
                      </div>
                    }
                  </div>
                  
                  {order.customer && <p className="text-white font-bold text-2xl mb-4 tracking-tight drop-shadow-sm">{order.customer}</p>}
                  
                  <div className="bg-[#151212]/80 rounded-2xl p-4 mb-5 border border-[#2A2323] pointer-events-auto backdrop-blur-sm shadow-inner">
                    {order.itemsDisplay.map((item, idx) =>
                    <div key={item.id} className={`flex justify-between items-center py-2.5 ${idx !== order.itemsDisplay.length - 1 ? 'border-b border-[#2A2323]/50' : ''}`}>
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/70 shrink-0"></div>
                          <span className="text-[#F4EFEA] text-sm font-medium truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center justify-center min-w-[50px] bg-[#1E1919] px-2.5 py-1 rounded-lg border border-[#2A2323] shadow-sm shrink-0 ml-3">
                          <span className="text-[#D4AF37] font-bold text-xs">{item.quantity} {item.unit}</span>
                        </div>
                      </div>
                    )}
                    {order.decorPrice > 0 && <div className="flex justify-between items-center py-2.5 text-[#8C7A7A] text-xs mt-1 border-t border-[#2A2323]/50 font-medium"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#8C7A7A]/50"></div><span>{t("auto.t_90", "+ Декор / Коробка")}</span></div><span className="text-[#F4EFEA] font-semibold">{order.decorPrice} ₴</span></div>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 rounded-2xl border border-[#2A2323] pointer-events-none relative overflow-hidden" style={{ backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.05)' : '#151212' }}>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#5B7A5A]/10 to-transparent pointer-events-none"></div>
              
              <div className="flex-1 flex flex-col items-center py-1.5 z-10">
                <p className="text-[9px] uppercase font-bold text-[#8C7A7A] mb-1.5 tracking-widest">{t("auto.t_91", "Заг. Чек")}</p>
                <p className="text-[#D4AF37] font-bold text-[15px] tracking-tight leading-none">{order.tr.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-80">₴</span></p>
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#2A2323] to-transparent z-10"></div>
              <div className="flex-1 flex flex-col items-center py-1.5 z-10">
                <p className="text-[9px] uppercase font-bold text-[#8C7A7A] mb-1.5 tracking-widest">{t("auto.t_92", "Витрати")}</p>
                <p className="text-[#F4EFEA] font-bold text-[15px] tracking-tight leading-none">{order.tc.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-80">₴</span></p>
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#2A2323] to-transparent z-10"></div>
              <div className="flex-1 flex flex-col items-center py-1.5 z-10">
                <p className="text-[9px] uppercase font-bold text-[#8C7A7A] mb-1.5 tracking-widest">{t("auto.t_93", "Прибуток")}</p>
                <p className="text-[#5B7A5A] font-black text-[15px] tracking-tight leading-none drop-shadow-sm">{order.profit > 0 ? '+' : ''}{order.profit.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-80">₴</span></p>
              </div>
            </div>
            
            {filter === 'planned' && !invoiceMode &&
            <div className="mt-5 flex justify-center items-center pointer-events-none overflow-hidden">
              <motion.div 
                animate={{ x: [0, 5, 0] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#151212] border border-[#2A2323]">
                <p className="text-center text-[#8C7A7A] text-[9px] uppercase tracking-widest font-bold opacity-80">
                  {t("auto.t_94", "Свайп вправо для видачі")}
                </p>
                <ChevronRight size={12} className="text-[#8C7A7A] opacity-60" />
                <ChevronRight size={12} className="text-[#8C7A7A] opacity-60 -ml-2" />
              </motion.div>
            </div>
            }
          </>
        )}
      </motion.div>
    </motion.div>);

});

const OrdersList = memo(function OrdersList({ sales, recipes, costFn, onDelete, onComplete, onRestore, invoiceMode, selectedForInvoice, toggleSelection, onEditOrder }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('planned');
  const [visibleCount, setVisibleCount] = useState(20);
  const [isPending, startTransition] = React.useTransition();
  useEffect(() => {if (invoiceMode) { setFilter('completed'); setVisibleCount(50); }}, [invoiceMode]);

  const processedSales = useMemo(() => {
    const filteredSales = sales.filter((s) => filter === 'completed' ? s.status !== 'planned' : s.status === 'planned');
    const sortedSales = [...filteredSales].sort((a, b) => {
      if (filter === 'planned') {
        const timeA = new Date(`${a.date || '1970-01-01'}T${a.dueTime || '00:00'}`).getTime();
        const timeB = new Date(`${b.date || '1970-01-01'}T${b.dueTime || '00:00'}`).getTime();
        return timeA - timeB;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return sortedSales.map((order) => {
      const items = order.items || [{ recipeId: order.recipeId, fillingId: order.fillingId, quantity: order.quantity, sellPrice: order.sellPrice }];
      let tr = order.decorPrice || 0;
      let dynamicTc = (order.decorPrice || 0) + (order.internalCost || 0);

      const itemsDisplay = items.map((item, idx) => {
        const rec = recipes.find((r) => r.id === item.recipeId);
        if (!rec) {
          tr += item.sellPrice || 0;
          return {
            id: idx,
            name: "Видалений рецепт",
            quantity: item.quantity,
            unit: "шт"
          };
        }
        const fil = rec.fillings?.find((f) => f.id === item.fillingId);
        const dN = fil ? `${rec.name} (${fil.name})` : rec.name;
        dynamicTc += costFn(rec, item.fillingId) / Math.max(rec.baseYield || 1, 0.001) * item.quantity;
        tr += item.sellPrice || 0;

        return {
          id: idx,
          name: dN,
          quantity: item.quantity,
          unit: rec.unit
        };
      });

      const tc = order.historicalCost !== undefined && order.historicalCost !== null ? order.historicalCost : dynamicTc;
      const profit = tr - (tc || 0);

      return { ...order, tr, tc, profit, itemsDisplay };
    });
  }, [sales, filter, recipes, costFn]);

  return (
    <div className="pb-36">
      {!invoiceMode &&
      <div className="flex bg-gradient-to-b from-[#1E1919] to-[#151212] mx-4 rounded-2xl p-1 mb-6 shadow-lg shadow-black/20 border border-[#2A2323]">
          <button onClick={() => startTransition(() => { setFilter('planned'); setVisibleCount(20); })} className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold rounded-xl transition-all duration-300 ${filter === 'planned' ? 'bg-[#151212] text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_2px_10px_-2px_rgba(212,175,55,0.15)]' : 'bg-transparent text-[#8C7A7A] border border-transparent hover:text-[#A69797]'}`}>
            {t("auto.t_95", "Активні")}
          </button>
          <button onClick={() => startTransition(() => { setFilter('completed'); setVisibleCount(20); })} className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold rounded-xl transition-all duration-300 ${filter === 'completed' ? 'bg-[#151212] text-[#F4EFEA] border border-[#3A3333] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.3)]' : 'bg-transparent text-[#8C7A7A] border border-transparent hover:text-[#A69797]'}`}>
            {t("auto.t_96", "Історія")}
          </button>
        </div>
      }
      
      
        <div key={filter} className="animate-in fade-in duration-300">
          
          {processedSales.length === 0 &&
            <EmptyState 
              icon={PackageOpen}
              title={t("auto.t_97", "Немає замовлень")}
              description={"Створіть своє перше замовлення, щоб побачити його тут."}
              actionLabel={"Створити замовлення"}
              onAction={() => document.getElementById('global-add-btn')?.click()}
            />
          }
          
          
            {processedSales.slice(0, visibleCount).map((order) =>
            <OrderItem
              key={order.id}
              order={order}
              filter={filter}
              invoiceMode={invoiceMode}
              isSelected={selectedForInvoice.includes(order.id)}
              onDelete={onDelete}
              onComplete={onComplete}
              onRestore={onRestore}
              toggleSelection={toggleSelection}
              onEditOrder={onEditOrder} />

            )}

            {visibleCount < processedSales.length && (
              <div className="px-4 mt-2 mb-8">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 20)} 
                  className="w-full py-4 rounded-2xl bg-[#1E1919] border border-[#2A2323] text-[#D4AF37] font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all">
                  Показати ще ({processedSales.length - visibleCount})
                </button>
              </div>
            )}
          
        </div>
      
    </div>);

});

export default OrdersList;