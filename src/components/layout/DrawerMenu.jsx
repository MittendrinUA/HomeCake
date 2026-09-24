import React, { memo, useState } from 'react';
import { ShoppingCart, Book, Package, BarChart2, Users, Utensils, Star, Globe, CheckCircle, X, LogOut, Shield, Trash2 } from 'lucide-react';
import { getAuth, GoogleAuthProvider, linkWithCredential, signInWithCredential } from 'firebase/auth';

function DrawerBtn({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-6 px-8 py-5 transition-colors w-full text-left cursor-pointer select-none active:scale-[0.98] ${active ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-[#F4EFEA] hover:bg-[#2A2323]'}`}
      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      <div className={`${active ? 'text-[#D4AF37]' : 'text-[#8C7A7A]'}`}>
        {icon}
      </div>
      <span className="font-bold text-lg tracking-wide">{label}</span>
    </div>
  );
}

const DrawerMenu = memo(function DrawerMenu({ activeTab, user, onNavigate, onClose, onShowPaywall, onShowLanguage, showToast }) {
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
      showToast("Акаунт успішно підв'язано!");
    } catch (e) {
      if (e.code === 'auth/credential-already-in-use') {
        const cred = GoogleAuthProvider.credentialFromError(e) || (googleUser ? GoogleAuthProvider.credential(googleUser.authentication.idToken) : null);
        if (cred) await signInWithCredential(getAuth(), cred);
        handleClose();
        showToast("Увійшли в існуючий акаунт");
      } else {
        alert("Помилка входу: " + e.message);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex">
      {/* Background overlay (invisible since menu is full screen, but good for structure) */}
      <div 
        className={`absolute inset-0 bg-black/50 duration-150 ease-out ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`} 
        onClick={handleClose}
      ></div>
      
      <div 
        className={`w-full bg-[#151212] h-full relative flex flex-col pt-safe duration-150 ease-out ${
          isClosing ? 'animate-out slide-out-to-left fade-out' : 'animate-in slide-in-from-left fade-in'
        }`}
      >
        
        {/* Header with Close Button */}
        <div className="p-8 flex items-center justify-between border-b border-[#2A2323]">
          <div>
            <h2 className="text-3xl font-black text-[#F4EFEA] tracking-widest uppercase leading-none">Whisked</h2>
            <p className="text-[#D4AF37] text-xs mt-2 font-bold tracking-widest uppercase">Premium Bakery</p>
          </div>
          <button 
            onClick={handleClose} 
            className="p-3 bg-[#1E1919] border border-[#2A2323] rounded-full text-[#F4EFEA] active:scale-95 transition-transform"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col py-6 flex-1 overflow-y-auto hide-scrollbar">
          <DrawerBtn icon={<ShoppingCart size={24}/>} label="Замовлення"           active={activeTab==='sales'}     onClick={() => { onNavigate('sales'); handleClose(); }}/>
          <DrawerBtn icon={<Book size={24}/>}         label="Каталог десертів"     active={activeTab==='recipes'}   onClick={() => { onNavigate('recipes'); handleClose(); }}/>
          <DrawerBtn icon={<Utensils size={24}/>}     label="Заготівлі"            active={activeTab==='preps'}     onClick={() => { onNavigate('preps'); handleClose(); }}/>
          <DrawerBtn icon={<Package size={24}/>}      label="Склад інгредієнтів"   active={activeTab==='inventory'} onClick={() => { onNavigate('inventory'); handleClose(); }}/>
          <DrawerBtn icon={<Users size={24}/>}        label="База клієнтів (CRM)"  active={activeTab==='customers'} onClick={() => { onNavigate('customers'); handleClose(); }}/>
          <DrawerBtn icon={<BarChart2 size={24}/>}    label="Аналітика та CRM"     active={activeTab==='analytics'} onClick={() => { onNavigate('analytics'); handleClose(); }}/>
          
          <div className="mx-8 my-4 h-px bg-[#2A2323]"></div>
          
          <DrawerBtn 
             icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>} 
             label="Кошик" active={activeTab==='trash'} 
             onClick={() => { onNavigate('trash'); handleClose(); }}
          />
        </div>

        {/* Footer Actions */}
        <div className="px-8 pt-6 pb-8 border-t border-[#2A2323] bg-[#1E1919]/50 flex flex-col gap-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
          <button onClick={() => { window.open('https://whisked.app/privacy', '_blank'); handleClose(); }} className="w-full flex items-center gap-6 text-[#8C7A7A] hover:opacity-80 transition-opacity active:scale-[0.98]">
            <Shield size={22} />
            <span className="text-base font-medium">Privacy Policy</span>
          </button>
          
          <button onClick={() => { onShowLanguage(); handleClose(); }} className="w-full flex items-center gap-6 text-[#8C7A7A] hover:opacity-80 transition-opacity active:scale-[0.98]">
            <Globe size={22} />
            <span className="text-base font-medium">Мова / Language</span>
          </button>
          
          {user?.isAnonymous ? (
            <button onClick={handleLinkGoogle} className="w-full flex items-center gap-6 text-[#D4AF37] hover:opacity-80 transition-opacity active:scale-[0.98]">
              <CheckCircle size={22} />
              <span className="text-base font-medium">Увійти в акаунт</span>
            </button>
          ) : (
            <>
              <button onClick={async () => { await getAuth().signOut(); handleClose(); window.location.reload(); }} className="w-full flex items-center gap-6 text-[#F4EFEA] hover:opacity-80 transition-opacity active:scale-[0.98]">
                <LogOut size={22} />
                <span className="text-base font-medium">Вийти з акаунту</span>
              </button>
              
              <button onClick={() => { if(window.confirm("Увага! Видалення акаунту назавжди зітре всі ваші рецепти, клієнтів та налаштування. Продовжити?")) { window.dispatchEvent(new CustomEvent('delete-account')); } handleClose(); }} className="w-full flex items-center gap-6 text-red-400 hover:opacity-80 transition-opacity active:scale-[0.98]">
                <Trash2 size={22} />
                <span className="text-base font-medium">Видалити акаунт</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default DrawerMenu;
