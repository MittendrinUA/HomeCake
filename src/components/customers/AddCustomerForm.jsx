import React, { useState, memo } from 'react';

const AddCustomerForm = memo(function AddCustomerForm({ onSave }) {
  const [name, setName] = useState(''); 
  const [phone, setPhone] = useState(''); 
  const [instagram, setInstagram] = useState(''); 
  const [notes, setNotes] = useState(''); 

  return (
    <div className="p-4 h-full">
       <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Ім'я клієнта (обов'язково)</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-medium transition-colors" />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Телефон</label>
          <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-medium transition-colors" />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Instagram / Telegram</label>
          <input type="text" value={instagram} onChange={e=>setInstagram(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-medium transition-colors" />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Нотатки</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-8 outline-none font-medium transition-colors min-h-[100px] resize-y custom-scrollbar" />

          <button onClick={() => onSave({ name, phone, instagram, notes })} disabled={!name} className="w-full bg-[#D4AF37] disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-[#D4AF37]/20 active:scale-95">Додати клієнта</button>
       </div>
    </div>
  );
});

export default AddCustomerForm;
