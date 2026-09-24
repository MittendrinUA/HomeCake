import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Globe, Bell, DollarSign, ChevronRight, Shield, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import useStore from '../store/useStore';
import { auth } from '../firebase';
import { deleteUser } from 'firebase/auth';
import { toast } from 'sonner';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export default function SettingsModal({ onClose }) {
  const { t, i18n } = useTranslation();
  const { settings, setSettings, user, setUser, resetAllData } = useStore();
  
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'notifications'
  
  // Local state for edits
  const [lang, setLang] = useState(i18n.language || 'uk');
  const [currency, setCurrency] = useState(settings?.currency || 'грн');
  
  const [orderReminder, setOrderReminder] = useState(settings?.notifications?.orderDeadlineDays || 1);
  const [expiryReminder, setExpiryReminder] = useState(settings?.notifications?.expiryAlertDays || 3);
  const [showInventoryImages, setShowInventoryImages] = useState(settings?.showInventoryImages ?? true);

  const handleSave = async () => {
    i18n.changeLanguage(lang);
    localStorage.setItem('user_language', lang);
    
    setSettings({
      ...settings,
      language: lang,
      currency: currency,
      showInventoryImages: showInventoryImages,
      notifications: {
        orderDeadlineDays: orderReminder,
        expiryAlertDays: expiryReminder
      }
    });

    if (Capacitor.isNativePlatform()) {
       try {
         await LocalNotifications.requestPermissions();
       } catch(e) {
         console.warn("Notifications permission denied or not supported", e);
       }
    }

    onClose();
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm(t('settings.deleteAccountConfirm', "Ви впевнені, що хочете видалити акаунт і всі пов'язані дані? Ця дія незворотня."))) {
      try {
        await deleteUser(auth.currentUser);
        resetAllData();
        setUser(null);
        toast.success(t('settings.accountDeleted', "Акаунт успішно видалено"));
        onClose();
      } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
          toast.error(t('settings.requiresRecentLogin', "Потрібна повторна авторизація. Будь ласка, вийдіть і увійдіть знову перед видаленням акаунту."));
        } else {
          toast.error(t('settings.deleteError', "Помилка видалення акаунту: ") + error.message);
        }
      }
    }
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'uk', label: 'Ukrainian', native: 'Українська' },
    { code: 'ru', label: 'Russian', native: 'Русский' }
  ];

  const currencies = [
    { symbol: 'грн', label: 'UAH (Гривня)' },
    { symbol: '$', label: 'USD (Долар)' },
    { symbol: '€', label: 'EUR (Євро)' },
    { symbol: 'zł', label: 'PLN (Злотий)' }
  ];

  return (
    <div className="fixed inset-0 bg-[#000000] flex justify-center sm:items-center sm:py-8 z-[100] overflow-hidden font-sans">
      <div className="w-full max-w-[420px] bg-[#151212] h-full sm:h-[850px] sm:rounded-[48px] sm:border-[8px] border-[#2A2323] flex flex-col relative shadow-2xl overflow-hidden pt-safe">
        
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-[#2A2323]">
          <h2 className="text-xl font-bold text-[#F4EFEA]">{t('settings.title', 'Налаштування')}</h2>
          <button onClick={onClose} className="p-2.5 bg-[#1E1919] rounded-full text-[#8C7A7A] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-6 gap-4 border-b border-[#2A2323]">
          <button 
            onClick={() => setActiveTab('general')}
            className={`pb-4 px-2 font-bold transition-colors ${activeTab === 'general' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8C7A7A]'}`}
          >
            {t('settings.tabGeneral', 'Загальні')}
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`pb-4 px-2 font-bold transition-colors ${activeTab === 'notifications' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8C7A7A]'}`}
          >
            {t('settings.tabNotifications', 'Сповіщення')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-8">
          
          {activeTab === 'general' && (
            <>
              {/* Language */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-[#8C7A7A]">
                  <Globe size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{t('settings.language', 'Мова')}</h3>
                </div>
                <div className="space-y-2">
                  {languages.map(l => (
                    <button 
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        lang === l.code ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#1E1919] border-[#2A2323] text-[#F4EFEA]'
                      }`}
                    >
                      <span className="font-bold">{l.native}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-[#8C7A7A]">
                  <DollarSign size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{t('settings.currency', 'Валюта')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {currencies.map(c => (
                    <button 
                      key={c.symbol}
                      onClick={() => setCurrency(c.symbol)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        currency === c.symbol ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#1E1919] border-[#2A2323]'
                      }`}
                    >
                      <span className={`text-2xl font-black mb-1 ${currency === c.symbol ? 'text-[#D4AF37]' : 'text-[#F4EFEA]'}`}>{c.symbol}</span>
                      <span className="text-[10px] text-[#8C7A7A] uppercase">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-4 text-[#8C7A7A]">
                  <ImageIcon size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{t('settings.appearance', 'Зовнішній вигляд')}</h3>
                </div>
                <div className="bg-[#1E1919] border border-[#2A2323] p-5 rounded-2xl flex items-center justify-between">
                  <span className="text-[#F4EFEA] font-bold text-sm">{t('settings.inventoryImages', 'Фотографії на складі')}</span>
                  <button 
                    onClick={() => setShowInventoryImages(!showInventoryImages)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${showInventoryImages ? 'bg-[#D4AF37]' : 'bg-[#2A2323]'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showInventoryImages ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              {/* Notifications */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-[#8C7A7A]">
                  <Bell size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{t('settings.orders', 'Замовлення')}</h3>
                </div>
                <div className="bg-[#1E1919] border border-[#2A2323] p-5 rounded-2xl">
                  <p className="text-[#F4EFEA] text-sm mb-4">{t('settings.orderReminder', 'Нагадувати про дедлайн замовлення за:')}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(days => (
                      <button 
                        key={days}
                        onClick={() => setOrderReminder(days)}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                          orderReminder === days ? 'bg-[#D4AF37] text-[#151212]' : 'bg-[#151212] text-[#8C7A7A] border border-[#2A2323]'
                        }`}
                      >
                        {days} {days === 1 ? 'день' : 'дні'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4 text-[#8C7A7A]">
                  <Bell size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{t('settings.inventory', 'Склад')}</h3>
                </div>
                <div className="bg-[#1E1919] border border-[#2A2323] p-5 rounded-2xl">
                  <p className="text-[#F4EFEA] text-sm mb-4">{t('settings.expiryReminder', 'Нагадувати про закінчення терміну придатності інгредієнтів за:')}</p>
                  <div className="flex gap-2">
                    {[1, 3, 7].map(days => (
                      <button 
                        key={days}
                        onClick={() => setExpiryReminder(days)}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                          expiryReminder === days ? 'bg-[#D4AF37] text-[#151212]' : 'bg-[#151212] text-[#8C7A7A] border border-[#2A2323]'
                        }`}
                      >
                        {days} {days === 1 ? 'день' : 'дні'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[#8C7A7A] text-xs mt-4 leading-relaxed">
                    {t('settings.expiryNote', '*Додайте термін придатності при створенні або поповненні запасу інгредієнта на складі.')}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Privacy & Security (Show on General Tab) */}
          {activeTab === 'general' && (
            <div className="mt-8 pt-6 border-t border-[#2A2323]">
              <div className="flex items-center gap-2 mb-4 text-[#8C7A7A]">
                <Shield size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('settings.privacySecurity', 'Безпека та конфіденційність')}</h3>
              </div>
              
              <div className="bg-[#1E1919] border border-[#2A2323] p-5 rounded-2xl flex flex-col gap-4">
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-[#151212] rounded-xl border border-[#2A2323] hover:border-[#8C7A7A] transition-colors">
                  <span className="text-[#F4EFEA] font-bold">{t('settings.privacyPolicy', 'Політика конфіденційності')}</span>
                  <Globe size={18} className="text-[#8C7A7A]" />
                </a>
                
                {user && (
                  <button onClick={handleDeleteAccount} className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/30 hover:bg-red-500/20 transition-colors">
                    <span className="text-red-500 font-bold text-left">{t('settings.deleteAccount', 'Видалити мій акаунт та всі дані')}</span>
                    <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2A2323] bg-[#151212]">
          <button 
            onClick={handleSave}
            className="w-full bg-[#D4AF37] text-[#151212] font-bold py-4 rounded-2xl active:scale-95 transition-transform"
          >
            {t('settings.saveSettings', 'Зберегти налаштування')}
          </button>
        </div>

      </div>
    </div>
  );
}
