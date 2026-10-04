import React, { useState } from 'react';
import { Camera } from 'lucide-react'; 
import { useTranslation } from 'react-i18next';
import CustomSelect from './ui/CustomSelect';
import { motion } from 'framer-motion';

export default function AddRecipeForm({ onSave, type, initialCategory, allCategories }) {
  const { t } = useTranslation();
  const [name, setName] = useState(''); 
  const [category, setCategory] = useState(initialCategory || t('common.other')); 
  const [unit, setUnit] = useState(type === 'prep' ? 'г' : 'шт'); 
  const [baseYield, setBaseYield] = useState('1'); 
  const [defaultPrice, setDefaultPrice] = useState(''); 
  const [minOrder, setMinOrder] = useState('1'); 
  const [file, setFile] = useState(null); 
  const [preview, setPreview] = useState('');

  const categoryOptions = allCategories.map(c => ({ value: c, label: c }));
  const unitOptions = [
    { value: 'г', label: t('addRecipe.g') },
    { value: 'кг', label: t('addRecipe.kg') },
    { value: 'шт', label: t('addRecipe.pcs') },
    { value: 'мл', label: t('addRecipe.ml') }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 h-full pb-20">
      <div className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[32px] p-6 shadow-2xl shadow-black/50">
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{type === 'prep' ? t('addRecipe.namePrep') : t('addRecipe.nameDessert')}</label>
        <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-white p-4 rounded-2xl mb-6 outline-none font-medium transition-all shadow-inner" />
        
        {type === 'recipe' && (
          <div className="mb-6">
            <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t('addRecipe.collection')}</label>
            <CustomSelect 
              value={category} 
              onChange={setCategory} 
              options={categoryOptions} 
              className="w-full bg-[#151212] border border-[#2A2323] text-white p-4 rounded-2xl outline-none font-medium shadow-inner"
            />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t('addRecipe.yield')}</label>
            <input type="number" inputMode="decimal" value={baseYield} onChange={e=>setBaseYield(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-white p-4 rounded-2xl outline-none font-bold text-center transition-all shadow-inner text-lg" />
          </div>
          <div>
            <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t('addRecipe.units')}</label>
            <CustomSelect 
              value={unit} 
              onChange={setUnit} 
              options={unitOptions} 
              className="w-full bg-[#151212] border border-[#2A2323] text-white p-4 rounded-2xl outline-none font-medium shadow-inner"
            />
          </div>
        </div>
        
        {type === 'recipe' && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t('addRecipe.price')}</label>
              <input type="number" inputMode="decimal" placeholder="0" value={defaultPrice} onChange={e=>setDefaultPrice(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-[#D4AF37] p-4 rounded-2xl outline-none font-bold transition-all shadow-inner text-lg" />
            </div>
            <div>
              <label className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t('addRecipe.minOrder')}</label>
              <input type="number" inputMode="decimal" placeholder="1" value={minOrder} onChange={e=>setMinOrder(e.target.value)} className="w-full bg-[#151212] border border-[#D4AF37]/40 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-white p-4 rounded-2xl outline-none font-bold transition-all shadow-[inset_0_0_15px_rgba(212,175,55,0.05)] text-lg" />
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t('addRecipe.photoOptional')}</label>
          <input type="file" accept="image/*" onChange={e=>{const s=e.target.files[0]; if(s){setFile(s); setPreview(URL.createObjectURL(s));}}} className="hidden" id="rec-photo" />
          <label htmlFor="rec-photo" className="w-full border-2 border-dashed border-[#2A2323] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] bg-[#151212] h-28 bg-cover bg-center relative overflow-hidden transition-all shadow-inner hover:bg-[#1E1919]">
            {preview && <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{backgroundImage: `url(${preview})`}}></div>}
            <Camera size={28} className="mb-2 text-[#8C7A7A] relative z-10"/>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C7A7A] relative z-10">{preview ? t('addRecipe.change') : t('addRecipe.upload')}</span>
          </label>
        </div>
        
        <button onClick={() => onSave({ name, category: type==='recipe'?category:null, unit, baseYield: Number(baseYield), defaultPrice: type === 'recipe' ? Number(defaultPrice) : 0, minOrder: type === 'recipe' ? Number(minOrder) : 1 }, file)} disabled={!name} className={`w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95 transition-all mt-4`}>{t('addRecipe.create')}</button>
      </div>
    </motion.div>
  );
}
