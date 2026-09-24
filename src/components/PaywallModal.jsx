import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './ui/Logo';

export default function PaywallModal({ isOpen, onClose, feature }) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-[#1E1919] border border-[#2A2323] rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="absolute top-4 right-4 z-10">
              <button onClick={onClose} className="p-2 bg-[#151212] rounded-full text-[#8C7A7A] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 pb-10 flex flex-col items-center text-center">
              <div className="flex flex-col items-center mb-3">
                <Logo size={36} />
                <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-[0.2em] mt-2">Pro</span>
              </div>
              <p className="text-[#8C7A7A] text-sm mb-8 leading-relaxed">
                {feature === 'recipes' 
                  ? 'Ви досягли ліміту безкоштовної версії (3 рецепти). ' 
                  : 'Ви досягли ліміту безкоштовної версії (15 інгредієнтів). '}
                Отримайте підписку, щоб створювати безліч рецептів, вести облік складу та аналізувати продажі без обмежень.
              </p>

              <div className="w-full space-y-4 text-left mb-8 bg-[#151212] p-6 rounded-3xl border border-[#2A2323]">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                   <p className="text-[#F4EFEA] text-sm font-medium">Безлімітні рецепти</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                   <p className="text-[#F4EFEA] text-sm font-medium">Безлімітний склад</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                   <p className="text-[#F4EFEA] text-sm font-medium">Розширена аналітика (незабаром)</p>
                 </div>
              </div>

              <a 
                href="https://t.me/whisked_support" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#F4EFEA] text-[#151212] font-bold rounded-2xl shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-sm flex items-center justify-center"
              >
                Отримати підписку
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
