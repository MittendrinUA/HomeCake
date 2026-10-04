import { useTranslation } from "react-i18next";
import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { Camera, SmilePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryForm = memo(function CategoryForm({ cat, onSave, onCancel, onDelete }) {
  const { t } = useTranslation();
  const [name, setName] = useState(cat.name || '');
  const [icon, setIcon] = useState(cat.icon || '');
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(cat.imageUrl || null);

  const handleFileChange = (e) => {
    const s = e.target.files[0];
    if (s) {
      setFile(s);
      setPreview(URL.createObjectURL(s));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 pb-28">
      <div className="bg-gradient-to-b from-[#1E1919] to-[#151212] border border-[#2A2323] rounded-[32px] p-6 shadow-2xl shadow-black/50">
        <h2 className="text-white font-bold text-2xl mb-8 tracking-wide drop-shadow-sm">{cat.name ? 'Налаштування' : 'Нова папка'}</h2>
        
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t("auto.t_106", "Назва")}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-white p-4 rounded-2xl mb-6 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all font-medium shadow-inner" placeholder={t("auto.t_107", "Напр: Мусові торти")} />
        
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t("auto.t_108", "Іконка (Емодзі)")}</label>
        <div className="flex gap-4 items-center mb-6">
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍰" className="w-24 bg-[#151212] border border-[#2A2323] text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 p-4 rounded-2xl outline-none text-3xl text-center transition-all shadow-inner shrink-0" maxLength={2} />
          <button type="button" onClick={() => setShowEmojiModal(true)} className="flex-1 bg-[#151212] border border-[#2A2323] hover:border-[#D4AF37]/50 active:bg-[#1E1919] p-4 rounded-2xl flex items-center justify-center gap-3 transition-all group shadow-inner h-[76px]">
            <SmilePlus size={24} className="text-[#8C7A7A] group-hover:text-[#D4AF37] transition-colors" />
            <span className="text-[#8C7A7A] font-medium text-sm group-hover:text-[#F4EFEA] transition-colors">Обрати зі списку</span>
          </button>
        </div>
        
        {createPortal(
          <AnimatePresence>
            {showEmojiModal && (
              <div className="fixed inset-0 z-[150] flex flex-col justify-end items-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setShowEmojiModal(false)} className="absolute inset-0 bg-black/80" />
                <motion.div style={{ willChange: 'transform' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "tween", duration: 0.25, ease: "easeOut" }} className="relative bg-[#151212] w-full max-w-md mx-auto rounded-t-[32px] border-t border-[#2A2323] p-6 pb-safe shadow-2xl flex flex-col max-h-[85vh]">
                  <div className="w-12 h-1.5 bg-[#2A2323] rounded-full mx-auto mb-6 shrink-0" />
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <h3 className="text-[#F4EFEA] text-xl font-bold">Оберіть емодзі</h3>
                    <button type="button" onClick={() => setShowEmojiModal(false)} className="text-[#8C7A7A] hover:text-[#F4EFEA] p-2 bg-[#1E1919] rounded-xl"><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 grid grid-cols-5 gap-3">
                    {['🍰','🧁','🍪','🥐','🍞','🥖','🥞','🧇','🎂','🍫','🍬','🍭','🍮','🥧','🍓','🍒','🍎','🍋','☕','🥂','🥥','🍇','🥝','🫐','🍯','🥜'].map(e => (
                      <button type="button" key={e} onClick={() => {setIcon(e); setShowEmojiModal(false);}} className={`text-4xl p-2 rounded-2xl flex items-center justify-center transition-all ${icon === e ? 'bg-[#D4AF37]/20 scale-110 shadow-lg' : 'hover:bg-[#1E1919] bg-[#151212] border border-[#2A2323]'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
        
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block ml-1">{t("auto.t_109", "Фонове фото")}</label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="cat-photo" />
        <label htmlFor="cat-photo" className="w-full border-2 border-dashed border-[#2A2323] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] hover:bg-[#1E1919] transition-all bg-[#151212] mb-8 h-40 bg-cover bg-center relative overflow-hidden shadow-inner">
          {preview && <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url(${preview})` }}></div>}
          <Camera size={32} className="mb-2 text-[#8C7A7A] relative z-10" />
          <span className="text-sm font-medium text-[#8C7A7A] relative z-10 uppercase tracking-widest">{preview ? 'Змінити' : 'Завантажити'}</span>
        </label>
        
        <div className="flex flex-col gap-3 mt-4">
          <button onClick={() => onSave(cat.id, cat.name, name, icon, file)} disabled={!name} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#151212] font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 uppercase tracking-widest active:scale-95 transition-all">{t("auto.t_110", "Зберегти")}</button>
          {cat.name && <button onClick={onDelete} className="w-full bg-[#151212] text-red-400 border border-[#2A2323] font-bold py-4 rounded-2xl active:scale-95 transition-all">{t("auto.t_111", "Видалити")}</button>}
          <button onClick={onCancel} className="w-full bg-[#151212] text-[#F4EFEA] border border-[#2A2323] font-bold py-4 rounded-2xl active:scale-95 transition-all">{t("auto.t_112", "Скасувати")}</button>
        </div>
      </div>
    </motion.div>);

});

export default CategoryForm;