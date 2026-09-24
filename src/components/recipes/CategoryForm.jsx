import React, { useState, memo } from 'react';
import { Camera } from 'lucide-react';

const CategoryForm = memo(function CategoryForm({ cat, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(cat.name || ''); 
  const [icon, setIcon] = useState(cat.icon || ''); 
  const [file, setFile] = useState(null); 
  const [preview, setPreview] = useState(cat.imageUrl || null);
  
  const handleFileChange = (e) => { 
    const s = e.target.files[0]; 
    if(s){
      setFile(s);
      setPreview(URL.createObjectURL(s));
    } 
  };
  
  return (
    <div className="p-4">
      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg shadow-black/40">
        <h2 className="text-[#F4EFEA] font-bold text-xl mb-6 tracking-wide">{cat.name ? 'Налаштування' : 'Нова папка'}</h2>
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Назва</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-2xl mb-5 outline-none focus:border-[#D4AF37]" placeholder="Напр: Мусові торти"/>
        
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Іконка (Емодзі)</label>
        <input value={icon} onChange={e=>setIcon(e.target.value)} placeholder="🍰" className="w-20 bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-2xl mb-5 outline-none text-2xl text-center" maxLength={2} />
        
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Фонове фото</label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="cat-photo" />
        <label htmlFor="cat-photo" className="w-full border-2 border-dashed border-[#2A2323] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] bg-[#151212] mb-8 h-40 bg-cover bg-center relative overflow-hidden">
          {preview && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: `url(${preview})`}}></div>}
          <Camera size={32} className="mb-2 text-[#8C7A7A] relative z-10"/>
          <span className="text-sm font-medium text-[#8C7A7A] relative z-10">{preview ? 'Змінити' : 'Завантажити'}</span>
        </label>
        
        <div className="flex flex-col gap-3">
          <button onClick={() => onSave(cat.id, cat.name, name, icon, file)} disabled={!name} className="w-full bg-[#D4AF37] text-[#151212] font-bold py-4 rounded-2xl">Зберегти</button>
          {cat.name && <button onClick={onDelete} className="w-full bg-[#151212] text-red-400 border border-[#2A2323] font-bold py-4 rounded-2xl">Видалити</button>}
          <button onClick={onCancel} className="w-full bg-[#151212] text-[#F4EFEA] border border-[#2A2323] font-bold py-4 rounded-2xl">Скасувати</button>
        </div>
      </div>
    </div>
  )
});

export default CategoryForm;
