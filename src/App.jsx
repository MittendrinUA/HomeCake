import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteDoc, doc, addDoc, collection } from 'firebase/firestore';

import { db } from './firebase';
import useStore from './store/useStore';
import { calculateCost, compressImage } from './utils/calculations';
import { useFirebaseData } from './hooks/useFirebaseData';
import PinScreen from './components/PinScreen';

// --- NEW COMPONENT IMPORTS ---
import AppHeader from './components/layout/AppHeader';
import DrawerMenu from './components/layout/DrawerMenu';
import TabBar from './components/layout/TabBar';
import CustomPrompt from './components/ui/CustomPrompt';
import List from './components/shared/List';
import InventoryList from './components/inventory/InventoryList';
import InventoryDetail from './components/inventory/InventoryDetail';
import AddInventoryForm from './components/inventory/AddInventoryForm';
import RecipeCategories from './components/recipes/RecipeCategories';
import CategoryForm from './components/recipes/CategoryForm';
import CustomersList from './components/customers/CustomersList';
import AddCustomerForm from './components/customers/AddCustomerForm';
import OrdersList from './components/orders/OrdersList';
import AddOrderForm from './components/orders/AddOrderForm';
import InvoicePreview from './components/invoice/InvoicePreview';
import ShoppingListPreview from './components/invoice/ShoppingListPreview';
import LanguageSelection from './components/LanguageSelection';

// --- LAZY COMPONENTS ---
const Analytics = lazy(() => import('./components/Analytics'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const PaywallModal = lazy(() => import('./components/PaywallModal'));
const InventoryHistory = lazy(() => import('./components/InventoryHistory'));
const RecipeDetail = lazy(() => import('./components/RecipeDetail'));
const AddRecipeForm = lazy(() => import('./components/AddRecipeForm'));
const CustomerDetail = lazy(() => import('./components/CustomerDetail'));
const Trash = lazy(() => import('./components/Trash'));

export default function App() {
  useFirebaseData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // GLOBAL STATE (from Zustand + Firebase hook)
  const {
    user, inventory, recipes, sales, customers, preps, categories, inventoryLogs, waste,
    isLoading, loadingStep, setIsLoading, setLoadingStep, isAuthenticated
  } = useStore();

  // LOCAL UI STATE
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // INVOICE / LISTS
  const [invoiceMode, setInvoiceMode] = useState(false);
  const [selectedForInvoice, setSelectedForInvoice] = useState([]);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showShoppingListPreview, setShowShoppingListPreview] = useState(false);
  const [inventoryMode, setInventoryMode] = useState('list');
  const [editingOrder, setEditingOrder] = useState(null);

  // MODALS
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);
  const [toast, setToast] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('');

  // UTILS
  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); }, []);
  const askConfirm = useCallback((title, message, onConfirm, onCancel = null) => { setConfirmDialog({ title, message, onConfirm, onCancel }); }, []);
  const askPrompt = useCallback((title, fields, onSave) => { setPromptDialog({ title, fields, onSave }); }, []);

  const changeMainTab = useCallback((tab) => {
    setActiveTab(tab);
    setSelectedItem(null);
    setIsAddingNew(false);
    setSelectedCategory(null);
    setInvoiceMode(false);
    setSelectedForInvoice([]);
    setShowInvoicePreview(false);
    setShowShoppingListPreview(false);
    setEditingOrder(null);
    setIsMenuOpen(false);
  }, []);

  const handleBack = useCallback(() => {
    if (showInvoicePreview) { setShowInvoicePreview(false); return; }
    if (showShoppingListPreview) { setShowShoppingListPreview(false); return; }
    if (editingOrder) { setEditingOrder(null); return; }
    if (isAddingNew) { setIsAddingNew(false); return; }
    if (selectedItem) { setSelectedItem(null); return; }
    if (selectedCategory && activeTab === 'recipes') { setSelectedCategory(null); return; }
    if (invoiceMode) { setInvoiceMode(false); setSelectedForInvoice([]); return; }
  }, [showInvoicePreview, showShoppingListPreview, editingOrder, isAddingNew, selectedItem, selectedCategory, activeTab, invoiceMode]);

  // FILTERED ACTIVE DATA
  const activeRecipes = useMemo(() => recipes.filter(r => !r.isDeleted), [recipes]);
  const activeCategories = useMemo(() => categories.filter(c => !c.isDeleted), [categories]);
  const activePreps = useMemo(() => preps.filter(p => !p.isDeleted), [preps]);
  const activeInventory = useMemo(() => inventory.filter(i => !i.isDeleted), [inventory]);
  const activeSales = useMemo(() => sales.filter(s => !s.isDeleted), [sales]);
  const activeCustomers = useMemo(() => customers.filter(c => !c.isDeleted), [customers]);

  // MEMOIZED COMPUTATIONS
  const availableCategoriesList = useMemo(() => {
    return [...new Set([...activeCategories.map(c => c.name), ...activeRecipes.map(r => r.category)].filter(Boolean))];
  }, [activeCategories, activeRecipes]);

  // DB HANDLERS
  const logInventoryMovement = async (invId, invName, type, amount, unit, price, reason) => {
    try {
      await addDoc(collection(db, 'bakery', user.uid, 'inventory_logs'), {
        invId, invName, type, amount, unit, price, reason, timestamp: Date.now()
      });
    } catch (error) { console.error('Error logging:', error); }
  };

  const handleUpdateDoc = async (colName, id, data) => {
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'bakery', user.uid, colName, id), data);
      showToast('Оновлено!');
    } catch (error) { showToast('Помилка оновлення'); }
  };

  const handleDeleteDoc = async (colName, id, confirmMsg) => {
    askConfirm("Видалення", confirmMsg, async () => {
      try {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'bakery', user.uid, colName, id), { isDeleted: true, deletedAt: Date.now() });
        showToast('Переміщено у Кошик');
        handleBack();
      } catch (error) { showToast('Помилка видалення'); }
    });
  };

  const handleRestoreDoc = async (colName, id) => {
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'bakery', user.uid, colName, id), { isDeleted: false, deletedAt: null });
      showToast('Відновлено!');
    } catch (e) { showToast('Помилка відновлення'); }
  };

  const handlePermanentDeleteDoc = (colName, id, typeName) => {
    askConfirm("Видалення", `Назавжди видалити цей запис?`, async () => {
      try {
        await deleteDoc(doc(db, 'bakery', user.uid, colName, id));
        showToast('Видалено назавжди!');
      } catch (e) { showToast('Помилка'); }
    });
  };

  const handleEmptyTrash = () => {
    askConfirm("Очистити кошик", "Ви впевнені? Всі видалені елементи зникнуть назавжди.", async () => {
       const allDeleted = [
          ...recipes.filter(i => i.isDeleted).map(i => ({id: i.id, col: 'recipes'})),
          ...categories.filter(i => i.isDeleted).map(i => ({id: i.id, col: 'categories'})),
          ...inventory.filter(i => i.isDeleted).map(i => ({id: i.id, col: 'inventory'})),
          ...sales.filter(i => i.isDeleted).map(i => ({id: i.id, col: 'sales'})),
          ...customers.filter(i => i.isDeleted).map(i => ({id: i.id, col: 'customers'})),
          ...preps.filter(i => i.isDeleted).map(i => ({id: i.id, col: 'preps'})),
       ];
       for(let item of allDeleted) {
          await deleteDoc(doc(db, 'bakery', user.uid, item.col, item.id)).catch(()=>{});
       }
       showToast("Кошик очищено!");
    });
  };

  // AUTO-CLEANUP TRASH
  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) return;
    const timer = setTimeout(async () => {
       const thirtyDays = 30 * 24 * 60 * 60 * 1000;
       const now = Date.now();
       const { deleteDoc } = await import('firebase/firestore');
       const cleanup = async (items, col) => {
         for(let i of items) {
           if (i.isDeleted && i.deletedAt && now - i.deletedAt > thirtyDays) {
              await deleteDoc(doc(db, 'bakery', user.uid, col, i.id)).catch(()=>{});
           }
         }
       };
       cleanup(recipes, 'recipes'); cleanup(categories, 'categories'); cleanup(inventory, 'inventory'); 
       cleanup(sales, 'sales'); cleanup(customers, 'customers'); cleanup(preps, 'preps');
    }, 5000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, user]);

  // Handle Account Deletion Event
  useEffect(() => {
    const handleAccountDeletion = async () => {
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if(currentUser) {
          await currentUser.delete();
          window.location.reload();
        }
      } catch(e) {
        showToast("Помилка видалення. Можливо, потрібна повторна авторизація.");
      }
    };
    window.addEventListener('delete-account', handleAccountDeletion);
    return () => window.removeEventListener('delete-account', handleAccountDeletion);
  }, []);

  const handleCompleteOrder = async (order) => {
    try {
      const { updateDoc } = await import('firebase/firestore');
      let tr = (order.decorPrice || 0);
      let tc = (order.decorPrice || 0) + (order.internalCost || 0);
      
      order.items?.forEach(item => {
        const r = activeRecipes.find(rec => rec.id === item.recipeId);
        if(r) tc += (calculateCost(r, item.fillingId, activeInventory, activePreps) / Math.max(r.baseYield || 1, 0.001)) * item.quantity;
        tr += (item.sellPrice || 0);
      });
      
      await updateDoc(doc(db, 'bakery', user.uid, 'sales', order.id), { status: 'completed', historicalCost: tc });
      showToast('Замовлення видано!');
    } catch (e) { showToast('Помилка'); }
  };

  const checkSubscription = (feature) => {
    return true; // PAYWALL DISABLED FOR GOOGLE PLAY SUBMISSION
  };

  // RENDER HELPERS
  let headerTitle = '';
  if (showInvoicePreview) headerTitle = "Товарний чек";
  else if (showShoppingListPreview) headerTitle = "Список закупівель";
  else if (editingOrder) headerTitle = "Редагування";
  else if (isAddingNew) headerTitle = activeTab === 'sales' ? 'Нове замовлення' : activeTab === 'inventory' ? 'Новий матеріал' : activeTab === 'customers' ? 'Новий клієнт' : 'Новий запис';
  else if (selectedItem) headerTitle = selectedItem.name;
  else if (invoiceMode) headerTitle = `Вибрано: ${selectedForInvoice.length}`;
  else if (activeTab === 'sales') headerTitle = 'Замовлення';
  else if (activeTab === 'inventory') headerTitle = 'Склад';
  else if (activeTab === 'customers') headerTitle = 'Клієнти';
  else if (activeTab === 'recipes') headerTitle = selectedCategory ? selectedCategory : 'Каталог';
  else if (activeTab === 'preps') headerTitle = 'Заготівлі';
  else if (activeTab === 'analytics') headerTitle = 'Аналітика';
  else if (activeTab === 'admin') headerTitle = 'Адмін Панель';
  else if (activeTab === 'trash') headerTitle = 'Кошик';

  const hasBack = !!(showInvoicePreview || showShoppingListPreview || editingOrder || isAddingNew || selectedItem || (selectedCategory && activeTab === 'recipes') || invoiceMode);

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-[#151212] flex flex-col items-center justify-center text-[#F4EFEA] font-sans">
         <div className="w-16 h-16 border-4 border-[#2A2323] border-t-[#D4AF37] rounded-full animate-spin mb-6 shadow-lg"></div>
         <h2 className="text-xl font-bold tracking-widest text-[#D4AF37]">WHISKED</h2>
         <p className="text-[#8C7A7A] mt-2 font-medium tracking-wide animate-pulse">{loadingStep}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinScreen />;
  }

  return (
    <div className="h-[100dvh] w-full bg-black text-[#F4EFEA] font-sans overflow-hidden select-none relative">
      {isMenuOpen && <DrawerMenu activeTab={activeTab} user={user} onNavigate={changeMainTab} onClose={() => setIsMenuOpen(false)} onShowPaywall={() => setShowPaywall(true)} onShowLanguage={() => setShowLanguageModal(true)} showToast={showToast} />}

      <div className="h-full max-w-md mx-auto bg-[#151212] relative shadow-2xl flex flex-col pt-safe">
        
        <AppHeader 
          headerTitle={headerTitle} hasBack={hasBack} onBack={handleBack} onMenuOpen={() => setIsMenuOpen(true)}
          activeTab={activeTab} invoiceMode={invoiceMode} selectedItem={selectedItem} isAddingNew={isAddingNew} editingOrder={editingOrder}
          showInvoicePreview={showInvoicePreview} showShoppingListPreview={showShoppingListPreview} selectedCategory={selectedCategory}
          onInvoiceMode={() => setInvoiceMode(true)} onCancelInvoice={() => { setInvoiceMode(false); setSelectedForInvoice([]); }}
          onShoppingList={() => setShowShoppingListPreview(true)}
          onPlusClick={() => {
             if (activeTab === 'sales' && !checkSubscription('додавання нових замовлень')) return;
             if (activeTab === 'recipes' && !checkSubscription('створення нових десертів')) return;
             setIsAddingNew(true);
          }}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
          <div className="min-h-full">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab + (selectedItem ? 'item' : '') + (isAddingNew ? 'new' : '') + (selectedCategory || '') + (showInvoicePreview ? 'inv' : '') + (showShoppingListPreview ? 'shop' : '')}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.1 }} className="flex-1">
                
                {showInvoicePreview ? (
                  <InvoicePreview sales={activeSales.filter(s => selectedForInvoice.includes(s.id))} recipes={activeRecipes} />
                ) : showShoppingListPreview ? (
                  <ShoppingListPreview inventory={activeInventory} sales={activeSales} recipes={activeRecipes} preps={activePreps} />
                ) : (isAddingNew || editingOrder) ? (
                  activeTab === 'sales' ? <AddOrderForm recipes={activeRecipes} inventory={activeInventory} preps={activePreps} onSave={async (d, f) => { 
                      setIsLoading(true); setLoadingStep("Збереження...");
                      try {
                        if (f) { const { updateDoc } = await import('firebase/firestore'); await updateDoc(doc(db, 'bakery', user.uid, 'sales', f.id), d); showToast("Оновлено!"); }
                        else { await addDoc(collection(db, 'bakery', user.uid, 'sales'), { ...d, createdAt: Date.now() }); showToast("Збережено!"); }
                        handleBack();
                      } catch(e) { showToast("Помилка"); } setIsLoading(false);
                  }} customers={customers} initialData={editingOrder} /> : 
                  activeTab === 'inventory' ? <AddInventoryForm onSave={async (d, f) => { 
                      setIsLoading(true); setLoadingStep("Збереження...");
                      try {
                          let imgUrl = null; 
                          if(f) imgUrl = await compressImage(f); 
                          const nRef = await addDoc(collection(db, 'bakery', user.uid, 'inventory'), { ...d, imageUrl: imgUrl }); 
                          await logInventoryMovement(nRef.id, d.name, 'IN', d.quantity, d.unit, d.price, 'Початкове внесення');
                          handleBack(); showToast("Матеріал додано"); 
                      } catch(e) { showToast("Помилка"); }
                      setIsLoading(false);
                  }} /> :
                  activeTab === 'customers' ? <AddCustomerForm onSave={async (d) => { 
                      setIsLoading(true); setLoadingStep("Збереження...");
                      try { await addDoc(collection(db, 'bakery', user.uid, 'customers'), { ...d, orderCount: 0, totalSpent: 0 }); handleBack(); showToast("Клієнта додано!"); } 
                      catch(e) { showToast("Помилка"); } setIsLoading(false);
                  }} /> :
                  activeTab === 'recipes' ? <Suspense fallback={<div className="p-4">Завантаження...</div>}><AddRecipeForm onSave={async(d,f) => {
                     setIsLoading(true); setLoadingStep("Збереження...");
                     try {
                        let imgUrl = null; 
                        if(f) imgUrl = await compressImage(f); 
                        await addDoc(collection(db, 'bakery', user.uid, 'recipes'), { ...d, imageUrl: imgUrl }); 
                        handleBack(); showToast("Рецепт додано!"); 
                     } catch(e) { showToast("Помилка збереження"); }
                     setIsLoading(false);
                  }} type="recipe" initialCategory={selectedCategory} allCategories={availableCategoriesList} /></Suspense> : null
                ) : selectedItem ? (
                  activeTab === 'inventory' ? <InventoryDetail item={selectedItem} onUpdate={(d) => handleUpdateDoc('inventory', selectedItem.id, d)} onDelete={() => handleDeleteDoc('inventory', selectedItem.id, "Перемістити матеріал у Кошик?")} onWaste={(item, qty) => {
                      const newQty = item.quantity - qty;
                      handleUpdateDoc('inventory', item.id, { quantity: newQty });
                      addDoc(collection(db, 'bakery', user.uid, 'waste'), { invId: item.id, name: item.name, amount: qty, cost: qty * item.price, date: new Date().toISOString() });
                      logInventoryMovement(item.id, item.name, 'WASTE', qty, item.unit, item.price, 'Списання в брак');
                  }} askConfirm={askConfirm} askPrompt={askPrompt} showToast={showToast} logs={inventoryLogs} logMovement={logInventoryMovement} compressImage={compressImage} /> :
                  activeTab === 'customers' ? <Suspense fallback={<div className="p-4">Завантаження...</div>}><CustomerDetail item={selectedItem} onUpdate={(d) => handleUpdateDoc('customers', selectedItem.id, d)} onDelete={() => handleDeleteDoc('customers', selectedItem.id, "Перемістити клієнта у Кошик?")} askPrompt={askPrompt} sales={activeSales} /></Suspense> :
                  activeTab === 'recipes' ? <Suspense fallback={<div className="p-4">Завантаження...</div>}><RecipeDetail item={selectedItem} type="recipes" inventory={activeInventory} preps={activePreps} costFn={(obj, fId) => calculateCost(obj, fId, activeInventory, activePreps)} compressImage={compressImage} onUpdate={(d) => handleUpdateDoc('recipes', selectedItem.id, d)} onDelete={() => handleDeleteDoc('recipes', selectedItem.id, "Перемістити рецепт у Кошик?")} askConfirm={askConfirm} askPrompt={askPrompt} allCategories={availableCategoriesList} /></Suspense> : 
                  activeTab === 'preps' ? <Suspense fallback={<div className="p-4">Завантаження...</div>}><RecipeDetail item={selectedItem} type="preps" inventory={activeInventory} preps={activePreps} costFn={(obj, fId) => calculateCost(obj, fId, activeInventory, activePreps)} compressImage={compressImage} onUpdate={(d) => handleUpdateDoc('preps', selectedItem.id, d)} onDelete={() => handleDeleteDoc('preps', selectedItem.id, "Перемістити заготівлю у Кошик?")} onCook={async (item, qty) => {
                      if (!qty || qty <= 0) return;
                      const newQty = (item.quantity || 0) + qty;
                      handleUpdateDoc('preps', item.id, { quantity: newQty });
                      showToast(`Приготовано: ${qty}`);
                  }} askConfirm={askConfirm} askPrompt={askPrompt} /></Suspense> : null
                ) : (
                  <div className="pt-4">
                    {activeTab === 'sales' && <OrdersList sales={activeSales} recipes={activeRecipes} costFn={(obj, fId) => calculateCost(obj, fId, activeInventory, activePreps)} onDelete={(id) => handleDeleteDoc('sales', id, "Перемістити замовлення у Кошик?")} onComplete={handleCompleteOrder} invoiceMode={invoiceMode} selectedForInvoice={selectedForInvoice} toggleSelection={(id) => setSelectedForInvoice(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id])} onEditOrder={setEditingOrder} />}
                    {activeTab === 'customers' && <CustomersList customers={activeCustomers} sales={activeSales} onClick={setSelectedItem} />}
                    {activeTab === 'recipes' && !selectedCategory && <RecipeCategories recipes={activeRecipes} dbCategories={activeCategories} allUniqueNames={availableCategoriesList} onSelectCategory={setSelectedCategory} onSaveCategory={async (id, oldName, newName, icon, file) => {
                       // simplified category save
                       if (id) handleUpdateDoc('categories', id, { name: newName, icon });
                       else addDoc(collection(db, 'bakery', user.uid, 'categories'), { name: newName, icon });
                    }} onDeleteCategory={async (id, name) => {
                       if(id) handleUpdateDoc('categories', id, { isDeleted: true, deletedAt: Date.now() });
                       const relatedRecipes = activeRecipes.filter(r => r.category === name);
                       for(let r of relatedRecipes) {
                          handleUpdateDoc('recipes', r.id, { isDeleted: true, deletedAt: Date.now() });
                       }
                    }} askConfirm={askConfirm} />}
                    {activeTab === 'recipes' && selectedCategory && <List items={activeRecipes.filter(r => (r.category || 'Інше') === selectedCategory)} costFn={(item) => calculateCost(item, null, activeInventory, activePreps)} onClick={setSelectedItem} emptyTxt={`В папці порожньо`} showThumb={true} />}
                    {activeTab === 'preps' && <List items={activePreps} costFn={(item) => calculateCost(item, null, activeInventory, activePreps)} onClick={setSelectedItem} emptyTxt="Немає заготівель." showThumb={true} />}
                    {activeTab === 'inventory' && (
                      <div className="pt-2">
                        <div className="flex bg-[#1E1919] mx-4 rounded-[20px] p-1.5 mb-2 shadow-sm border border-[#2A2323]">
                          <button onClick={() => setInventoryMode('list')} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-xl transition-all border ${inventoryMode === 'list' ? 'bg-[#151212] text-[#D4AF37] shadow-md border-[#2A2323]' : 'text-[#8C7A7A] border-transparent'}`}>Залишки</button>
                          <button onClick={() => setInventoryMode('history')} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-xl transition-all border ${inventoryMode === 'history' ? 'bg-[#151212] text-[#F4EFEA] shadow-md border-[#2A2323]' : 'text-[#8C7A7A] border-transparent'}`}>Історія руху</button>
                        </div>
                        {inventoryMode === 'list' ? (
                          <InventoryList inventory={activeInventory} onClick={setSelectedItem} />
                        ) : (
                          <Suspense fallback={<div className="p-4">Завантаження...</div>}>
                            <InventoryHistory historyLogs={inventoryLogs.map(log => ({
                              id: log.id, itemName: log.invName,
                              type: log.type === 'IN' ? 'add' : log.type === 'WASTE' ? 'waste' : (log.reason || '').includes('Ревізія') ? 'edit' : 'usage',
                              change: log.type === 'IN' ? log.amount : -log.amount, unit: log.unit, reason: log.reason, date: new Date(log.timestamp).toISOString()
                            }))} />
                          </Suspense>
                        )}
                      </div>
                    )}
                    {activeTab === 'analytics' && <Suspense fallback={<div className="p-4 text-center">Завантаження...</div>}><Analytics sales={activeSales} recipes={activeRecipes} inventory={activeInventory} costFn={(r,f)=>calculateCost(r,f,activeInventory,activePreps)} customers={activeCustomers} waste={waste} onCustomerClick={(custName) => {
                        const foundCust = activeCustomers.find(c => (c.name || '').toLowerCase().trim() === (custName || '').toLowerCase().trim());
                        if (foundCust) { navigate('/customers'); setSelectedItem(foundCust); } else { showToast("Клієнта не знайдено"); }
                    }} /></Suspense>}
                    {activeTab === 'admin' && <Suspense fallback={<div className="p-4 text-center">Завантаження...</div>}><AdminPanel onClose={() => changeMainTab('sales')} /></Suspense>}
                    {activeTab === 'trash' && <Suspense fallback={<div className="p-4 text-center">Завантаження...</div>}>
                        <Trash recipes={recipes} categories={categories} inventory={inventory} preps={preps} sales={sales} customers={customers} onRestore={handleRestoreDoc} onPermanentDelete={handlePermanentDeleteDoc} onEmptyTrash={handleEmptyTrash} />
                    </Suspense>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS FOR INVOICE MODE */}
        {activeTab === 'sales' && invoiceMode && !showInvoicePreview && selectedForInvoice.length > 0 && (
          <div className="absolute bottom-[90px] w-full px-4 z-20">
             <button onClick={() => setShowInvoicePreview(true)} className="w-full bg-[#D4AF37] text-[#151212] font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 outline-none focus:outline-none select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
               Сформувати чек ({selectedForInvoice.length})
             </button>
          </div>
        )}

        {/* BOTTOM TAB BAR */}
        {(!selectedItem && !isAddingNew && !editingOrder && !showInvoicePreview && !showShoppingListPreview) && (
          <TabBar activeTab={activeTab} user={user} changeMainTab={changeMainTab} />
        )}
        
        {/* CUSTOM MODALS & TOASTS */}
        <CustomPrompt config={promptDialog} onClose={() => setPromptDialog(null)} />

        {showLanguageModal && <LanguageSelection onComplete={() => setShowLanguageModal(false)} />}
        
        <Suspense fallback={null}>
          <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature={paywallFeature} />
        </Suspense>

        {confirmDialog && (
          <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-5 animate-in fade-in duration-100">
            <div className="bg-[#1E1919] border border-[#2A2323] p-6 rounded-[32px] w-full max-w-xs shadow-2xl">
              <h3 className="text-[#F4EFEA] font-bold text-xl mb-2">{confirmDialog.title}</h3>
              <p className="text-[#8C7A7A] text-sm mb-6 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button onClick={()=>{confirmDialog.onConfirm(); setConfirmDialog(null)}} className="flex-1 bg-[#D4AF37] text-[#151212] font-bold py-3.5 rounded-xl shadow-lg shadow-[#D4AF37]/20 active:scale-95">Так</button>
                <button onClick={()=>{if(confirmDialog.onCancel) confirmDialog.onCancel(); setConfirmDialog(null)}} className="flex-1 bg-[#151212] text-[#F4EFEA] border border-[#2A2323] font-bold py-3.5 rounded-xl active:scale-95">Ні</button>
              </div>
            </div>
          </div>
        )}
        
        {toast && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#151212] px-6 py-3 rounded-full font-bold text-sm shadow-xl shadow-black/50 z-[110] animate-in slide-in-from-bottom-5 fade-in duration-150">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
