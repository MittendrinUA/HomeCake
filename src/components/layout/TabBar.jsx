import React, { memo } from 'react';
import { ShoppingCart, Book, Package, Shield } from 'lucide-react';

function TabButton({ icon, label, active, onClick }) { 
  return (
    <div 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center w-[80px] py-1 transition-colors cursor-pointer select-none active:opacity-70 ${active ? 'text-[#D4AF37]' : 'text-[#8C7A7A]'}`}
      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      <div className={`mb-1.5 ${active ? 'scale-110 drop-shadow-md' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </div>
  ); 
}

const TabBar = memo(function TabBar({ activeTab, user, changeMainTab }) {
  return (
    <div className="bg-[#151212]/95 backdrop-blur-xl border-t border-[#2A2323] flex justify-around px-2 pt-2 absolute bottom-0 w-full z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}>
      <TabButton icon={<ShoppingCart size={24} />} label="Продажі" active={activeTab === 'sales'} onClick={() => changeMainTab('sales')} />
      <TabButton icon={<Book size={24} />} label="Рецепти" active={activeTab === 'recipes'} onClick={() => changeMainTab('recipes')} />
      <TabButton icon={<Package size={24} />} label="Склад" active={activeTab === 'inventory'} onClick={() => changeMainTab('inventory')} />
      {user?.profile?.role === 'admin' && (
        <TabButton icon={<Shield size={24} />} label="Адмін" active={activeTab === 'admin'} onClick={() => changeMainTab('admin')} />
      )}
    </div>
  );
});

export default TabBar;
