import { useTranslation } from "react-i18next";
import React from 'react';
import { Trash2, RotateCcw, XCircle, AlertTriangle, FileBox, ArchiveRestore } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Trash({
  recipes, categories, inventory, preps, sales, customers,
  onRestore, onPermanentDelete, onEmptyTrash
}) {
  const { t } = useTranslation();

  // Збираємо всі видалені елементи в один масив
  const deletedItems = [
    ...recipes.filter((i) => i.isDeleted).map((i) => ({ ...i, colName: 'recipes', typeName: 'Рецепт' })),
    ...categories.filter((i) => i.isDeleted).map((i) => ({ ...i, colName: 'categories', typeName: 'Папка' })),
    ...inventory.filter((i) => i.isDeleted).map((i) => ({ ...i, colName: 'inventory', typeName: 'Склад' })),
    ...preps.filter((i) => i.isDeleted).map((i) => ({ ...i, colName: 'preps', typeName: 'Заготівля' })),
    ...sales.filter((i) => i.isDeleted).map((i) => ({ ...i, colName: 'sales', typeName: 'Замовлення' })),
    ...customers.filter((i) => i.isDeleted).map((i) => ({ ...i, colName: 'customers', typeName: 'Клієнт' }))
  ].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  const daysLeft = (timestamp) => {
    if (!timestamp) return 30;
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - days);
  };

  return (
    <div className="p-4 flex flex-col h-full bg-[#151212]">
      {deletedItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-4"
        >
          <button
            onClick={onEmptyTrash}
            className="flex items-center gap-2 text-xs text-red-400 font-bold tracking-widest uppercase bg-red-400/10 hover:bg-red-400/20 px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm"
          >
            <Trash2 size={16} />
            {t("auto.t_117", "Очистити все")}
          </button>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-[#1E1919] to-[#2A2323] border border-[#3A3333] p-4 rounded-2xl mb-6 flex gap-4 items-start shadow-lg relative overflow-hidden"
      >
        <div className="absolute -right-4 -top-4 opacity-[0.03] rotate-12 pointer-events-none">
          <Trash2 size={120} />
        </div>
        <div className="bg-[#D4AF37]/20 p-2.5 rounded-xl shrink-0 border border-[#D4AF37]/10 z-10">
          <AlertTriangle className="text-[#D4AF37]" size={22} />
        </div>
        <div className="z-10 pt-0.5">
          <p className="text-[#F4EFEA] text-[15px] leading-relaxed">
            {t("auto.t_118", "Елементи в кошику автоматично видаляються через ")}
            <span className="font-bold text-[#D4AF37] px-1.5 py-0.5 bg-[#D4AF37]/10 rounded-md mx-0.5 shadow-sm border border-[#D4AF37]/20">
              {t("auto.t_119", "30 днів")}
            </span>.
          </p>
        </div>
      </motion.div>

      {deletedItems.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-20"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#D4AF37]/10 blur-2xl rounded-full scale-150" />
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="bg-gradient-to-b from-[#2A2323] to-[#1E1919] p-7 rounded-[2rem] border border-[#3A3333] shadow-2xl relative z-10"
            >
              <Trash2 size={64} className="text-[#D4AF37] opacity-90 drop-shadow-lg" />
            </motion.div>
          </div>
          <h3 className="text-2xl font-bold text-[#F4EFEA] mb-3 tracking-tight">
            {t("auto.t_120", "Кошик порожній")}
          </h3>
          <p className="text-[15px] text-[#8C7A7A] max-w-[260px] leading-relaxed">
            {t("auto.t_121", "Тут будуть відображатися видалені файли")}
          </p>
        </motion.div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pb-24 hide-scrollbar px-1 pt-1">
          <AnimatePresence mode="popLayout">
            {deletedItems.map((item, index) => (
              <motion.div 
                key={item.id + item.colName}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
                className="group bg-[#1E1919] p-5 rounded-[20px] border border-[#2A2323] hover:border-[#3A3333] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-lg transition-all relative overflow-hidden"
              >
                <div className="flex-1 min-w-0 z-10 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-[#2A2323] to-[#3A3333] text-[#A69B9B] px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-inner border border-[#3A3333]">
                      <FileBox size={12} className="opacity-70" />
                      {item.typeName}
                    </span>
                    <span className="text-[10px] text-red-400 font-bold bg-red-400/10 px-2.5 py-1 rounded-md border border-red-400/20 whitespace-nowrap">
                      {t("auto.t_122", "Залишилось: ")}
                      {daysLeft(item.deletedAt)} {t("auto.t_123", "дн.")}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#F4EFEA] text-[16px] truncate tracking-tight">
                    {item.name || item.customer || item.customerName || (item.colName === 'sales' ? `Замовлення #${item.id.slice(-4)}` : 'Без назви')}
                  </h3>
                </div>
                
                <div className="flex gap-2.5 shrink-0 z-10 mr-1">
                  <button
                    onClick={() => onRestore(item.colName, item.id)}
                    className="p-3.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-[14px] hover:bg-[#D4AF37]/20 active:scale-95 transition-all shadow-sm border border-[#D4AF37]/10"
                    title={t("auto.t_124", "Відновити")}
                  >
                    <ArchiveRestore size={22} />
                  </button>
                  <button
                    onClick={() => onPermanentDelete(item.colName, item.id, item.typeName)}
                    className="p-3.5 bg-red-400/10 text-red-400 rounded-[14px] hover:bg-red-400/20 active:scale-95 transition-all shadow-sm border border-red-400/10"
                    title={t("auto.t_125", "Видалити назавжди")}
                  >
                    <XCircle size={22} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}