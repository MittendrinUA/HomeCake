import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export default function LanguageSelection({ onComplete }) {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [isSaving, setIsSaving] = useState(false);

  const handleLanguageSelect = (code) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
  };

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem('user_language', selectedLang);
    await onComplete(selectedLang);
    setIsSaving(false);
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'uk', label: 'Ukrainian', native: 'Українська' },
    { code: 'ru', label: 'Russian', native: 'Русский' }
  ];

  return (
    <div className="fixed inset-0 bg-[#000000] flex justify-center sm:items-center sm:py-8 z-[100] overflow-hidden font-sans selection:bg-transparent">
      <div className="w-full max-w-[420px] bg-[#151212] h-full sm:h-[850px] sm:rounded-[48px] sm:border-[8px] border-[#2A2323] flex flex-col items-center justify-center relative shadow-2xl overflow-hidden p-6">
        
        <div className="mb-12 flex flex-col items-center w-full">
          <div className="p-5 rounded-full bg-[#1E1919] border border-[#2A2323] shadow-lg mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F4EFEA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          
          <h1 className="text-[#F4EFEA] text-2xl font-bold tracking-wide mb-2 text-center">
            {t('auth.selectLanguage')}
          </h1>
        </div>

        <div className="w-full space-y-4 mb-12 px-4">
          {languages.map(lang => (
            <button 
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                selectedLang === lang.code 
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37]' 
                  : 'bg-[#1E1919] border-[#2A2323] hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className={`font-bold ${selectedLang === lang.code ? 'text-[#D4AF37]' : 'text-[#F4EFEA]'}`}>
                  {lang.native}
                </span>
                <span className="text-xs text-[#8C7A7A]">{lang.label}</span>
              </div>
              
              {selectedLang === lang.code && (
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center">
                  <Check size={14} className="text-[#151212]" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full max-w-[280px] flex items-center justify-center gap-3 bg-[#F4EFEA] text-[#151212] font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {isSaving ? t('common.loading') : t('auth.saveLanguage')}
        </button>
        
      </div>
    </div>
  );
}
