import React, { memo, useState } from 'react';
import { ShoppingCart, Book, Package, BarChart2, Users, Utensils, Settings, CheckCircle, X, LogOut, Trash2, ChevronRight } from 'lucide-react';
import { getAuth, GoogleAuthProvider, linkWithCredential, signInWithCredential } from 'firebase/auth';
import Logo from '../ui/Logo';

function DrawerBtn({ icon, label, active, onClick, isLast }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-5 py-4 transition-colors w-full text-left cursor-pointer select-none active:bg-[#2A2323] ${active ? 'bg-[#D4AF37]/5' : 'bg-transparent'} ${!isLast ? 'border-b border-[#2A2323]/50' : ''}`}
      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${active ? 'bg-[#D4AF37] text-[#151212] shadow-lg shadow-[#D4AF37]/20' : 'bg-[#151212] border border-[#2A2323] text-[#8C7A7A]'}`}>
          {icon}
        </div>
        <span className={`font-bold text-base tracking-wide ${active ? 'text-[#D4AF37]' : 'text-[#F4EFEA]'}`}>{label}</span>
      </div>
      <ChevronRight size={18} className="text-[#8C7A7A]/40" />
    </div>
  );
}

function ActionBtn({ icon, label, onClick, isLast, isDestructive, isPrimary }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-5 py-4 transition-colors w-full text-left cursor-pointer select-none active:bg-[#2A2323] ${!isLast ? 'border-b border-[#2A2323]/50' : ''}`}
      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl border border-[#2A2323] ${isPrimary ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' : isDestructive ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-[#151212] text-[#8C7A7A]'}`}>
          {icon}
        </div>
        <span className={`font-bold text-base tracking-wide ${isPrimary ? 'text-[#D4AF37]' : isDestructive ? 'text-red-400' : 'text-[#F4EFEA]'}`}>{label}</span>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';

const DrawerMenu = memo(function DrawerMenu({ activeTab, user, onNavigate, onClose, onShowPaywall, onShowSettings, showToast }) {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 150);
  };

  const handleLinkGoogle = async () => {
    let googleUser = null;
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      await linkWithCredential(getAuth().currentUser, credential);
      handleClose();
      showToast(t('auth.accountLinked', "Акаунт успішно підв'язано!"));
    } catch (e) {
      if (e.code === 'auth/credential-already-in-use') {
        const cred = GoogleAuthProvider.credentialFromError(e) || (googleUser ? GoogleAuthProvider.credential(googleUser.authentication.idToken) : null);
        if (cred) await signInWithCredential(getAuth(), cred);
        handleClose();
        showToast(t('auth.loggedInExisting', "Увійшли в існуючий акаунт"));
      } else {
        alert(t('auth.loginError', "Помилка входу: ") + e.message);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex">
      {/* Background overlay */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm duration-150 ease-out ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`} 
        onClick={handleClose}
      ></div>
      
      <div 
        className={`w-full bg-[#000000] h-full relative flex flex-col pt-safe duration-150 ease-out shadow-2xl border-r border-[#2A2323] ${
          isClosing ? 'animate-out slide-out-to-left fade-out' : 'animate-in slide-in-from-left fade-in'
        }`}
      >
        
        {/* Header with Close Button */}
        <div className="px-6 py-6 flex items-center justify-between">
          <Logo size={32} />
          <button 
            onClick={handleClose} 
            className="p-3.5 bg-[#1E1919] border border-[#2A2323] rounded-full text-[#F4EFEA] active:scale-95 transition-transform shadow-lg"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-12">
          
          <p className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2.5 pl-3">{t('menu.mainSection', 'Головне')}</p>
          <div className="bg-[#1E1919] rounded-[28px] border border-[#2A2323] mb-6 overflow-hidden shadow-xl shadow-black/20">
            <DrawerBtn icon={<ShoppingCart size={20}/>} label={t('menu.sales', 'Замовлення')} active={activeTab==='sales'} onClick={() => { onNavigate('sales'); handleClose(); }}/>
            <DrawerBtn icon={<Book size={20}/>} label={t('menu.recipes', 'Каталог десертів')} active={activeTab==='recipes'} onClick={() => { onNavigate('recipes'); handleClose(); }}/>
            <DrawerBtn icon={<Utensils size={20}/>} label={t('menu.preps', 'Заготівлі')} active={activeTab==='preps'} onClick={() => { onNavigate('preps'); handleClose(); }} isLast/>
          </div>

          <p className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2.5 pl-3">{t('menu.managementSection', 'Управління')}</p>
          <div className="bg-[#1E1919] rounded-[28px] border border-[#2A2323] mb-6 overflow-hidden shadow-xl shadow-black/20">
            <DrawerBtn icon={<Package size={20}/>} label={t('menu.inventory', 'Склад інгредієнтів')} active={activeTab==='inventory'} onClick={() => { onNavigate('inventory'); handleClose(); }}/>
            <DrawerBtn icon={<Users size={20}/>} label={t('menu.customers', 'Клієнти (CRM)')} active={activeTab==='customers'} onClick={() => { onNavigate('customers'); handleClose(); }}/>
            <DrawerBtn icon={<BarChart2 size={20}/>} label={t('menu.analytics', 'Аналітика')} active={activeTab==='analytics'} onClick={() => { onNavigate('analytics'); handleClose(); }} isLast/>
          </div>

          <p className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2.5 pl-3">{t('menu.dataSection', 'Дані')}</p>
          <div className="bg-[#1E1919] rounded-[28px] border border-[#2A2323] mb-8 overflow-hidden shadow-xl shadow-black/20">
            <DrawerBtn icon={<Trash2 size={20}/>} label={t('menu.trash', 'Кошик')} active={activeTab==='trash'} onClick={() => { onNavigate('trash'); handleClose(); }} isLast/>
          </div>

          <p className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2.5 pl-3">{t('settings.title', 'Налаштування')}</p>
          <div className="bg-[#1E1919] rounded-[28px] border border-[#2A2323] mb-10 overflow-hidden shadow-xl shadow-black/20">
            <ActionBtn icon={<Settings size={20}/>} label={t('settings.title', 'Налаштування')} onClick={() => { onShowSettings(); handleClose(); }} isLast={user?.isAnonymous}/>
            
            {user?.isAnonymous ? (
              <ActionBtn icon={<CheckCircle size={20}/>} label={t('auth.loginWithGoogle', 'Увійти в акаунт')} onClick={handleLinkGoogle} isPrimary isLast/>
            ) : (
              <>
                <ActionBtn icon={<LogOut size={20}/>} label={t('auth.logout', 'Вийти з акаунту')} onClick={async () => { await getAuth().signOut(); handleClose(); window.location.reload(); }}/>

              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
});

export default DrawerMenu;
