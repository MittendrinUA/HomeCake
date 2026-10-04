import React, { useState, memo, useMemo } from 'react';
import { Folder, MoreVertical, Edit2, Trash2, Library } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CategoryForm from './CategoryForm';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../ui/EmptyState';

const RecipeCategories = memo(function RecipeCategories({ recipes, dbCategories, allUniqueNames, onSelectCategory, onSaveCategory, onDeleteCategory, askConfirm }) {
  const { t } = useTranslation();
  const [editingCat, setEditingCat] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  
  const enrichedCategories = useMemo(() => allUniqueNames.map(name => { 
    const dbCat = dbCategories.find(c => c.name === name); 
    return { name, id: dbCat?.id || null, imageUrl: dbCat?.imageUrl || null, icon: dbCat?.icon || null }; 
  }), [allUniqueNames, dbCategories]);
  
  if (editingCat) return <CategoryForm cat={editingCat} onSave={(...args) => { onSaveCategory(...args); setEditingCat(null); }} onCancel={() => setEditingCat(null)} onDelete={(id, name) => { askConfirm(t('recipes.deleteFolder', "Видалити папку?"), t('recipes.deleteFolderDesc', "Всі десерти з неї перемістяться в Кошик"), ()=>{onDeleteCategory(id, name); setEditingCat(null)}); }} />;
  
  return (
    <div className="p-4 pb-28" onClick={() => setMenuOpenFor(null)}>
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-white font-bold text-2xl tracking-wide drop-shadow-sm">{t('recipes.collections', 'Колекції')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setEditingCat({name: '', icon: ''})} className="text-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]">{t('app.newCollection', '+ Нова')}</button>
        </div>
      </div>
      
      {enrichedCategories.length === 0 ? (
        <EmptyState 
          icon={Library}
          title={t('recipes.noCollections', 'Немає колекцій')}
          description={t('recipes.noCollectionsDesc', 'Створіть свою першу колекцію, щоб додати туди рецепти.')}
          actionLabel={t('app.newCollection', '+ Нова')}
          onAction={() => setEditingCat({name: '', icon: ''})}
        />
      ) : (
      <div className="grid grid-cols-2 gap-4">
        {enrichedCategories.map(cat => { 
          const count = recipes.filter(r => (r?.category || 'Інше') === cat.name).length; 
          const hasImage = !!cat.imageUrl; 
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} key={cat.name} className="relative rounded-[28px] overflow-hidden shadow-lg shadow-black/40 h-36 border border-[#2A2323] transition-all duration-300 hover:border-[#3A3333]">
              <div onClick={(e) => { e.stopPropagation(); onSelectCategory(cat.name); }} className="absolute inset-0 cursor-pointer active:scale-95 transition-transform z-0 group bg-gradient-to-br from-[#1E1919] to-[#151212]">
                {hasImage ? (<div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${cat.imageUrl})` }}><div className="absolute inset-0 bg-gradient-to-t from-[#151212] via-[#151212]/70 to-[#151212]/30 group-hover:via-[#151212]/60 transition-colors"></div></div>) : (<div className="absolute inset-0 bg-gradient-to-br from-[#1E1919] to-[#151212] group-hover:from-[#2A2323] group-hover:to-[#1E1919] transition-colors"></div>)}
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
                  {cat.icon ? (<span className="text-4xl mb-2 drop-shadow-lg scale-110">{cat.icon}</span>) : (<Folder size={32} className={`${count > 0 ? (hasImage ? 'text-[#F4EFEA]' : 'text-[#D4AF37]') : 'text-[#8C7A7A]'} mb-2 opacity-90 drop-shadow-md`} strokeWidth={1.5} />)}
                  <h3 className="text-white font-bold text-sm leading-tight mb-1.5 drop-shadow-md">{cat.name}</h3>
                  <p className="text-[#8C7A7A] text-[9px] uppercase tracking-widest font-bold">{count} {t('app.pcs', 'шт')}</p>
                </div>
              </div>
              
              <button onClick={(e) => { e.stopPropagation(); setMenuOpenFor(menuOpenFor === cat.name ? null : cat.name); }} className="absolute top-3 right-3 p-1.5 rounded-full z-20 text-[#8C7A7A] bg-[#151212]/50 hover:bg-[#151212]/80 hover:text-[#F4EFEA] backdrop-blur-md transition-colors border border-transparent hover:border-[#8C7A7A]/30 active:scale-90">
                <MoreVertical size={16} />
              </button>
              
              <AnimatePresence>
                {menuOpenFor === cat.name && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, originTopRight: 1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute top-11 right-3 w-36 bg-[#151212]/90 backdrop-blur-xl border border-[#2A2323] rounded-2xl shadow-2xl z-30 overflow-hidden">
                    <button onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setMenuOpenFor(null); }} className="w-full text-left px-4 py-3.5 text-xs text-[#F4EFEA] hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 border-b border-[#2A2323]/50 transition-colors">
                      <Edit2 size={14} className="text-[#D4AF37]"/> {t('common.edit', 'Редагувати')}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpenFor(null); askConfirm(t('recipes.deleteFolder', "Видалити папку?"), t('recipes.deleteFolderDesc', "Всі десерти з неї перемістяться в Кошик"), ()=>{onDeleteCategory(cat.id, cat.name);}); }} className="w-full text-left px-4 py-3.5 text-xs text-red-400 hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 transition-colors">
                      <Trash2 size={14} /> {t('common.delete', 'Видалити')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ); 
        })}
      </div>
      )}
    </div>
  )
});

export default RecipeCategories;
