import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, label = "Виберіть опцію", className }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-between cursor-pointer select-none ${className}`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="text-[#F4EFEA] font-medium">{selectedOption ? selectedOption.label : label}</span>
        <ChevronDown size={18} className="text-[#8C7A7A]" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-[#151212] w-full max-w-md mx-auto rounded-t-[32px] border-t border-[#2A2323] p-6 pb-safe shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="w-12 h-1.5 bg-[#2A2323] rounded-full mx-auto mb-6 shrink-0" />
              <h3 className="text-[#F4EFEA] text-lg font-bold mb-4 text-center shrink-0">{label}</h3>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pb-6">
                {options.map(opt => (
                  <div 
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer active:scale-95 transition-all ${value === opt.value ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' : 'bg-[#1E1919] border border-[#2A2323]'}`}
                  >
                    <span className={`font-bold ${value === opt.value ? 'text-[#D4AF37]' : 'text-[#F4EFEA]'}`}>{opt.label}</span>
                    {value === opt.value && <Check size={20} className="text-[#D4AF37]" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
