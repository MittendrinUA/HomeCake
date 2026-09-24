import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Edit2, Trash2, Plus, Minus, Save, X, Camera, Calculator, CheckCircle, FileText, ChevronRight } from 'lucide-react'; 
import { useTranslation } from 'react-i18next';
import CustomSelect from './ui/CustomSelect';

export default function RecipeDetail({ item, type, inventory, preps, costFn, onUpdate, onDelete, onCook, askConfirm, askPrompt, allCategories, compressImage }) {
  const { t } = useTranslation();
  const [isAddingTo, setIsAddingTo] = useState(false); 
  const [newIngFullId, setNewIngFullId] = useState(''); 
  const [newIngAmount, setNewIngAmount] = useState(''); 
  const [newIngGroup, setNewIngGroup] = useState(''); 
  const [yieldAmount, setYieldAmount] = useState('');
  
  const [targetYield, setTargetYield] = useState(item.baseYield || 1); 
  useEffect(() => { setTargetYield(item.baseYield || 1); }, [item.baseYield]);
  
  const ingredientOptions = useMemo(() => {
    return [
      { isGroup: true, label: t('recipeDetail.rawMaterial') || "📦 Сировина та мікси на складі" },
      ...[...inventory].filter(i=>!i.isPrep).sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(i=>({value: `inv_${i.id}`, label: i.name})),
      { isGroup: true, label: t('recipeDetail.techCards') || "📝 Тех. картки (Динамічні заготівлі)" },
      ...[...preps].filter(p => p.id !== item.id).sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(p=>({value: `prep_${p.id}`, label: `[ТК] ${p.name}`})),
      { isGroup: true, label: t('recipeDetail.readyBatches') || "🟣 Готові партії (Зі складу)" },
      ...[...inventory].filter(i=>i.isPrep).sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(i=>({value: `inv_${i.id}`, label: i.name}))
    ];
  }, [inventory, preps, item.id, t]);
  
  const [instModal, setInstModal] = useState(null); 
  const [showInst, setShowInst] = useState({});
  const toggleInst = (id) => setShowInst(prev => ({...prev, [id]: !prev[id]}));

  const handleUpdateField = (field, val) => onUpdate({ [field]: val });

  const handleEditIngredientLocal = (tId, oIdx) => {
    const isBase = tId === 'base'; 
    const arr = isBase ? item.ingredients : item.fillings.find(f=>f.id===tId).ingredients; 
    const oAmt = arr[oIdx].amount; const oGr = arr[oIdx].group || '';
    
    askPrompt(t('recipeDetail.editIngredient') || "Редагувати інгредієнт", [
      { name: 'amt', label: t('recipeDetail.quantity') || 'Кількість', type: 'number', defaultValue: oAmt },
      { name: 'grp', label: t('recipeDetail.groupOptional') || 'Група (необов\'язково)', defaultValue: oGr }
    ], (res) => {
       if (res.amt) {
         if(isBase) { 
            const u = [...item.ingredients]; u[oIdx] = {...u[oIdx], amount: Number(res.amt), group: res.grp || ''}; 
            handleUpdateField('ingredients', u); 
         } else { 
            const uF = item.fillings.map(f => f.id === tId ? {...f, ingredients: f.ingredients.map((ing, i) => i===oIdx ? {...ing, amount:Number(res.amt), group:res.grp || ''} : ing)} : f); 
            handleUpdateField('fillings', uF); 
         }
       }
    });
  };
  
  const handleDelIngredientLocal = (tId, oIdx) => askConfirm(t('common.delete') || "Видалити", t('recipeDetail.deleteIngredientConfirm') || "Видалити інгредієнт?", () => { 
    if (tId === 'base') handleUpdateField('ingredients', item.ingredients.filter((_, i) => i !== oIdx)); 
    else handleUpdateField('fillings', item.fillings.map(f => f.id === tId ? {...f, ingredients: f.ingredients.filter((_, i) => i !== oIdx)} : f)); 
  });
  
  // ВИПРАВЛЕНА ФУНКЦІЯ ЗМІНИ ФОТО
  const handleImageChange = async (e) => { 
    const f = e.target.files[0]; 
    if(f && compressImage){ 
      try {
        const img = await compressImage(f); 
        handleUpdateField('imageUrl', img);
      } catch (err) {
        console.error(t('recipeDetail.compressError') || "Помилка стиснення:", err);
      }
    } 
  }

  const handleSaveInstModal = () => {
    if (instModal.id === 'base') {
      handleUpdateField('instructions', instModal.text);
    } else {
      const newFillings = item.fillings.map(f => f.id === instModal.id ? { ...f, instructions: instModal.text } : f);
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
    const linkedItem = isPrepL ? preps.find(p => p.id === actualId) : inventory.find(i => i.id === actualId);
    if (linkedItem && linkedItem.unit) newIngUnit = linkedItem.unit;
  }
  
  const renderIngList = (ings, tId) => {
    if (!ings || ings.length === 0) return <p className="text-[#8C7A7A] text-center py-4 text-xs font-medium border border-dashed border-[#2A2323] rounded-2xl mt-4">{t('recipeDetail.empty') || "Порожньо"}</p>;
    
    const grouped = ings.map((ing, idx) => ({ ...ing, oIdx: idx })).reduce((acc, ing) => { 
      const g = ing.group || ''; if (!acc[g]) acc[g] = []; acc[g].push(ing); return acc; 
    }, {});
    
    return (
      <div className="mt-4">
        {Object.keys(grouped).sort().map((grp, gIdx) => (
          <div key={gIdx} className="mb-5">
            {grp && <h4 className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mb-2 pl-2">{grp}</h4>}
            <div className="bg-[#151212] border border-[#2A2323] rounded-2xl overflow-hidden">
              {grouped[grp].map((ing, lIdx) => { 
                const isPrepL = !!ing.prepId;
                const linkedItem = isPrepL ? preps.find(p => p.id === ing.prepId) : inventory.find(i=>i.id===ing.invId); 
                if(!linkedItem) return null; 
                
                const sAmt = ing.amount * sf; 
                return (
                  <div key={ing.oIdx} className={`p-4 flex justify-between items-center ${lIdx!==0?'border-t border-[#2A2323]':''}`}>
                    <div>
                      <h3 className="text-[#F4EFEA] font-medium text-base flex items-center gap-1.5">
                        {isPrepL && <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold">ТК</span>}
                        {!isPrepL && linkedItem.isMix && <span className="bg-[#2AABEE]/20 text-[#2AABEE] px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold">Мікс</span>}
                        {linkedItem.name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <p className="text-[#D4AF37] font-bold text-sm bg-[#1E1919] border border-[#2A2323] px-2 py-0.5 rounded-lg">{sAmt.toFixed(2)} {linkedItem.unit}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>handleEditIngredientLocal(tId, ing.oIdx)} className="text-[#8C7A7A] hover:text-[#D4AF37] p-2 bg-[#1E1919] rounded-xl border border-[#2A2323]"><Edit2 size={14}/></button>
                      <button onClick={()=>handleDelIngredientLocal(tId, ing.oIdx)} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#1E1919] rounded-xl border border-[#2A2323]"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ); 
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="pb-28">
      <div className="relative h-64 bg-[#1E1919] border-b border-[#2A2323] overflow-hidden group">
         <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none'}}>
            {!item.imageUrl && <div className="absolute inset-0 flex items-center justify-center"><Camera size={48} className="text-[#2A2323]" /></div>}
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-[#151212] via-[#151212]/80 to-transparent"></div>
         <input type="file" accept="image/*" id="recipe-img" className="hidden" onChange={handleImageChange} />
         <label htmlFor="recipe-img" className="absolute top-4 right-4 bg-[#151212]/80 backdrop-blur-md p-2 rounded-full border border-[#2A2323] text-[#F4EFEA] cursor-pointer"><Camera size={18}/></label>
         
         <div className="absolute bottom-6 left-6 right-6">
            <div className="flex justify-between items-end">
               <div>
                 {type === 'recipes' && (
                    <span onClick={() => askPrompt(t('recipeDetail.changeFolder') || "Змінити папку", [{name: 'val', label: t('recipeDetail.chooseCollection') || 'Оберіть колекцію', type: 'select', options: allCategories, defaultValue: item.category}], (res) => { if(res.val) handleUpdateField('category', res.val) })} className="text-[#D4AF37] bg-[#D4AF37]/20 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest mb-2 inline-block border border-[#D4AF37]/30 cursor-pointer">
                      {item.category || t('recipeDetail.other') || 'Інше'} <Edit2 size={10} className="inline ml-1"/>
                    </span>
                 )}
                 <h2 className="text-3xl font-black text-[#F4EFEA] leading-tight drop-shadow-lg">
                    {item.name} 
                    <Edit2 size={16} onClick={() => askPrompt(t('common.name') || "Назва", [{name: 'val', label: t('recipeDetail.dessertName') || 'Назва десерту', defaultValue: item.name}], (res) => { if(res.val) handleUpdateField('name', res.val) })} className="inline text-[#8C7A7A] cursor-pointer ml-2 mb-1"/>
                 </h2>
               </div>
               <button onClick={onDelete} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#151212]/80 backdrop-blur-md rounded-xl border border-[#2A2323]"><Trash2 size={18} /></button>
            </div>
         </div>
      </div>

      <div className="px-6 py-5 bg-[#1E1919] border-b border-[#2A2323] mb-6 flex justify-between items-center shadow-lg shadow-black/20">
         <div><p className="text-[#8C7A7A] text-[10px] font-bold mb-1 uppercase tracking-widest">{t('recipeDetail.costLabel') || 'Собівартість'} {type === 'preps' ? (t('recipeDetail.batch') || 'партії') : (t('recipeDetail.base') || 'основи')}</p><p className="text-3xl font-black text-[#D4AF37] tracking-tight">{bc.toFixed(2)} ₴</p></div>
         <div className="text-right">
            <span className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest block mb-1">{t('recipeDetail.yield') || 'Вихід'}</span>
            <strong className="text-[#F4EFEA] bg-[#151212] border border-[#2A2323] px-3 py-1.5 rounded-xl cursor-pointer inline-block" onClick={() => askPrompt(t('recipeDetail.yield') || "Вихід", [{name: 'val', label: `${t('recipeDetail.quantity') || 'Кількість'} (${item.unit})`, type: 'number', defaultValue: item.baseYield}], (res) => { if(res.val) handleUpdateField('baseYield', Number(res.val)) })}>
               {item.baseYield || 1} {item.unit || 'шт'}
            </strong>
         </div>
      </div>

      {type === 'recipes' && (
        <div className="mx-4 mb-6">
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block mb-2 px-2">{t('recipeDetail.priceFor') || 'Прайс (за'} {item.baseYield||1}{item.unit||'шт'})</label>
                <div className="flex items-center bg-[#151212] border border-[#2A2323] rounded-2xl p-4">
                  <input type="number" inputMode="decimal" value={item.defaultPrice || ''} placeholder="0" onChange={(e) => onUpdate({defaultPrice: parseFloat(e.target.value) || 0})} className="bg-transparent text-[#D4AF37] text-xl font-bold w-full outline-none"/>
                  <span className="text-[#8C7A7A] font-bold text-sm">₴</span>
                </div>
              </div>
              <div>
                <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block mb-2 px-2">{t('recipeDetail.minOrder') || 'Мін. замовлення'}</label>
                <div className="flex items-center bg-[#151212] border border-[#2A2323] rounded-2xl p-4 relative">
                  <input type="number" inputMode="decimal" value={item.minOrder || ''} placeholder="1" onChange={(e) => onUpdate({minOrder: parseFloat(e.target.value) || 1})} className="bg-transparent text-[#F4EFEA] text-xl font-bold w-full outline-none pr-8"/>
                  
                  <span onClick={() => askPrompt(t('recipeDetail.unit') || "Одиниця виміру", [{name: 'val', label: t('recipeDetail.unitOptions') || 'Одиниця (шт, кг, г, мл)', defaultValue: item.unit || 'шт'}], (res) => { if(res.val) onUpdate({unit: res.val.toLowerCase()}) })} className="absolute right-3 text-[#D4AF37] font-bold text-[10px] bg-[#D4AF37]/10 px-2 py-1.5 rounded-lg border border-[#D4AF37]/30 cursor-pointer active:scale-95 whitespace-nowrap uppercase tracking-widest">
                    {item.unit || 'шт'} <Edit2 size={10} className="inline ml-1"/>
                  </span>
                </div>
              </div>
           </div>
        </div>
      )}
      
      {type === 'preps' && (
        <div className="mx-4 mb-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-5 rounded-2xl">
          <label className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-3 block">{t('recipeDetail.makeBatch') || 'Зробити партію на склад'}</label>
          <div className="flex gap-3">
            <input type="number" inputMode="decimal" placeholder={`${t('recipeDetail.yield') || 'Вихід'} (${item.unit || 'г'})`} value={yieldAmount} onChange={e=>setYieldAmount(e.target.value)} className="w-2/3 bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-xl outline-none font-bold text-lg focus:border-[#D4AF37]"/>
            <button onClick={() => onCook(item, Number(yieldAmount))} disabled={!yieldAmount || bc === 0} className="w-1/3 bg-[#D4AF37] text-[#151212] disabled:opacity-50 font-black rounded-xl active:scale-95 uppercase tracking-widest text-xs">{t('common.done') || 'Готово'}</button>
          </div>
        </div>
      )}
      
      <div className="mx-4 mb-6 bg-[#1E1919] border border-[#2A2323] p-5 rounded-[24px] relative overflow-hidden shadow-lg">
         <div className="absolute -right-4 -top-4 opacity-5 text-[#D4AF37]"><Calculator size={100} /></div>
         <div className="flex items-center gap-2 mb-3">
            <Calculator size={16} className="text-[#D4AF37]" />
            <h3 className="text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest">{t('recipeDetail.calculator') || 'Калькулятор інгредієнтів'}</h3>
         </div>
         <p className="text-[#8C7A7A] text-xs font-medium mb-4 pr-8">{t('recipeDetail.howMuchToPrepare') || 'Скільки потрібно приготувати зараз?'} <strong className="text-[#F4EFEA]">{item.unit}</strong></p>
         <div className="flex items-center gap-3">
            <input type="number" inputMode="decimal" value={targetYield} onChange={(e) => setTargetYield(Number(e.target.value) || '')} className="bg-[#151212] border border-[#2A2323] text-[#F4EFEA] rounded-xl p-3 w-24 text-center font-black text-xl outline-none focus:border-[#D4AF37] transition-colors shadow-inner" />
            <span className="text-[#8C7A7A] font-bold text-sm">{item.unit}</span>
         </div>
         {sf !== 1 && <p className="text-[#5B7A5A] text-[10px] mt-4 font-bold bg-[#5B7A5A]/10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#5B7A5A]/20 uppercase tracking-widest"><CheckCircle size={12}/> {t('recipeDetail.gramsRecalculated') || 'Грами перераховано!'}</p>}
      </div>

      <div className="mx-4 mb-8">
        <div className="mb-8">
          <button onClick={() => toggleInst('base')} className="flex items-center justify-between w-full bg-[#1E1919] border border-[#2A2323] p-4 rounded-2xl active:scale-95 transition-all shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={18} className={showInst['base'] ? "text-[#D4AF37]" : "text-[#8C7A7A]"}/>
              <span className={`font-bold tracking-wide text-sm ${showInst['base'] ? "text-[#F4EFEA]" : "text-[#8C7A7A]"}`}>{t('recipeDetail.technology') || 'Технологія приготування'}</span>
            </div>
            <ChevronRight size={18} className={`text-[#8C7A7A] transition-transform duration-150 ${showInst['base'] ? 'rotate-90' : ''}`} />
          </button>
          
          {showInst['base'] && (
            <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-100">
              {item.instructions ? (
                <div className="bg-[#1E1919] p-5 rounded-[24px] border border-[#2A2323] text-[#F4EFEA] text-sm leading-relaxed whitespace-pre-wrap shadow-lg relative">
                   <button onClick={() => setInstModal({id: 'base', text: item.instructions || ''})} className="absolute top-4 right-4 text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded-xl active:scale-95"><Edit2 size={16}/></button>
                   <div className="pr-10">{item.instructions}</div>
                </div>
              ) : (
                <div onClick={() => setInstModal({id: 'base', text: ''})} className="bg-[#1E1919] p-5 rounded-3xl border border-dashed border-[#2A2323] text-center text-[#8C7A7A] cursor-pointer active:scale-95 transition-all text-sm">
                   {t('recipeDetail.addProcess') || '+ Додати опис процесу'}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest pl-1">{type==='preps' ? t('recipeDetail.compositionPrep') : t('recipeDetail.compositionBase')}</p>
          <button onClick={() => setIsAddingTo('base')} className="text-[#D4AF37] text-[10px] font-bold uppercase bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg">{t('recipeDetail.addIngr') || '+ Інгр.'}</button>
        </div>
        
        {isAddingTo === 'base' && (
          <div className="bg-[#1E1919] border border-[#2A2323] p-4 rounded-2xl mb-4">
            <CustomSelect 
              value={newIngFullId} 
              onChange={setNewIngFullId} 
              options={ingredientOptions} 
              label="Вибір компонента"
              placeholder={t('recipeDetail.chooseComponent') || 'Оберіть компонент...'}
              searchable={true}
              className="w-full bg-[#151212] text-[#F4EFEA] border border-[#2A2323] p-4 rounded-xl mb-3 outline-none" 
            />
            <div className="flex gap-2 mb-3">
              <input type="number" inputMode="decimal" placeholder={`К-ть (${newIngUnit})`} value={newIngAmount} onChange={e=>setNewIngAmount(e.target.value)} className="w-1/2 bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-xl outline-none font-bold text-lg text-center transition-colors shadow-inner"/>
              <input type="text" placeholder="Група" value={newIngGroup} onChange={e=>setNewIngGroup(e.target.value)} className="w-1/2 bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-xl outline-none text-center transition-colors shadow-inner"/>
            </div>
            <div className="flex gap-2">
              <button onClick={()=> {
                if(newIngFullId && newIngAmount){
                  const isPrepL = newIngFullId.startsWith('prep_');
                  const actualId = newIngFullId.split('_')[1];
                  const newObj = isPrepL ? { prepId: actualId, amount: Number(newIngAmount), group: newIngGroup } : { invId: actualId, amount: Number(newIngAmount), group: newIngGroup };
                  handleUpdateField('ingredients', [...(item.ingredients||[]), newObj]); setIsAddingTo(false); setNewIngFullId(''); setNewIngAmount('');
                }
              }} className="flex-1 bg-[#D4AF37] text-[#151212] shadow-lg shadow-[#D4AF37]/20 font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs active:scale-95">{t('common.done') || 'Додати'}</button>
              <button onClick={()=>{setIsAddingTo(false); setNewIngFullId(''); setNewIngAmount('');}} className="flex-1 bg-[#151212] border border-[#2A2323] text-[#F4EFEA] py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95">{t('recipeDetail.cancel') || 'Відміна'}</button>
            </div>
          </div>
        )}
        
        {renderIngList(item.ingredients, 'base')}
      </div>

      {type === 'recipes' && (
        <div className="px-4 border-t border-[#2A2323] pt-8 mb-10">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[#8C7A7A] text-xs font-bold uppercase tracking-widest pl-1">{t('recipeDetail.fillings') || 'Начинки'}</p>
            <button onClick={() => askPrompt(t('recipeDetail.newFilling') || "Нова начинка", [{name: 'val', label: t('recipeDetail.fillingName') || 'Назва начинки', placeholder: t('recipeDetail.fillingExample') || 'Напр: Вишневе конфі'}], (res) => { if(res.val) handleUpdateField('fillings', [...(item.fillings || []), { id: Date.now().toString(), name: res.val, ingredients: [], instructions: '' }]); })} className="text-[#F4EFEA] text-[10px] font-bold uppercase bg-[#1E1919] border border-[#2A2323] px-3 py-1.5 rounded-lg active:scale-95">{t('recipeDetail.addFilling') || '+ Начинка'}</button>
          </div>
          
          {(item.fillings || []).map(fil => { 
            const fC = costFn({ ingredients: fil.ingredients }); 
            return (
              <div key={fil.id} className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 mb-6 shadow-lg relative">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-[#F4EFEA] font-bold text-xl pr-4 leading-tight">{fil.name} <Edit2 size={12} className="inline text-[#8C7A7A] ml-1 cursor-pointer" onClick={() => askPrompt(t('common.name') || "Назва", [{name: 'val', label: t('recipeDetail.fillingName') || 'Назва начинки', defaultValue: fil.name}], (res) => { if(res.val) handleUpdateField('fillings', item.fillings.map(f=>f.id===fil.id?{...f,name:res.val}:f)) })}/></h4>
                  <button onClick={() => askConfirm(t('recipeDetail.deleteFillingConfirm') || "Видалити начинку?", "", () => handleUpdateField('fillings', item.fillings.filter(f => f.id !== fil.id)))} className="text-[#8C7A7A] hover:text-red-400 bg-[#151212] p-2 rounded-xl border border-[#2A2323]"><Trash2 size={16}/></button>
                </div>
                <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest mb-5">{t('recipeDetail.costLabel') || 'Собівартість'}: <span className="text-[#D4AF37] font-black text-sm">+{fC.toFixed(2)} ₴</span></p>
                <div className="mb-6">
                  <button onClick={() => toggleInst(fil.id)} className="flex items-center justify-between w-full bg-[#151212] border border-[#2A2323] p-3.5 rounded-xl active:scale-95 transition-all shadow-sm">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className={showInst[fil.id] ? "text-[#D4AF37]" : "text-[#8C7A7A]"}/>
                      <span className={`font-medium text-sm ${showInst[fil.id] ? "text-[#F4EFEA]" : "text-[#8C7A7A]"}`}>{t('recipeDetail.howToCookFilling') || 'Як готувати начинку'}</span>
                    </div>
                    <ChevronRight size={16} className={`text-[#8C7A7A] transition-transform duration-150 ${showInst[fil.id] ? 'rotate-90' : ''}`} />
                  </button>
                  {showInst[fil.id] && (
                    <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-100">
                      {fil.instructions ? (
                        <div className="bg-[#151212] p-5 rounded-[24px] border border-[#2A2323] text-[#F4EFEA] text-sm leading-relaxed whitespace-pre-wrap relative">
                           <button onClick={() => setInstModal({id: fil.id, text: fil.instructions || ''})} className="absolute top-4 right-4 text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded-xl active:scale-95"><Edit2 size={16}/></button>
                           <div className="pr-10">{fil.instructions}</div>
                        </div>
                      ) : (
                        <div onClick={() => setInstModal({id: fil.id, text: ''})} className="bg-[#151212] p-4 rounded-2xl border border-dashed border-[#2A2323] text-center text-[#8C7A7A] cursor-pointer active:scale-95 transition-all text-xs">
                           {t('recipeDetail.addFillingProcess') || '+ Додати процес начинки'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest pl-1">{t('recipeDetail.fillingComposition') || 'Склад начинки'}</p>
                  <button onClick={() => setIsAddingTo(fil.id)} className="text-[#D4AF37] text-[10px] font-bold uppercase bg-[#D4AF37]/10 px-2 py-1 rounded-lg">{t('recipeDetail.addIngr') || '+ Інгр.'}</button>
                </div>
                {isAddingTo === fil.id && (
                  <div className="bg-[#151212] border border-[#2A2323] p-4 rounded-2xl mb-4">
                    <CustomSelect 
                      value={newIngFullId} 
                      onChange={setNewIngFullId} 
                      options={ingredientOptions} 
                      label="Вибір компонента"
                      placeholder={t('recipeDetail.chooseComponent') || 'Оберіть компонент...'}
                      searchable={true}
                      className="w-full bg-[#1E1919] text-[#F4EFEA] border border-[#2A2323] p-4 rounded-xl mb-3 outline-none" 
                    />
                    <div className="flex gap-2 mb-3">
                      <input type="number" inputMode="decimal" placeholder={`К-ть (${newIngUnit})`} value={newIngAmount} onChange={e=>setNewIngAmount(e.target.value)} className="w-1/2 bg-[#1E1919] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-xl outline-none font-bold text-lg text-center transition-colors shadow-inner"/>
                      <input type="text" placeholder="Група" value={newIngGroup} onChange={e=>setNewIngGroup(e.target.value)} className="w-1/2 bg-[#1E1919] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-xl outline-none text-center transition-colors shadow-inner"/>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=> {
                        if(newIngFullId && newIngAmount){
                          const isPrepL = newIngFullId.startsWith('prep_');
                          const actualId = newIngFullId.split('_')[1];
                          const newObj = isPrepL ? { prepId: actualId, amount: Number(newIngAmount), group: newIngGroup } : { invId: actualId, amount: Number(newIngAmount), group: newIngGroup };
                          handleUpdateField('fillings', item.fillings.map(f=>f.id===fil.id?{...f, ingredients:[...f.ingredients, newObj]}:f)); setIsAddingTo(false); setNewIngFullId(''); setNewIngAmount('');
                        }
                      }} className="flex-1 bg-[#D4AF37] text-[#151212] shadow-lg shadow-[#D4AF37]/20 font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs active:scale-95">{t('common.done') || 'Додати'}</button>
                      <button onClick={()=>{setIsAddingTo(false); setNewIngFullId(''); setNewIngAmount('');}} className="flex-1 bg-[#1E1919] border border-[#2A2323] text-[#F4EFEA] py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95">{t('recipeDetail.cancel') || 'Відміна'}</button>
                    </div>
                  </div>
                )}
                {renderIngList(fil.ingredients, fil.id)}
              </div>
            ) 
          })}
        </div>
      )}

      {instModal && (
        <div className="fixed inset-0 z-[150] flex justify-center sm:items-center sm:py-8 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[420px] bg-[#151212] h-full sm:h-[850px] sm:rounded-[48px] sm:border-[8px] border-[#2A2323] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between px-4 py-4 bg-[#1E1919] border-b border-[#2A2323]">
               <button onClick={() => setInstModal(null)} className="text-[#8C7A7A] hover:text-[#F4EFEA] font-bold px-2 py-1 transition-colors">{t('recipeDetail.cancel') || 'Скасувати'}</button>
               <h3 className="text-[#F4EFEA] font-bold tracking-widest uppercase text-xs">{t('recipeDetail.process') || 'Процес'}</h3>
               <button onClick={handleSaveInstModal} className="bg-[#D4AF37] text-[#151212] px-5 py-2 rounded-xl font-bold active:scale-95 transition-transform shadow-lg shadow-[#D4AF37]/20">{t('recipeDetail.save') || 'Зберегти'}</button>
            </div>
            <textarea 
               autoFocus
               value={instModal.text}
               onChange={e => setInstModal({...instModal, text: e.target.value})}
               placeholder={t('recipeDetail.describeSteps') || "Опишіть детально кроки приготування..."}
               className="flex-1 w-full bg-[#151212] text-[#F4EFEA] p-6 outline-none resize-none text-base leading-relaxed custom-scrollbar"
            />
          </div>
        </div>
      )}
    </div>
  );
}