import React, { useState, useEffect } from 'react';
import CustomSelect from './CustomSelect';

export default function CustomPrompt({ config, onClose }) {
  const [values, setValues] = useState({});

  useEffect(() => {
    if (config) {
      setValues(config.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue || '' }), {}));
    }
  }, [config]);

  if (!config) return null;

  const handleSubmit = () => { config.onSave(values); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-5 animate-in fade-in duration-100 backdrop-blur-sm">
      <div className="bg-[#1E1919] border border-[#2A2323] p-6 rounded-[32px] w-full max-w-sm shadow-2xl">
        <h3 className="text-[#F4EFEA] font-bold text-xl mb-6">{config.title}</h3>
        {config.fields.map((f, i) => (
          <div key={f.name} className="mb-4">
            <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">{f.label}</label>
            {f.type === 'select' ? (
              <CustomSelect 
                value={values[f.name] || ''}
                onChange={val => setValues({...values, [f.name]: val})}
                options={[{value: '', label: 'Оберіть...'}, ...f.options.map(o => ({value: o, label: o}))]}
                className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-medium"
              />
            ) : (
              <input
                type={f.type || 'text'}
                inputMode={f.type === 'number' ? 'decimal' : 'text'}
                value={values[f.name] || ''}
                onChange={e => setValues({...values, [f.name]: e.target.value})}
                placeholder={f.placeholder}
                className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-medium transition-colors"
                autoFocus={i === 0}
              />
            )}
          </div>
        ))}
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} className="flex-1 bg-[#D4AF37] text-[#151212] font-bold py-3.5 rounded-xl shadow-lg shadow-[#D4AF37]/20 active:scale-95">Зберегти</button>
          <button onClick={onClose} className="flex-1 bg-[#151212] text-[#F4EFEA] border border-[#2A2323] font-bold py-3.5 rounded-xl active:scale-95">Скасувати</button>
        </div>
      </div>
    </div>
  );
}
