import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-8 mt-6 flex flex-col items-center justify-center text-center"
    >
      <div className="w-24 h-24 mb-6 rounded-full bg-[#1E1919] border border-[#2A2323] flex items-center justify-center shadow-inner relative">
        <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full animate-ping opacity-50" style={{ animationDuration: '3s' }}></div>
        <Icon size={40} className="text-[#D4AF37] relative z-10" />
      </div>
      
      <h3 className="text-[#F4EFEA] text-xl font-bold mb-2 tracking-tight">{title}</h3>
      
      <p className="text-[#8C7A7A] text-sm leading-relaxed max-w-xs mb-8">
        {description}
      </p>

      {actionLabel && onAction && (
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="bg-[#D4AF37] text-[#110E0E] px-8 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all flex items-center gap-2"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
