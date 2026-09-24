import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, label = "Виберіть опцію", className, searchable = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedOption = options.find(o => o.value === value && !o.isGroup);
  const displayLabel = selectedOption ? selectedOption.label : (options.find(o => !o.isGroup)?.label || label);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const finalOptions = options.filter((opt, index, arr) => {
    if (!searchable || !search) return true;
    if (!opt.isGroup) return opt.label.toLowerCase().includes(search.toLowerCase());
    
    for (let i = index + 1; i < arr.length; i++) {
      if (arr[i].isGroup) return false;
      if (arr[i].label.toLowerCase().includes(search.toLowerCase())) return true;
    }
    return false;
  });

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-between cursor-pointer select-none ${className}`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="text-[#F4EFEA] font-medium truncate pr-2">{value ? displayLabel : label}</span>
        <ChevronDown size={18} className="text-[#8C7A7A] shrink-0" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="relative bg-[#151212] w-full max-w-md mx-auto rounded-t-[32px] border-t border-[#2A2323] p-6 pb-safe shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="w-12 h-1.5 bg-[#2A2323] rounded-full mx-auto mb-6 shrink-0" />
              <h3 className="text-[#F4EFEA] text-lg font-bold mb-4 text-center shrink-0">{label}</h3>
              
              {searchable && (
                <div className="mb-4 shrink-0 bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3 flex items-center gap-3">
                  <Search size={18} className="text-[#8C7A7A]" />
                  <input 
                    type="text" 
                    placeholder="Пошук..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm"
                  />
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pb-6">
                {finalOptions.length === 0 ? (
                  <p className="text-[#8C7A7A] text-center text-sm py-4">Нічого не знайдено</p>
                ) : (
                  finalOptions.map((opt, i) => {
                    if (opt.isGroup) {
                      return (
                        <div key={`group-${i}`} className="pt-4 pb-1 pl-2">
                          <span className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest">{opt.label}</span>
                        </div>
                      );
                    }
                    return (
                      <div 
                        key={opt.value}
                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer active:scale-95 transition-all ${value === opt.value ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' : 'bg-transparent hover:bg-[#1E1919] active:bg-[#2A2323]'}`}
                      >
                        <span className={`font-bold ${value === opt.value ? 'text-[#D4AF37]' : 'text-[#F4EFEA]'}`}>{opt.label}</span>
                        {value === opt.value && <Check size={18} className="text-[#D4AF37]" />}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
