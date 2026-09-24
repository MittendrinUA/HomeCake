import React, { memo } from 'react';
import { ChevronLeft, Menu, Receipt, X, ClipboardList, Plus } from 'lucide-react';

const AppHeader = memo(function AppHeader({
  headerTitle, hasBack, onBack, onMenuOpen,
  activeTab, invoiceMode, selectedItem, isAddingNew, editingOrder,
  showInvoicePreview, showShoppingListPreview, selectedCategory,
  onInvoiceMode, onCancelInvoice, onShoppingList, onPlusClick,
}) {
  const showActions = !selectedItem && !isAddingNew && !editingOrder && !showInvoicePreview && !showShoppingListPreview
    && activeTab !== 'analytics' && activeTab !== 'help' && activeTab !== 'admin';

  return (
    <div className="flex items-center justify-between px-5 py-4 bg-[#151212]/95 backdrop-blur-xl sticky top-0 z-30 border-b border-[#2A2323]">
      <div className="flex items-center gap-3 overflow-hidden">
        {hasBack ? (
          <button onClick={onBack} className="text-[#D4AF37] p-1 -ml-1"><ChevronLeft size={28} /></button>
        ) : (
          <button onClick={onMenuOpen} className="text-[#8C7A7A] p-1 -ml-1"><Menu size={28} /></button>
        )}
        <h1 className="text-[#F4EFEA] text-xl font-bold truncate tracking-tight">{headerTitle}</h1>
      </div>

      {showActions && (
        <div className="flex gap-2">
          {activeTab === 'sales' && !invoiceMode && (
            <button onClick={onInvoiceMode} className="text-[#8C7A7A] p-2 bg-[#1E1919] rounded-xl border border-[#2A2323]"><Receipt size={20} /></button>
          )}
          {activeTab === 'sales' && invoiceMode && (
            <button onClick={onCancelInvoice} className="text-red-400 p-2 bg-[#1E1919] rounded-xl border border-[#2A2323]"><X size={20} /></button>
          )}
          {activeTab === 'inventory' && (
            <button onClick={onShoppingList} className="text-[#D4AF37] p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl"><ClipboardList size={20} /></button>
          )}
          {!invoiceMode && (!selectedCategory && activeTab === 'recipes' ? null : (
            <button onClick={onPlusClick} className="bg-[#D4AF37] text-[#151212] p-2 rounded-xl shadow-lg shadow-[#D4AF37]/20 active:scale-95"><Plus size={20} strokeWidth={2.5} /></button>
          ))}
        </div>
      )}
    </div>
  );
});

export default AppHeader;
