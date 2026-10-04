import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, PackagePlus, NotebookPen, ShoppingBag } from 'lucide-react';
import useStore from '../store/useStore';

const slides = [
  {
    id: 1,
    icon: PackagePlus,
    title: '1. Наповніть склад',
    description: 'Перейдіть у розділ "Склад" та додайте всі інгредієнти, які ви використовуєте. Вкажіть їх ціну та одиниці виміру (наприклад, 1 кг цукру - 30 грн). Це база для всіх майбутніх розрахунків.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    id: 2,
    icon: NotebookPen,
    title: '2. Створіть технологічні картки',
    description: 'У розділі "Каталог" створіть ваші рецепти. Додавайте інгредієнти зі складу, і додаток автоматично порахує собівартість десерту до копійки.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    id: 3,
    icon: ShoppingBag,
    title: '3. Приймайте замовлення',
    description: 'Створюйте замовлення в головному розділі. Як тільки замовлення перейде в статус "Видано", додаток автоматично спише використані продукти з вашого складу.',
    color: 'text-[#D4AF37]',
    bg: 'bg-[#D4AF37]/10',
  }
];

export default function OnboardingGuide() {
  const showGuide = useStore(state => state.showGuide);
  const setShowGuide = useStore(state => state.setShowGuide);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide');
    if (!hasSeenGuide) {
      setTimeout(() => setShowGuide(true), 1500); // Show after 1.5s
      localStorage.setItem('hasSeenGuide', 'true');
    }
  }, [setShowGuide]);

  if (!showGuide) return null;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      setShowGuide(false);
      setCurrentSlide(0);
    }
  };

  const SlideIcon = slides[currentSlide].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => setShowGuide(false)}
      />

      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-[#151212] w-11/12 max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-[#2A2323] p-6 flex flex-col"
      >
        <button 
          onClick={() => setShowGuide(false)}
          className="absolute top-4 right-4 p-2 bg-[#1E1919] rounded-full text-[#8C7A7A] active:scale-95 transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex-1 flex flex-col items-center text-center mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className={`w-28 h-28 rounded-full ${slides[currentSlide].bg} flex items-center justify-center mb-8 relative`}>
                <div className={`absolute inset-0 rounded-full border-2 border-current opacity-20 animate-ping ${slides[currentSlide].color}`} style={{ animationDuration: '3s' }}></div>
                <SlideIcon size={48} className={slides[currentSlide].color} strokeWidth={1.5} />
              </div>
              
              <h2 className="text-[#F4EFEA] text-2xl font-bold mb-4 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              
              <p className="text-[#8C7A7A] text-base leading-relaxed px-2">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="mt-10 flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-[#2A2323]'}`}
              />
            ))}
          </div>
          
          <button 
            onClick={handleNext}
            className="bg-[#D4AF37] text-[#110E0E] px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            {currentSlide === slides.length - 1 ? 'Зрозуміло' : 'Далі'}
            {currentSlide !== slides.length - 1 && <ChevronRight size={16} />}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
