import React, { useState, memo } from 'react';
import { Camera } from 'lucide-react';

const AddInventoryForm = memo(function AddInventoryForm({ onSave }) {
  const [name, setName] = useState(''); 
  const [quantity, setQuantity] = useState(''); 
  const [totalCost, setTotalCost] = useState(''); 
  const [unit, setUnit] = useState('г');
  const [file, setFile] = useState(null); 
  const [preview, setPreview] = useState('');
  const [isMix, setIsMix] = useState(false);

  const calcPrice = (Number(quantity) > 0 && Number(totalCost) > 0) ? (Number(totalCost) / Number(quantity)) : 0;

  return (
    <div className="p-4 h-full">
       <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Назва матеріалу</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-4 outline-none font-medium transition-colors" />
          
          <label className="flex items-center gap-3 mb-6 p-4 bg-[#151212] border border-[#2A2323] rounded-2xl cursor-pointer">
            <input type="checkbox" checked={isMix} onChange={e=>setIsMix(e.target.checked)} className="w-5 h-5 accent-[#D4AF37]" />
            <span className="text-[#F4EFEA] text-sm font-bold">Це збірний мікс (наприклад, кошик фруктів)</span>
          </label>

          {!isMix && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                   <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Придбана К-ть</label>
                   <input type="number" inputMode="decimal" value={quantity} onChange={e=>setQuantity(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none" />
                </div>
                <div>
                   <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Одиниці</label>
                   <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none appearance-none">
                      <option value="г">Грами</option>
                      <option value="кг">Кілограми</option>
                      <option value="шт">Штуки</option>
                      <option value="мл">Мілілітри</option>
                   </select>
                </div>
              </div>
              
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Загальна вартість покупки (₴)</label>
              <input type="number" inputMode="decimal" value={totalCost} onChange={e=>setTotalCost(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-bold" />
              
              {calcPrice > 0 && (
                 <div className="mb-6 p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-between">
                    <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">Авто-розрахунок:</span>
                    <span className="text-[#F4EFEA] font-bold text-sm">{calcPrice.toFixed(2)} ₴ <span className="text-[#8C7A7A] font-medium text-xs">/ 1 {unit}</span></span>
                 </div>
              )}
            </>
          )}

          {isMix && (
            <div className="mb-6 p-4 bg-[#2AABEE]/10 border border-[#2AABEE]/30 rounded-2xl">
               <p className="text-[#2AABEE] text-xs leading-relaxed font-medium">Ви зможете додавати конкретні фрукти/компоненти всередину цього міксу після його збереження на склад.</p>
            </div>
          )}
          
          <div className="mb-8">
             <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Фото (необов'язково)</label>
             <input type="file" accept="image/*" onChange={e=>{const s=e.target.files[0]; if(s){setFile(s); setPreview(URL.createObjectURL(s));}}} className="hidden" id="inv-photo" />
             <label htmlFor="inv-photo" className="w-full border-2 border-dashed border-[#2A2323] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] bg-[#151212] h-24 bg-cover bg-center relative overflow-hidden">
                {preview && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: `url(${preview})`}}></div>}
                <Camera size={24} className="mb-1 text-[#8C7A7A] relative z-10"/>
                <span className="text-xs font-medium text-[#8C7A7A] relative z-10">{preview?'Змінити':'Завантажити'}</span>
             </label>
          </div>

          <button onClick={() => onSave({ name, isMix, mixItems: [], quantity: isMix ? 0 : Number(quantity), price: isMix ? 0 : Number(calcPrice.toFixed(2)), unit: isMix ? 'г' : unit }, file)} disabled={!name || (!isMix && (!totalCost || !quantity))} className="w-full bg-[#D4AF37] disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-[#D4AF37]/20 active:scale-95">Зберегти на склад</button>
       </div>
    </div>
  );
});

export default AddInventoryForm;
