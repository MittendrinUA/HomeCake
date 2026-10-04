import { useTranslation } from "react-i18next";
import React, { useState, memo } from 'react';

const AddCustomerForm = memo(function AddCustomerForm({ onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="p-5 h-full">
       <div className="bg-[#1A1616] border border-[#2A2323] rounded-[32px] p-6 shadow-lg">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2.5 block tracking-widest">{t("auto.t_14", "Ім'я клієнта (обов'язково)")}</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37]/50 text-[#F4EFEA] p-4 rounded-[20px] mb-6 outline-none font-medium transition-colors shadow-inner" 
          />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2.5 block tracking-widest">{t("auto.t_15", "Телефон")}</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37]/50 text-[#F4EFEA] p-4 rounded-[20px] mb-6 outline-none font-medium transition-colors shadow-inner" 
          />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2.5 block tracking-widest">Instagram / Telegram</label>
          <input 
            type="text" 
            value={instagram} 
            onChange={(e) => setInstagram(e.target.value)} 
            className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37]/50 text-[#F4EFEA] p-4 rounded-[20px] mb-6 outline-none font-medium transition-colors shadow-inner" 
          />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2.5 block tracking-widest">{t("auto.t_16", "Нотатки")}</label>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37]/50 text-[#F4EFEA] p-4 rounded-[20px] mb-8 outline-none font-medium transition-colors min-h-[120px] resize-y custom-scrollbar shadow-inner" 
          />

          <button 
            onClick={() => onSave({ name, phone, instagram, notes })} 
            disabled={!name} 
            className="w-full bg-[#9B7B2B] disabled:opacity-50 text-[#151212] py-4 rounded-[20px] font-black uppercase tracking-widest text-sm active:scale-95 transition-transform"
          >
            {t("auto.t_17", "Додати клієнта")}
          </button>
       </div>
    </div>
  );
});

export default AddCustomerForm;