import React, { useState } from 'react';
import { Camera } from 'lucide-react'; 

export default function AddRecipeForm({ onSave, type, initialCategory, allCategories }) {
  const [name, setName] = useState(''); 
  const [category, setCategory] = useState(initialCategory || 'Інше'); 
  const [unit, setUnit] = useState(type === 'prep' ? 'г' : 'шт'); 
  const [baseYield, setBaseYield] = useState('1'); 
  const [defaultPrice, setDefaultPrice] = useState(''); 
  const [minOrder, setMinOrder] = useState('1'); // НОВЕ ПОЛЕ
  const [file, setFile] = useState(null); 
  const [preview, setPreview] = useState('');

  return (
    <div className="p-4 h-full">
      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg">
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Назва {type === 'prep' ? 'заготівлі' : 'десерту'}</label>
        <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-medium" />
        
        {type === 'recipe' && (
          <div className="mb-6">
            <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Колекція (Папка)</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none font-medium appearance-none">
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Вихід рецепту</label>
            <input type="number" inputMode="decimal" value={baseYield} onChange={e=>setBaseYield(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none font-medium text-center" />
          </div>
          <div>
            <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Одиниці</label>
            <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none appearance-none">
              <option value="г">г</option>
              <option value="кг">кг</option>
              <option value="шт">шт</option>
              <option value="мл">мл</option>
            </select>
          </div>
        </div>
        
        {/* НОВИЙ БЛОК: ПРАЙС ТА МІНІМУМ */}
        {type === 'recipe' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Прайс (₴)</label>
              <input type="number" inputMode="decimal" placeholder="0" value={defaultPrice} onChange={e=>setDefaultPrice(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#D4AF37] p-4 rounded-2xl outline-none font-bold" />
            </div>
            <div>
              <label className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-2 block">Мін. замовлення</label>
              <input type="number" inputMode="decimal" placeholder="1" value={minOrder} onChange={e=>setMinOrder(e.target.value)} className="w-full bg-[#151212] border border-[#D4AF37]/50 focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none font-bold" />
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Фото (необов'язково)</label>
          <input type="file" accept="image/*" onChange={e=>{const s=e.target.files[0]; if(s){setFile(s); setPreview(URL.createObjectURL(s));}}} className="hidden" id="rec-photo" />
          <label htmlFor="rec-photo" className="w-full border-2 border-dashed border-[#2A2323] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] bg-[#151212] h-24 bg-cover bg-center relative overflow-hidden">
            {preview && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: `url(${preview})`}}></div>}
            <Camera size={24} className="mb-1 text-[#8C7A7A] relative z-10"/>
            <span className="text-xs font-medium text-[#8C7A7A] relative z-10">{preview?'Змінити':'Завантажити'}</span>
          </label>
        </div>
        
        <button onClick={() => onSave({ name, category: type==='recipe'?category:null, unit, baseYield: Number(baseYield), defaultPrice: type === 'recipe' ? Number(defaultPrice) : 0, minOrder: type === 'recipe' ? Number(minOrder) : 1 }, file)} disabled={!name} className={`w-full bg-[#D4AF37] disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-[#D4AF37]/20 active:scale-95`}>Створити</button>
      </div>
    </div>
  );
}