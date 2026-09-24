import React, { useState, memo } from 'react';
import { Folder, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CategoryForm from './CategoryForm';

const RecipeCategories = memo(function RecipeCategories({ recipes, dbCategories, allUniqueNames, onSelectCategory, onSaveCategory, onDeleteCategory, askConfirm }) {
  const { t } = useTranslation();
  const [editingCat, setEditingCat] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  
  const enrichedCategories = allUniqueNames.map(name => { 
    const dbCat = dbCategories.find(c => c.name === name); 
    return { name, id: dbCat?.id || null, imageUrl: dbCat?.imageUrl || null, icon: dbCat?.icon || null }; 
  });
  
  if (editingCat) return <CategoryForm cat={editingCat} onSave={(...args) => { onSaveCategory(...args); setEditingCat(null); }} onCancel={() => setEditingCat(null)} onDelete={(id, name) => { askConfirm(t('recipes.deleteFolder', "Видалити папку?"), t('recipes.deleteFolderDesc', "Всі десерти з неї перемістяться в Кошик"), ()=>{onDeleteCategory(id, name); setEditingCat(null)}); }} />;
  
  return (
    <div className="p-4 pb-28" onClick={() => setMenuOpenFor(null)}>
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-[#F4EFEA] font-bold text-xl tracking-wide">{t('recipes.collections', 'Колекції')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setEditingCat({name: '', icon: ''})} className="text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">{t('app.newCollection', '+ Нова')}</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {enrichedCategories.map(cat => { 
          const count = recipes.filter(r => (r?.category || 'Інше') === cat.name).length; 
          const hasImage = !!cat.imageUrl; 
          return (
            <div key={cat.name} className="relative rounded-[28px] overflow-hidden shadow-lg shadow-black/40 h-32 border border-[#2A2323]">
              <div onClick={(e) => { e.stopPropagation(); onSelectCategory(cat.name); }} className="absolute inset-0 cursor-pointer active:scale-95 transition-transform z-0 group">
                {hasImage ? (<div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cat.imageUrl})` }}><div className="absolute inset-0 bg-[#151212]/70 group-hover:bg-[#151212]/50 transition-colors"></div></div>) : (<div className="absolute inset-0 bg-[#1E1919] group-hover:bg-[#2A2323] transition-colors"></div>)}
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 text-center">
                  {cat.icon ? (<span className="text-3xl mb-2 drop-shadow-md">{cat.icon}</span>) : (<Folder size={30} className={`${count > 0 ? (hasImage ? 'text-[#F4EFEA]' : 'text-[#D4AF37]') : 'text-[#8C7A7A]'} mb-2 opacity-90`} strokeWidth={1.5} />)}
                  <h3 className="text-[#F4EFEA] font-bold text-sm leading-tight mb-1 drop-shadow-md">{cat.name}</h3>
                  <p className="text-[#8C7A7A] text-[9px] uppercase tracking-widest font-bold">{count} {t('app.pcs', 'шт')}</p>
                </div>
              </div>
              
              <button onClick={(e) => { e.stopPropagation(); setMenuOpenFor(menuOpenFor === cat.name ? null : cat.name); }} className="absolute top-2 right-2 p-1.5 rounded-full z-20 text-[#8C7A7A] bg-[#151212]/50 hover:bg-[#151212]/80 hover:text-[#F4EFEA] backdrop-blur-md transition-colors border border-transparent hover:border-[#8C7A7A]/30">
                <MoreVertical size={16} />
              </button>
              
              {menuOpenFor === cat.name && (
                <div className="absolute top-10 right-2 w-32 bg-[#1E1919] border border-[#2A2323] rounded-xl shadow-2xl z-30 overflow-hidden">
                  <button onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setMenuOpenFor(null); }} className="w-full text-left px-4 py-3 text-sm text-[#F4EFEA] hover:bg-[#2A2323] font-medium flex items-center gap-2 border-b border-[#2A2323]/50">
                    <Edit2 size={14} className="text-[#D4AF37]"/> {t('common.edit', 'Редагувати')}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpenFor(null); askConfirm(t('recipes.deleteFolder', "Видалити папку?"), t('recipes.deleteFolderDesc', "Всі десерти з неї перемістяться в Кошик"), ()=>{onDeleteCategory(cat.id, cat.name);}); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#2A2323] font-medium flex items-center gap-2">
                    <Trash2 size={14} /> {t('common.delete', 'Видалити')}
                  </button>
                </div>
              )}
            </div>
          ); 
        })}
      </div>
    </div>
  )
});

export default RecipeCategories;
