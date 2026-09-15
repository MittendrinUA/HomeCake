import React, { useState, useEffect } from 'react';
import { Lock, Delete, AlertCircle } from 'lucide-react';

export default function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  // ВАШ СЕКРЕТНИЙ ПІН-КОД
  const CORRECT_PIN = '2026';

  // Стани для захисту від перебору (зчитуємо з пам'яті браузера)
  const [attempts, setAttempts] = useState(Number(localStorage.getItem('admin_attempts')) || 0);
  const [lockout, setLockout] = useState(Number(localStorage.getItem('admin_lockout')) || 0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Ефект для таймера блокування
  useEffect(() => {
    let interval;
    if (lockout > Date.now()) {
      interval = setInterval(() => {
        const left = Math.ceil((lockout - Date.now()) / 1000);
        if (left <= 0) {
          setLockout(0);
          setTimeLeft(0);
          localStorage.removeItem('admin_lockout');
        } else {
          setTimeLeft(left);
        }
      }, 1000);
    } else {
      setLockout(0);
      setTimeLeft(0);
    }
    return () => clearInterval(interval);
  }, [lockout]);

  const handlePress = (num) => {
    // Якщо заблоковано - ігноруємо натискання
    if (lockout > Date.now()) return;

    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          // УСПІХ: скидаємо спроби
          setAttempts(0);
          localStorage.removeItem('admin_attempts');
          onUnlock();
        } else {
          // ПОМИЛКА: рахуємо спроби
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          localStorage.setItem('admin_attempts', newAttempts);
          setError(true);
          setTimeout(() => setPin(''), 500);

          // ЛОГІКА БЛОКУВАННЯ (iPhone style)
          if (newAttempts >= 5) {
            let penaltyMinutes = 0;
            if (newAttempts === 5) penaltyMinutes = 1;       // 6-та спроба: 1 хв
            else if (newAttempts === 6) penaltyMinutes = 5;  // 7-ма спроба: 5 хв
            else if (newAttempts === 7) penaltyMinutes = 15; // 8-ма спроба: 15 хв
            else penaltyMinutes = 60;                        // Далі: 1 година

            const unlockTime = Date.now() + penaltyMinutes * 60 * 1000;
            setLockout(unlockTime);
            localStorage.setItem('admin_lockout', unlockTime);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (lockout > Date.now()) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  // Форматування часу (хв:сек)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isLocked = timeLeft > 0;

  return (
    <div className="fixed inset-0 bg-[#000000] flex justify-center sm:items-center sm:py-8 z-[100] overflow-hidden font-sans selection:bg-transparent">
      <style>{`
        * { -webkit-tap-highlight-color: transparent !important; }
      `}</style>

      <div className="w-full max-w-[420px] bg-[#151212] h-full sm:h-[850px] sm:rounded-[48px] sm:border-[8px] border-[#2A2323] flex flex-col items-center justify-center relative shadow-2xl overflow-hidden p-6">
        
        <div className="mb-8 flex flex-col items-center h-32 justify-end">
          <div className={`p-4 rounded-full border shadow-lg mb-4 transition-colors ${isLocked ? 'bg-red-500/10 border-red-500/30' : 'bg-[#1E1919] border-[#2A2323]'}`}>
            {isLocked ? <AlertCircle className="text-red-500" size={32} /> : <Lock className="text-[#D4AF37]" size={32} />}
          </div>
          
          {isLocked ? (
            <>
              <h1 className="text-red-500 text-xl font-bold tracking-wide mb-1">Заблоковано</h1>
              <p className="text-[#8C7A7A] text-xs uppercase font-bold text-center">
                Спробуйте знову через {formatTime(timeLeft)}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[#F4EFEA] text-xl font-bold tracking-wide mb-1">Вхід в систему</h1>
              <p className="text-[#8C7A7A] text-xs uppercase font-bold text-center">
                {attempts > 0 ? `Невдалих спроб: ${attempts}` : 'Введіть ПІН-код для доступу'}
              </p>
            </>
          )}
        </div>

        <div className={`flex gap-4 mb-12 transition-transform duration-300 ${error ? 'translate-x-[-10px] sm:translate-x-[10px]' : ''} ${isLocked ? 'opacity-30' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > index 
                  ? error ? 'bg-red-500 border-red-500' : 'bg-[#D4AF37] border-[#D4AF37] scale-110' 
                  : 'border-[#2A2323] bg-transparent'
              }`}
            />
          ))}
        </div>

        <div className={`grid grid-cols-3 gap-6 max-w-[280px] w-full transition-opacity duration-300 ${isLocked ? 'opacity-30 pointer-events-none' : ''}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              type="button"
              key={num} 
              onClick={() => handlePress(num.toString())}
              className="w-16 h-16 rounded-full bg-[#1E1919] border border-[#2A2323] flex items-center justify-center text-[#F4EFEA] text-2xl font-light active:bg-[#D4AF37]/20 active:border-[#D4AF37]/50 outline-none"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16"></div>
          <button 
            type="button"
            onClick={() => handlePress('0')}
            className="w-16 h-16 rounded-full bg-[#1E1919] border border-[#2A2323] flex items-center justify-center text-[#F4EFEA] text-2xl font-light active:bg-[#D4AF37]/20 active:border-[#D4AF37]/50 outline-none"
          >
            0
          </button>
          <button 
            type="button"
            onClick={handleDelete}
            className="w-16 h-16 rounded-full flex items-center justify-center text-[#8C7A7A] active:text-[#F4EFEA] outline-none"
          >
            <Delete size={28} />
          </button>
        </div>

      </div>
    </div>
  );
}