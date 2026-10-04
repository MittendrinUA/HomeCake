import { useTranslation } from "react-i18next";
import React, { useState, memo } from 'react';
import { Camera, AlertTriangle } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';
import { motion } from 'framer-motion';

const AddInventoryForm = memo(function AddInventoryForm({ onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [unit, setUnit] = useState('г');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isMix, setIsMix] = useState(false);

  const calcPrice = Number(quantity) > 0 && Number(totalCost) > 0 ? Number(totalCost) / Number(quantity) : 0;

  const unitOptions = [
    { value: 'г', label: t('addRecipe.g', 'г') },
    { value: 'кг', label: t('addRecipe.kg', 'кг') },
    { value: 'шт', label: t('addRecipe.pcs', 'шт') },
    { value: 'мл', label: t('addRecipe.ml', 'мл') }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 h-full pb-28">
       <div className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[32px] p-6 shadow-2xl">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">{t("auto.t_21", "Назва матеріалу")}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#110E0E] border border-[#2A2323] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-[#F4EFEA] p-4 rounded-2xl mb-5 outline-none font-medium transition-all shadow-inner" />
          
          <label className="flex items-center gap-3 mb-6 p-4 bg-[#110E0E] border border-[#2A2323] rounded-2xl cursor-pointer hover:border-[#D4AF37]/50 transition-colors shadow-inner">
            <input type="checkbox" checked={isMix} onChange={(e) => setIsMix(e.target.checked)} className="w-5 h-5 accent-[#D4AF37]" />
            <span className="text-[#F4EFEA] text-sm font-bold">{t("auto.t_22", "Це збірний мікс (наприклад, кошик фруктів)")}</span>
          </label>

          {!isMix &&
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                   <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">{t("auto.t_23", "Придбана К-ть")}</label>
                   <input type="number" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-[#110E0E] border border-[#2A2323] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-[#F4EFEA] p-4 rounded-2xl outline-none transition-all shadow-inner font-bold" />
                </div>
                <div>
                   <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">{t("auto.t_24", "Одиниці")}</label>
                   <CustomSelect
                     value={unit}
                     onChange={setUnit}
                     options={unitOptions}
                     label={t("auto.t_25", "Одиниці виміру")}
                     className="w-full bg-[#110E0E] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-2xl outline-none shadow-inner" 
                   />
                </div>
              </div>
              
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">{t("auto.t_26", "Загальна вартість покупки (₴)")}</label>
              <input type="number" inputMode="decimal" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className="w-full bg-[#110E0E] border border-[#2A2323] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-[#F4EFEA] p-4 rounded-2xl mb-5 outline-none font-black text-lg transition-all shadow-inner" />
              
              {calcPrice > 0 &&
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-between shadow-sm">
                  <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">{t("auto.t_27", "Авто-розрахунок:")}</span>
                  <span className="text-[#F4EFEA] font-black text-sm">{calcPrice.toFixed(2)} ₴ <span className="text-[#8C7A7A] font-medium text-xs">/ 1 {unit}</span></span>
                </motion.div>
              }
            </motion.div>
          }

          <div className="mb-6">
            <label className="text-[#8C7A7A] flex items-center gap-2 text-[10px] uppercase font-bold mb-2 tracking-widest"><AlertTriangle size={12} className="text-[#D4AF37]"/> Мінімальний залишок (для сповіщень)</label>
            <div className="flex gap-3">
              <input type="number" inputMode="decimal" placeholder="0" value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} className="w-full bg-[#110E0E] border border-[#2A2323] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-[#F4EFEA] p-4 rounded-2xl outline-none font-bold text-lg transition-all shadow-inner" />
              <div className="flex items-center bg-[#110E0E] border border-[#2A2323] px-5 rounded-2xl shadow-inner text-[#8C7A7A] font-bold uppercase text-xs">{unit}</div>
            </div>
            <p className="text-[#8C7A7A] text-[9px] mt-2 font-medium">Коли залишок буде менше цього значення, програма попередить вас і додасть позицію в список закупівель.</p>
          </div>

          {isMix &&
            <div className="mb-6 p-4 bg-[#2AABEE]/10 border border-[#2AABEE]/20 rounded-2xl shadow-sm">
               <p className="text-[#2AABEE] text-xs leading-relaxed font-bold">{t("auto.t_28", "Ви зможете додавати конкретні фрукти/компоненти всередину цього міксу після його збереження на склад.")}</p>
            </div>
          }
          
          <button onClick={() => {
            let finalUnit = isMix ? 'г' : unit;
            let finalQty = isMix ? 0 : Number(quantity);
            let finalPrice = isMix ? 0 : Number(calcPrice.toFixed(4));
            let finalMin = Number(minThreshold) || 0;

            if (finalUnit === 'кг') {
              finalQty *= 1000;
              finalPrice /= 1000;
              finalUnit = 'г';
            }

            onSave({
              name,
              isMix,
              mixItems: [],
              quantity: finalQty,
              price: finalPrice,
              unit: finalUnit,
              minThreshold: finalMin
            });
          }} disabled={!name || !isMix && (!totalCost || !quantity)} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(212,175,55,0.2)] active:scale-95 transition-all">{t("auto.t_30", "Зберегти на склад")}</button>
       </div>
    </motion.div>
  );
});

export default AddInventoryForm;