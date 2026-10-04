import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Edit2, Trash2, Plus, Minus, Save, X, Camera, Calculator, CheckCircle, FileText, ChevronRight, MoreVertical, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomSelect from './ui/CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecipeDetail({ item, type, inventory, preps, costFn, onUpdate, onDelete, onCook, askConfirm, askPrompt, allCategories, compressImage }) {
  const { t } = useTranslation();
  const getUnit = (u) => {
    const map = { 'г': t('addRecipe.g', 'г'), 'кг': t('addRecipe.kg', 'кг'), 'шт': t('addRecipe.pcs', 'шт'), 'мл': t('addRecipe.ml', 'мл') };
    return map[u] || u;
  };
  const [isAddingTo, setIsAddingTo] = useState(false);
  const [recipeMenuOpen, setRecipeMenuOpen] = useState(false);
  const [newIngFullId, setNewIngFullId] = useState('');
  const [newIngAmount, setNewIngAmount] = useState('');
  const [newIngGroup, setNewIngGroup] = useState('');
  const [yieldAmount, setYieldAmount] = useState('');

  const [targetYield, setTargetYield] = useState(item.baseYield || 1);

  useEffect(() => {
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [item?.id]);
  useEffect(() => {setTargetYield(item.baseYield || 1);}, [item.baseYield]);

  const ingredientOptions = useMemo(() => {
    return [
    { isGroup: true, label: t('recipeDetail.rawMaterial') || "📦 Сировина та мікси на складі" },
    ...[...inventory].filter((i) => !i.isPrep).sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((i) => ({ value: `inv_${i.id}`, label: i.name })),
    { isGroup: true, label: t('recipeDetail.techCards') || "📝 Тех. картки (Динамічні заготівлі)" },
    ...[...preps].filter((p) => p.id !== item.id).sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((p) => ({ value: `prep_${p.id}`, label: `[ТК] ${p.name}` })),
    { isGroup: true, label: t('recipeDetail.readyBatches') || "🟣 Готові партії (Зі складу)" },
    ...[...inventory].filter((i) => i.isPrep).sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((i) => ({ value: `inv_${i.id}`, label: i.name }))];

  }, [inventory, preps, item.id, t]);

  const [instModal, setInstModal] = useState(null);
  const [showInst, setShowInst] = useState({});
  const toggleInst = (id) => setShowInst((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleUpdateField = (field, val) => onUpdate({ [field]: val });

  const handleEditIngredientLocal = (tId, oIdx) => {
    const isBase = tId === 'base';
    const arr = isBase ? item.ingredients : item.fillings.find((f) => f.id === tId).ingredients;
    const oAmt = arr[oIdx].amount;const oGr = arr[oIdx].group || '';

    askPrompt(t('recipeDetail.editIngredient') || "Редагувати інгредієнт", [
    { name: 'amt', label: t('recipeDetail.quantity') || 'Кількість', type: 'number', defaultValue: oAmt },
    { name: 'grp', label: t('recipeDetail.groupOptional') || 'Група (необов\'язково)', defaultValue: oGr }],
    (res) => {
      if (res.amt) {
        if (isBase) {
          const u = [...item.ingredients];u[oIdx] = { ...u[oIdx], amount: Number(res.amt), group: res.grp || '' };
          handleUpdateField('ingredients', u);
        } else {
          const uF = item.fillings.map((f) => f.id === tId ? { ...f, ingredients: f.ingredients.map((ing, i) => i === oIdx ? { ...ing, amount: Number(res.amt), group: res.grp || '' } : ing) } : f);
          handleUpdateField('fillings', uF);
        }
      }
    });
  };

  const handleDelIngredientLocal = (tId, oIdx) => askConfirm(t('common.delete') || "Видалити", t('recipeDetail.deleteIngredientConfirm') || "Видалити інгредієнт?", () => {
    if (tId === 'base') handleUpdateField('ingredients', item.ingredients.filter((_, i) => i !== oIdx));else
    handleUpdateField('fillings', item.fillings.map((f) => f.id === tId ? { ...f, ingredients: f.ingredients.filter((_, i) => i !== oIdx) } : f));
  });

  const handleImageChange = async (e) => {
    const f = e.target.files[0];
    if (f && compressImage) {
      try {
        const img = await compressImage(f);
        handleUpdateField('imageUrl', img);
      } catch (err) {
        console.error(t('recipeDetail.compressError') || "Помилка стиснення:", err);
      }
    }
  };

  const handleSaveInstModal = () => {
    if (instModal.id === 'base') {
      handleUpdateField('instructions', instModal.text);
    } else {
      const newFillings = item.fillings.map((f) => f.id === instModal.id ? { ...f, instructions: instModal.text } : f);
      handleUpdateField('fillings', newFillings);
    }
    setInstModal(null);
  };

  const sf = targetYield / Math.max(item.baseYield || 1, 0.001);
  const bc = costFn(item);

  let newIngUnit = 'г';
  if (newIngFullId) {
    const isPrepL = newIngFullId.startsWith('prep_');
    const actualId = newIngFullId.split('_')[1];
    const linkedItem = isPrepL ? preps.find((p) => p.id === actualId) : inventory.find((i) => i.id === actualId);
    if (linkedItem && linkedItem.unit) newIngUnit = linkedItem.unit;
  }

  const renderIngList = (ings, tId) => {
    if (!ings || ings.length === 0) return <p className="text-[#8C7A7A] text-center py-6 text-xs font-bold uppercase tracking-widest border border-dashed border-[#2A2323] rounded-2xl mt-4 bg-[#151212]/50">{t('recipeDetail.empty') || "Порожньо"}</p>;

    const grouped = ings.map((ing, idx) => ({ ...ing, oIdx: idx })).reduce((acc, ing) => {
      const g = ing.group || '';if (!acc[g]) acc[g] = [];acc[g].push(ing);return acc;
    }, {});

    return (
      <div className="mt-4">
        {Object.keys(grouped).sort().map((grp, gIdx) =>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} key={gIdx} className="mb-5">
            {grp && <h4 className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">{grp}</h4>}
            <div className="bg-[#151212] border border-[#2A2323] rounded-[24px] overflow-hidden shadow-inner">
              {grouped[grp].map((ing, lIdx) => {
              const isPrepL = !!ing.prepId;
              const linkedItem = isPrepL ? preps.find((p) => p.id === ing.prepId) : inventory.find((i) => i.id === ing.invId);
              if (!linkedItem) return null;

              const sAmt = ing.amount * sf;
              return (
                <div key={ing.oIdx} className={`p-4 flex justify-between items-center ${lIdx !== 0 ? 'border-t border-[#2A2323]' : ''}`}>
                    <div>
                      <h3 className="text-[#F4EFEA] font-bold text-sm flex items-center gap-2 tracking-wide mb-1">
                        {isPrepL && <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded-md text-[8px] uppercase tracking-widest font-black">{t("auto.t_103", "ТК")}</span>}
                        {!isPrepL && linkedItem.isMix && <span className="bg-[#2AABEE]/20 text-[#2AABEE] px-1.5 py-0.5 rounded-md text-[8px] uppercase tracking-widest font-black">{t("auto.t_32", "Мікс")}</span>}
                        {linkedItem.name}
                      </h3>
                      <div className="flex items-center">
                        <p className="text-[#D4AF37] font-black text-xs bg-[#1E1919] border border-[#2A2323] px-2.5 py-1 rounded-lg shadow-sm">{sAmt.toFixed(2)} {linkedItem.unit}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditIngredientLocal(tId, ing.oIdx)} className="text-[#8C7A7A] hover:text-[#D4AF37] p-2 bg-[#1E1919] rounded-xl border border-[#2A2323] active:scale-95 transition-all shadow-sm"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelIngredientLocal(tId, ing.oIdx)} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#1E1919] rounded-xl border border-[#2A2323] active:scale-95 transition-all shadow-sm"><Trash2 size={14} /></button>
                    </div>
                  </div>);

            })}
            </div>
          </motion.div>
        )}
      </div>);

  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-28" onClick={() => setRecipeMenuOpen(false)}>
      <div className="relative h-72 bg-[#1E1919] overflow-hidden shadow-2xl shadow-black/50">
         <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none' }}>
            {!item.imageUrl && <div className="absolute inset-0 flex items-center justify-center"><Camera size={56} className="text-[#2A2323] drop-shadow-md" /></div>}
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-[#110E0E] via-[#110E0E]/60 to-[#110E0E]/10"></div>
         <input type="file" accept="image/*" id="recipe-img" className="hidden" onChange={handleImageChange} />
         
         <div className="absolute top-4 right-4 z-20">
           <button onClick={(e) => { e.stopPropagation(); setRecipeMenuOpen(!recipeMenuOpen); }} className="bg-[#151212]/60 backdrop-blur-xl p-2.5 rounded-full border border-[#2A2323]/50 text-white active:scale-90 transition-all shadow-lg hover:bg-[#151212]/80">
             <MoreVertical size={20} />
           </button>
           
           <AnimatePresence>
             {recipeMenuOpen && (
               <motion.div initial={{ opacity: 0, scale: 0.9, originTopRight: 1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute top-12 right-0 w-48 bg-[#151212]/95 backdrop-blur-xl border border-[#2A2323] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                 <button onClick={(e) => { e.stopPropagation(); setRecipeMenuOpen(false); askPrompt(t('common.name') || "Назва", [{ name: 'val', label: t('recipeDetail.dessertName') || 'Назва десерту', defaultValue: item.name }], (res) => {if (res.val) handleUpdateField('name', res.val);}); }} className="w-full text-left px-4 py-3.5 text-xs text-white hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 border-b border-[#2A2323]/50 transition-colors">
                   <Edit2 size={14} className="text-[#D4AF37]"/> {t('common.editName', 'Редагувати назву')}
                 </button>
                 {type === 'recipes' && (
                   <button onClick={(e) => { e.stopPropagation(); setRecipeMenuOpen(false); askPrompt(t('recipeDetail.changeFolder') || "Змінити папку", [{ name: 'val', label: t('recipeDetail.chooseCollection') || 'Оберіть колекцію', type: 'select', options: allCategories, defaultValue: item.category }], (res) => {if (res.val) handleUpdateField('category', res.val);}); }} className="w-full text-left px-4 py-3.5 text-xs text-white hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 border-b border-[#2A2323]/50 transition-colors">
                     <Folder size={14} className="text-[#D4AF37]"/> {t('recipeDetail.changeFolder', 'Змінити папку')}
                   </button>
                 )}
                 <label htmlFor="recipe-img" className="w-full text-left px-4 py-3.5 text-xs text-white hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 border-b border-[#2A2323]/50 transition-colors cursor-pointer">
                   <Camera size={14} className="text-[#D4AF37]"/> {t('recipeDetail.updatePhoto', 'Оновити фото')}
                 </label>
                 <button onClick={(e) => { e.stopPropagation(); setRecipeMenuOpen(false); onDelete(); }} className="w-full text-left px-4 py-3.5 text-xs text-red-400 hover:bg-[#2A2323]/50 font-bold flex items-center gap-2.5 transition-colors">
                   <Trash2 size={14} /> {t('common.delete', 'Видалити')}
                 </button>
               </motion.div>
             )}
           </AnimatePresence>
         </div>
         
         <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
            <div className="flex justify-between items-end">
               <div className="flex-1 pointer-events-auto">
                 {type === 'recipes' &&
              <span className="text-[#D4AF37] bg-[#D4AF37]/10 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-3 inline-block border border-[#D4AF37]/20 shadow-sm">
                      {item.category || t('recipeDetail.other') || 'Інше'}
                    </span>
              }
                 <h2 className="text-3xl font-black text-white leading-tight drop-shadow-2xl pr-4">
                    {item.name} 
                 </h2>
               </div>
            </div>
         </div>
      </div>

      <div className="px-6 py-6 bg-gradient-to-b from-[#1E1919] to-[#151212] mb-6 flex justify-between items-center shadow-xl shadow-black/20 rounded-b-[40px] border-b border-x border-[#2A2323]">
         <div><p className="text-[#8C7A7A] text-[10px] font-bold mb-1.5 uppercase tracking-widest">{t('recipeDetail.costLabel') || 'Собівартість'} {type === 'preps' ? t('recipeDetail.batch') || 'партії' : t('recipeDetail.base') || 'основи'}</p><p className="text-3xl font-black text-[#D4AF37] tracking-tight drop-shadow-md">{bc.toFixed(2)} ₴</p></div>
         <div className="text-right">
            <span className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest block mb-1.5">{t('recipeDetail.yield') || 'Вихід'}</span>
            <strong className="text-white bg-[#110E0E] border border-[#2A2323] px-4 py-2 rounded-xl cursor-pointer inline-block active:scale-95 transition-all shadow-inner text-sm" onClick={() => askPrompt(t('recipeDetail.yield') || "Вихід", [{ name: 'val', label: `${t('recipeDetail.quantity') || 'Кількість'} (${item.unit})`, type: 'number', defaultValue: item.baseYield }], (res) => {if (res.val) handleUpdateField('baseYield', Number(res.val));})}>
               {item.baseYield || 1} {getUnit(item.unit || 'шт')}
            </strong>
         </div>
      </div>

      {type === 'recipes' &&
      <div className="mx-4 mb-6">
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block mb-2 px-1">{t('recipeDetail.priceFor') || 'Прайс (за'} {item.baseYield || 1}{getUnit(item.unit || 'шт')})</label>
                <div className="flex items-center bg-[#151212] border border-[#2A2323] rounded-[24px] p-4 shadow-inner transition-colors focus-within:border-[#D4AF37]/50">
                  <input type="number" inputMode="decimal" value={item.defaultPrice || ''} placeholder="0" onChange={(e) => onUpdate({ defaultPrice: parseFloat(e.target.value) || 0 })} className="bg-transparent text-[#D4AF37] text-xl font-black w-full outline-none" />
                  <span className="text-[#8C7A7A] font-bold text-sm">₴</span>
                </div>
              </div>
              <div>
                <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block mb-2 px-1">{t('recipeDetail.minOrder') || 'Мін. замовлення'}</label>
                <div className="flex items-center bg-[#151212] border border-[#D4AF37]/30 rounded-[24px] p-4 relative shadow-[inset_0_0_15px_rgba(212,175,55,0.05)] focus-within:border-[#D4AF37]">
                  <input type="number" inputMode="decimal" value={item.minOrder || ''} placeholder="1" onChange={(e) => onUpdate({ minOrder: parseFloat(e.target.value) || 1 })} className="bg-transparent text-white text-xl font-black w-full outline-none pr-10" />
                  
                  <span onClick={() => askPrompt(t('recipeDetail.unit') || "Одиниця виміру", [{ name: 'val', label: t('recipeDetail.unitOptions') || 'Одиниця (шт, кг, г, мл)', defaultValue: item.unit || 'шт' }], (res) => {if (res.val) onUpdate({ unit: res.val.toLowerCase() });})} className="absolute right-3 text-[#D4AF37] font-black text-[10px] bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 px-2.5 py-1.5 rounded-lg border border-[#D4AF37]/40 cursor-pointer active:scale-90 transition-all uppercase tracking-widest shadow-sm">
                    {getUnit(item.unit || 'шт')} <Edit2 size={10} className="inline ml-1" />
                  </span>
                </div>
              </div>
           </div>
        </div>
      }
      
      {type === 'preps' &&
      <div className="mx-4 mb-6 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 p-5 rounded-[28px] shadow-lg">
          <label className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-3 block ml-1">{t('recipeDetail.makeBatch') || 'Зробити партію на склад'}</label>
          <div className="flex gap-3">
            <input type="number" inputMode="decimal" placeholder={`${t('recipeDetail.yield') || 'Вихід'} (${item.unit || 'г'})`} value={yieldAmount} onChange={(e) => setYieldAmount(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} className="w-2/3 bg-[#151212] border border-[#2A2323] text-white p-4 rounded-2xl outline-none font-bold text-lg focus:border-[#D4AF37] transition-all shadow-inner" />
            <button onClick={() => onCook(item, Number(yieldAmount))} disabled={!yieldAmount || bc === 0} className="w-1/3 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#151212] disabled:opacity-50 font-black rounded-2xl active:scale-95 uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all">{t('common.done') || 'Готово'}</button>
          </div>
        </div>
      }
      
      <div className="mx-4 mb-8 bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] p-6 rounded-[32px] relative overflow-hidden shadow-2xl shadow-black/40">
         <div className="absolute -right-6 -top-6 opacity-[0.03] text-[#D4AF37] mix-blend-screen"><Calculator size={140} /></div>
         <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-[#D4AF37]/10 rounded-lg"><Calculator size={16} className="text-[#D4AF37]" /></div>
            <h3 className="text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest">{t('recipeDetail.calculator') || 'Калькулятор інгредієнтів'}</h3>
         </div>
         <p className="text-[#8C7A7A] text-xs font-medium mb-5 pr-8 leading-relaxed">{t('recipeDetail.howMuchToPrepare') || 'Скільки потрібно приготувати зараз?'}</p>
         <div className="flex items-center gap-3">
            <input type="number" inputMode="decimal" value={targetYield} onChange={(e) => setTargetYield(Number(e.target.value) || '')} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} className="bg-[#110E0E] border border-[#2A2323] text-white rounded-2xl p-4 w-28 text-center font-black text-2xl outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all shadow-inner" />
            <span className="text-[#8C7A7A] font-bold text-sm uppercase tracking-widest">{item.unit}</span>
         </div>
         <AnimatePresence>
         {sf !== 1 && <motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 16 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-[#5B7A5A] text-[10px] font-bold bg-gradient-to-r from-[#5B7A5A]/15 to-[#5B7A5A]/5 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#5B7A5A]/30 uppercase tracking-widest shadow-sm"><CheckCircle size={14} /> {t('recipeDetail.gramsRecalculated') || 'Грами перераховано!'}</motion.p>}
         </AnimatePresence>
      </div>

      <div className="mx-4 mb-8">
        <div className="mb-8">
          <button onClick={() => toggleInst('base')} className="flex items-center justify-between w-full bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] p-5 rounded-[24px] active:scale-95 transition-all shadow-lg hover:border-[#3A3333]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${showInst['base'] ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#151212] text-[#8C7A7A]'}`}><FileText size={18} /></div>
              <span className={`font-bold tracking-widest uppercase text-[10px] ${showInst['base'] ? "text-white" : "text-[#8C7A7A]"}`}>{t('recipeDetail.technology') || 'Технологія приготування'}</span>
            </div>
            <ChevronRight size={18} className={`text-[#8C7A7A] transition-transform duration-300 ${showInst['base'] ? 'rotate-90' : ''}`} />
          </button>
          
          <AnimatePresence>
          {showInst['base'] &&
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-3">
              {item.instructions ?
            <div className="bg-[#151212] p-6 rounded-[28px] border border-[#2A2323] text-[#F4EFEA] text-sm leading-relaxed whitespace-pre-wrap shadow-inner relative">
                   <button onClick={() => setInstModal({ id: 'base', text: item.instructions || '' })} className="absolute top-4 right-4 text-[#D4AF37] bg-[#1E1919] border border-[#2A2323] p-2.5 rounded-xl active:scale-90 shadow-sm transition-all hover:bg-[#D4AF37]/10"><Edit2 size={16} /></button>
                   <div className="pr-12">{item.instructions}</div>
                </div> :

            <div onClick={() => setInstModal({ id: 'base', text: '' })} className="bg-[#151212] p-6 rounded-[28px] border-2 border-dashed border-[#2A2323] text-center text-[#8C7A7A] cursor-pointer active:scale-95 transition-all text-xs font-bold uppercase tracking-widest hover:border-[#D4AF37]/50 hover:bg-[#1E1919]">
                   {t('recipeDetail.addProcess') || '+ Додати опис процесу'}
                </div>
            }
            </motion.div>
          }
          </AnimatePresence>
        </div>
        
        <div className="flex justify-between items-center mb-4 px-1">
          <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest">{type === 'preps' ? t('recipeDetail.compositionPrep') : t('recipeDetail.compositionBase')}</p>
          <button onClick={() => setIsAddingTo('base')} className="text-[#D4AF37] text-[10px] font-bold uppercase bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all">{t('recipeDetail.addIngr') || '+ Інгр.'}</button>
        </div>
        
        <AnimatePresence>
        {isAddingTo === 'base' &&
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] p-5 rounded-[28px] mb-5 shadow-2xl">
            <CustomSelect
            value={newIngFullId}
            onChange={setNewIngFullId}
            options={ingredientOptions}
            label={t("auto.t_104", "Вибір компонента")}
            placeholder={t('recipeDetail.chooseComponent') || 'Оберіть компонент...'}
            searchable={true}
            className="w-full bg-[#110E0E] text-white border border-[#2A2323] p-4 rounded-2xl mb-4 outline-none font-medium shadow-inner" />
          
            <div className="flex gap-3 mb-4">
              <input type="number" inputMode="decimal" placeholder={`К-ть (${newIngUnit})`} value={newIngAmount} onChange={(e) => setNewIngAmount(e.target.value)} className="w-1/2 bg-[#110E0E] border border-[#2A2323] text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 p-4 rounded-2xl outline-none font-bold text-lg text-center transition-all shadow-inner" />
              <input type="text" placeholder={t("auto.t_105", "Група")} value={newIngGroup} onChange={(e) => setNewIngGroup(e.target.value)} className="w-1/2 bg-[#110E0E] border border-[#2A2323] text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 p-4 rounded-2xl outline-none text-center transition-all shadow-inner font-medium" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
              if (newIngFullId && newIngAmount) {
                const isPrepL = newIngFullId.startsWith('prep_');
                const actualId = newIngFullId.split('_')[1];
                const newObj = isPrepL ? { prepId: actualId, amount: Number(newIngAmount), group: newIngGroup } : { invId: actualId, amount: Number(newIngAmount), group: newIngGroup };
                handleUpdateField('ingredients', [...(item.ingredients || []), newObj]);setIsAddingTo(false);setNewIngFullId('');setNewIngAmount('');
              }
            }} className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#151212] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-black py-3.5 rounded-xl uppercase tracking-widest text-xs active:scale-95 transition-all">{t('common.done') || 'Додати'}</button>
              <button onClick={() => {setIsAddingTo(false);setNewIngFullId('');setNewIngAmount('');}} className="flex-1 bg-[#110E0E] border border-[#2A2323] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all">{t('recipeDetail.cancel') || 'Відміна'}</button>
            </div>
          </motion.div>
        }
        </AnimatePresence>
        
        {renderIngList(item.ingredients, 'base')}
      </div>

      {type === 'recipes' &&
      <div className="px-4 border-t border-[#2A2323] pt-8 mb-10">
          <div className="flex justify-between items-center mb-6 px-1">
            <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest">{t('recipeDetail.fillings') || 'Начинки'}</p>
            <button onClick={() => askPrompt(t('recipeDetail.newFilling') || "Нова начинка", [{ name: 'val', label: t('recipeDetail.fillingName') || 'Назва начинки', placeholder: t('recipeDetail.fillingExample') || 'Напр: Вишневе конфі' }], (res) => {if (res.val) handleUpdateField('fillings', [...(item.fillings || []), { id: Date.now().toString(), name: res.val, ingredients: [], instructions: '' }]);})} className="text-white text-[10px] font-bold uppercase bg-[#1E1919] border border-[#2A2323] px-3.5 py-2 rounded-xl active:scale-95 shadow-lg transition-all">{t('recipeDetail.addFilling') || '+ Начинка'}</button>
          </div>
          
          {(item.fillings || []).map((fil) => {
          const fC = costFn({ ingredients: fil.ingredients });
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={fil.id} className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[32px] p-6 mb-6 shadow-xl relative">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-black text-2xl pr-4 leading-tight drop-shadow-sm">{fil.name} <Edit2 size={16} className="inline text-[#8C7A7A] ml-2 cursor-pointer hover:text-[#D4AF37] transition-colors" onClick={() => askPrompt(t('common.name') || "Назва", [{ name: 'val', label: t('recipeDetail.fillingName') || 'Назва начинки', defaultValue: fil.name }], (res) => {if (res.val) handleUpdateField('fillings', item.fillings.map((f) => f.id === fil.id ? { ...f, name: res.val } : f));})} /></h4>
                  <button onClick={() => askConfirm(t('recipeDetail.deleteFillingConfirm') || "Видалити начинку?", "", () => handleUpdateField('fillings', item.fillings.filter((f) => f.id !== fil.id)))} className="text-[#8C7A7A] hover:text-red-400 bg-[#110E0E] p-2.5 rounded-xl border border-[#2A2323] active:scale-90 transition-all shadow-sm"><Trash2 size={18} /></button>
                </div>
                <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest mb-6">{t('recipeDetail.costLabel') || 'Собівартість'}: <span className="text-[#D4AF37] font-black text-sm drop-shadow-md">+{fC.toFixed(2)} ₴</span></p>
                
                <div className="mb-6">
                  <button onClick={() => toggleInst(fil.id)} className="flex items-center justify-between w-full bg-[#110E0E] border border-[#2A2323] p-4 rounded-2xl active:scale-95 transition-all shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${showInst[fil.id] ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#1E1919] text-[#8C7A7A]'}`}><FileText size={14} /></div>
                      <span className={`font-bold uppercase tracking-widest text-[9px] ${showInst[fil.id] ? "text-white" : "text-[#8C7A7A]"}`}>{t('recipeDetail.howToCookFilling') || 'Як готувати начинку'}</span>
                    </div>
                    <ChevronRight size={16} className={`text-[#8C7A7A] transition-transform duration-300 ${showInst[fil.id] ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                  {showInst[fil.id] &&
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-3">
                      {fil.instructions ?
                  <div className="bg-[#110E0E] p-5 rounded-[24px] border border-[#2A2323] text-[#F4EFEA] text-sm leading-relaxed whitespace-pre-wrap relative shadow-inner">
                           <button onClick={() => setInstModal({ id: fil.id, text: fil.instructions || '' })} className="absolute top-4 right-4 text-[#D4AF37] bg-[#1E1919] border border-[#2A2323] p-2.5 rounded-xl active:scale-90 transition-all shadow-sm"><Edit2 size={16} /></button>
                           <div className="pr-12">{fil.instructions}</div>
                        </div> :

                  <div onClick={() => setInstModal({ id: fil.id, text: '' })} className="bg-[#110E0E] p-5 rounded-[24px] border-2 border-dashed border-[#2A2323] text-center text-[#8C7A7A] cursor-pointer active:scale-95 transition-all text-[10px] font-bold uppercase tracking-widest hover:border-[#D4AF37]/50">
                           {t('recipeDetail.addFillingProcess') || '+ Додати процес начинки'}
                        </div>
                  }
                    </motion.div>
                }
                  </AnimatePresence>
                </div>
                
                <div className="flex justify-between items-center mb-4 px-1">
                  <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest">{t('recipeDetail.fillingComposition') || 'Склад начинки'}</p>
                  <button onClick={() => setIsAddingTo(fil.id)} className="text-[#D4AF37] text-[10px] font-bold uppercase bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-sm">{t('recipeDetail.addIngr') || '+ Інгр.'}</button>
                </div>
                
                <AnimatePresence>
                {isAddingTo === fil.id &&
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#110E0E] border border-[#2A2323] p-5 rounded-[28px] mb-5 shadow-inner">
                    <CustomSelect
                  value={newIngFullId}
                  onChange={setNewIngFullId}
                  options={ingredientOptions}
                  label={t("auto.t_104", "Вибір компонента")}
                  placeholder={t('recipeDetail.chooseComponent') || 'Оберіть компонент...'}
                  searchable={true}
                  className="w-full bg-[#1E1919] text-white border border-[#2A2323] p-4 rounded-2xl mb-4 outline-none font-medium" />
                
                    <div className="flex gap-3 mb-4">
                      <input type="number" inputMode="decimal" placeholder={`К-ть (${newIngUnit})`} value={newIngAmount} onChange={(e) => setNewIngAmount(e.target.value)} className="w-1/2 bg-[#1E1919] border border-[#2A2323] text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 p-4 rounded-2xl outline-none font-bold text-lg text-center transition-all shadow-inner" />
                      <input type="text" placeholder={t("auto.t_105", "Група")} value={newIngGroup} onChange={(e) => setNewIngGroup(e.target.value)} className="w-1/2 bg-[#1E1919] border border-[#2A2323] text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 p-4 rounded-2xl outline-none text-center transition-all shadow-inner font-medium" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => {
                    if (newIngFullId && newIngAmount) {
                      const isPrepL = newIngFullId.startsWith('prep_');
                      const actualId = newIngFullId.split('_')[1];
                      const newObj = isPrepL ? { prepId: actualId, amount: Number(newIngAmount), group: newIngGroup } : { invId: actualId, amount: Number(newIngAmount), group: newIngGroup };
                      handleUpdateField('fillings', item.fillings.map((f) => f.id === fil.id ? { ...f, ingredients: [...f.ingredients, newObj] } : f));setIsAddingTo(false);setNewIngFullId('');setNewIngAmount('');
                    }
                  }} className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#151212] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-black py-3.5 rounded-xl uppercase tracking-widest text-xs active:scale-95 transition-all">{t('common.done') || 'Додати'}</button>
                      <button onClick={() => {setIsAddingTo(false);setNewIngFullId('');setNewIngAmount('');}} className="flex-1 bg-[#1E1919] border border-[#2A2323] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all">{t('recipeDetail.cancel') || 'Відміна'}</button>
                    </div>
                  </motion.div>
              }
                </AnimatePresence>
                {renderIngList(fil.ingredients, fil.id)}
              </motion.div>);

        })}
        </div>
      }

      <AnimatePresence>
      {instModal &&
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex justify-center sm:items-center sm:py-8 bg-black/70 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="w-full max-w-[420px] bg-gradient-to-b from-[#1E1919] to-[#151212] h-full sm:h-[850px] sm:rounded-[48px] sm:border-[8px] border-[#2A2323] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pb-5 pt-safe sm:pt-5 bg-[#1E1919] border-b border-[#2A2323]">
               <button onClick={() => setInstModal(null)} className="text-[#8C7A7A] hover:text-white font-bold px-2 py-1 transition-colors uppercase tracking-widest text-[10px]">{t('recipeDetail.cancel') || 'Скасувати'}</button>
               <h3 className="text-white font-black tracking-widest uppercase text-xs">{t('recipeDetail.process') || 'Процес'}</h3>
               <button onClick={handleSaveInstModal} className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#151212] px-5 py-2.5 rounded-xl font-black active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] uppercase tracking-widest text-[10px]">{t('recipeDetail.save') || 'Зберегти'}</button>
            </div>
            <textarea
            autoFocus
            value={instModal.text}
            onChange={(e) => setInstModal({ ...instModal, text: e.target.value })}
            placeholder={t('recipeDetail.describeSteps') || "Опишіть детально кроки приготування..."}
            className="flex-1 w-full bg-transparent text-white p-6 outline-none resize-none text-base leading-relaxed custom-scrollbar font-medium" />
          
          </motion.div>
        </motion.div>
      }
      </AnimatePresence>
    </motion.div>);

}