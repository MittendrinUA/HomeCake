import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Book, Package, BarChart2, Plus, ChevronLeft, Trash2, Edit2, Loader, AlertCircle, Camera, Receipt, CheckSquare, Square, X, CalendarClock, CheckCircle, Clock, Layers, Calculator, FileText, Utensils, ClipboardList, Menu, Folder, Send, Search, PackageOpen, Users, Star, ChevronRight, History, HelpCircle } from 'lucide-react';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import Analytics from './components/Analytics';
import CustomerDetail from './components/CustomerDetail';
import PinScreen from './components/PinScreen';
import Storefront from './components/Storefront';
import AddRecipeForm from './components/AddRecipeForm';
import RecipeDetail from './components/RecipeDetail';
import InventoryHistory from './components/InventoryHistory';

const firebaseConfig = { 
  apiKey: "AIzaSyDT6Ez-ZmRvEJZA3REIYDZXVI9t5Z2O9zc", 
  authDomain: "backery-bc0c9.firebaseapp.com", 
  projectId: "backery-bc0c9", 
  storageBucket: "backery-bc0c9.firebasestorage.app", 
  messagingSenderId: "236979354452", 
  appId: "1:236979354452:web:5b57ad9aa4e990c6aca6c1", 
  measurementId: "G-NVH0FC7917" 
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app); 
const db = getFirestore(app);

const compressImage = (file) => new Promise((resolve) => { 
  const reader = new FileReader(); 
  reader.readAsDataURL(file); 
  reader.onload = (e) => { 
    const img = new window.Image(); 
    img.src = e.target.result; 
    img.onload = () => { 
      const canvas = document.createElement('canvas'); 
      const MAX_WIDTH = 400; const MAX_HEIGHT = 400; 
      let w = img.width; let h = img.height; 
      if (w > h) { if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; } } else { if (h > MAX_HEIGHT) { w *= MAX_HEIGHT / h; h = MAX_HEIGHT; } } 
      canvas.width = w; canvas.height = h; 
      const ctx = canvas.getContext('2d'); 
      ctx.drawImage(img, 0, 0, w, h); 
      resolve(canvas.toDataURL('image/jpeg', 0.6)); 
    }; 
  }; 
});

export default function App() {
  const [activeTab, setActiveTab] = useState('sales');
  // Стан перевірки ПІН-коду (запам'ятовуємо в пам'яті браузера)
  const [inventoryMode, setInventoryMode] = useState('list');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
  return localStorage.getItem('adminUnlocked') === 'true';
  }); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); 
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [user, setUser] = useState(null); 
  const [inventory, setInventory] = useState([]);
  const [inventoryHistoryLogs, setInventoryHistoryLogs] = useState([]); 
  const [recipes, setRecipes] = useState([]); 
  const [sales, setSales] = useState([]); 
  const [preps, setPreps] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [customers, setCustomers] = useState([]);
  const [waste, setWaste] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true); 
  const [loadingStep, setLoadingStep] = useState('Ініціалізація...'); 
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [selectedItem, setSelectedItem] = useState(null); 
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const [invoiceMode, setInvoiceMode] = useState(false); 
  const [selectedForInvoice, setSelectedForInvoice] = useState([]); 
  const [showInvoicePreview, setShowInvoicePreview] = useState(false); 
  const [showShoppingListPreview, setShowShoppingListPreview] = useState(false);
  
  const [toast, setToast] = useState(null); 
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);

  const scrollRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const askConfirm = (title, msg, onConfirm, onCancel) => setConfirmDialog({ title, msg, onConfirm, onCancel });
  const askPrompt = (title, fields, onSave) => setPromptDialog({ title, fields, onSave });

  // ========== ВИПРАВЛЕННЯ ДЛЯ iOS ==========
  useEffect(() => {
    // Додаємо мета-тег viewport для заборони масштабування
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    // Запобігаємо масштабуванню при мультитач
    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', preventZoom, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', preventZoom);
    };
  }, []);
  // =========================================

  useEffect(() => {
    setLoadingStep('Авторизація...');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { 
      if (currentUser) setUser(currentUser); 
      else signInAnonymously(auth).catch(e => { setErrorMsg(e.message); setIsLoading(false); }); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingStep("Синхронізація баз...");
    let loaded = 0; const checkLoaded = () => { loaded++; if (loaded >= 8) setIsLoading(false); };
    const unsubHistory = onSnapshot(collection(db, 'inventoryHistory'), (snapshot) => {
      setInventoryHistoryLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }); 
    const u1 = onSnapshot(collection(db, 'bakery', 'main', 'inventory'), (s) => { setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (e) => setErrorMsg(e.message));
    const u2 = onSnapshot(collection(db, 'bakery', 'main', 'recipes'), (s) => { setRecipes(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (e) => setErrorMsg(e.message));
    const u3 = onSnapshot(collection(db, 'bakery', 'main', 'sales'), (s) => { setSales(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (e) => setErrorMsg(e.message));
    const u4 = onSnapshot(collection(db, 'bakery', 'main', 'preps'), (s) => { setPreps(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (e) => setErrorMsg(e.message));
    const u5 = onSnapshot(collection(db, 'bakery', 'main', 'categories'), (s) => { setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (e) => setErrorMsg(e.message));
    const u6 = onSnapshot(collection(db, 'bakery', 'main', 'customers'), (s) => { setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (e) => setErrorMsg(e.message));
    const u7 = onSnapshot(collection(db, 'bakery', 'main', 'waste'), (s) => { setWaste(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (e) => setErrorMsg(e.message));
    const u8 = onSnapshot(collection(db, 'bakery', 'main', 'inventory_logs'), (s) => { setInventoryLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (e) => setErrorMsg(e.message));
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); unsubHistory(); };
  }, [user]);

  const logInventoryMovement = async (invId, invName, type, amount, unit, price, reason) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'bakery', 'main', 'inventory_logs'), {
        invId: invId || 'unknown', 
        invName: invName || 'Невідомо', 
        type: type || 'OUT', 
        amount: Number(amount) || 0, 
        unit: unit || 'г', 
        price: Number(price) || 0, 
        reason: reason || '', 
        timestamp: Date.now()
      });
    } catch(e) { console.error("Помилка логування", e); }
  };

  const availableCategoriesList = [...new Set([
    ...categories.map(c=>c?.name).filter(Boolean), 
    ...recipes.map(r=>r?.category||'Інше').filter(Boolean), 
    'Інше'
  ])];

  const logInventoryChange = async (itemId, itemName, changeAmt, unit, reason, type) => {
  if (Number(changeAmt) === 0) return; // Не пишемо в лог, якщо кількість не змінилась
  try {
    await addDoc(collection(db, 'inventoryHistory'), {
      itemId,
      itemName,
      change: Number(changeAmt),
      unit,
      reason,
      type, // 'usage' (на десерт), 'waste' (брак), 'add' (закупівля), 'edit' (ревізія)
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error("Помилка запису в історію:", error);
  }
};

  const handleBack = () => { 
    if (editingOrder) setEditingOrder(null);
    else if (selectedItem) setSelectedItem(null); 
    else if (isAddingNew) setIsAddingNew(false); 
    else if (showInvoicePreview) setShowInvoicePreview(false); 
    else if (showShoppingListPreview) setShowShoppingListPreview(false); 
    else if (selectedCategory && activeTab === 'recipes') setSelectedCategory(null); 
  };
  
  const changeMainTab = (tab) => { 
    setActiveTab(tab); setSelectedItem(null); setIsAddingNew(false); setEditingOrder(null); setInvoiceMode(false); 
    setShowInvoicePreview(false); setShowShoppingListPreview(false); setIsDrawerOpen(false); 
    if(tab !== 'recipes') setSelectedCategory(null); 
  };

  const calculateCost = (itemObj, fillingId = null) => {
    if (!itemObj) return 0;
    let cost = 0;
    const calcIngsCost = (ings) => {
       return (ings || []).reduce((total, ing) => {
          if (ing.prepId) {
             const p = preps.find(pr => pr.id === ing.prepId);
             return total + (p ? (calculateCost(p) / Math.max(p.baseYield || 1, 0.001)) * ing.amount : 0);
          }
          const invItem = inventory.find(i => i.id === ing.invId);
          return total + (invItem ? invItem.price * ing.amount : 0);
       }, 0);
    };

    cost += calcIngsCost(itemObj.ingredients);
    if (fillingId && itemObj.fillings) {
       const filling = itemObj.fillings.find(f => f.id === fillingId);
       if (filling) cost += calcIngsCost(filling.ingredients);
    }
    return cost;
  };

  const handleWasteInventory = async (itemObj, wasteAmount) => {
    if (!user) return;
    setIsLoading(true); setLoadingStep("Реєстрація браку...");
    try {
      const costLoss = Number((wasteAmount * itemObj.price).toFixed(2));
      await addDoc(collection(db, 'bakery', 'main', 'waste'), {
        invId: itemObj.id, name: itemObj.name, quantity: wasteAmount, unit: itemObj.unit, lossAmount: costLoss, date: new Date().toISOString()
      });
      
      const newQty = Number(Math.max(0, itemObj.quantity - wasteAmount).toFixed(2));
      let updateData = { quantity: newQty };
      
      if (itemObj.isMix && itemObj.mixItems) {
         const proportion = newQty / (itemObj.quantity || 1);
         updateData.mixItems = itemObj.mixItems.map(mi => ({...mi, quantity: Number((mi.quantity * proportion).toFixed(2)), cost: Number((mi.cost * proportion).toFixed(2))})).filter(mi => mi.quantity > 0.01);
         const tQ = updateData.mixItems.reduce((s,i)=>s+i.quantity,0);
         const tC = updateData.mixItems.reduce((s,i)=>s+i.cost,0);
         updateData.price = tQ > 0 ? Number((tC/tQ).toFixed(2)) : itemObj.price;
      }

      await updateDoc(doc(db, 'bakery', 'main', 'inventory', itemObj.id), updateData);
      await logInventoryMovement(itemObj.id, itemObj.name, 'WASTE', wasteAmount, itemObj.unit, itemObj.price, 'Брак / Зіпсувалось');
      setSelectedItem(prev => ({ ...prev, ...updateData }));
      showToast("Списано в брак!");
    } catch(e) { showToast("Помилка списання!"); }
    setIsLoading(false);
  };

  const handleUpdateSelectedItem = async (collectionName, id, newData) => { 
    if (user) { await updateDoc(doc(db, 'bakery', 'main', collectionName, id), newData); setSelectedItem(prev => ({ ...prev, ...newData })); showToast("Оновлено!"); } 
  };
  
  const handleDeleteDoc = (colName, id, confirmMsg) => askConfirm("Підтвердження", confirmMsg, async () => { 
    await deleteDoc(doc(db, 'bakery', 'main', colName, id)); handleBack(); showToast("Видалено!"); 
  });

  const deductInventoryForOrder = async (orderItems) => {
    for (const item of orderItems) {
      const recipe = recipes.find(r => r.id === item.recipeId); if (!recipe) continue;
      const proportion = (Number(item.quantity) || 1) / Math.max(recipe.baseYield || 1, 0.001);
      
      const deductIngs = async (ings, currentProportion) => { 
        if(!ings) return; 
        for (const ing of ings) { 
          if (ing.prepId) {
             const p = preps.find(pr => pr.id === ing.prepId);
             if (p) await deductIngs(p.ingredients, currentProportion * (ing.amount / Math.max(p.baseYield || 1, 0.001)));
          } else if (ing.invId) {
             const invItem = inventory.find(i => i.id === ing.invId); 
             if (invItem) { 
               const amt = (Number(ing.amount) || 0) * currentProportion;
               let newQuantity = Number(Math.max(0, (invItem.quantity || 0) - amt).toFixed(2)); 
               
               let updateData = { quantity: newQuantity };
               if (invItem.isMix && invItem.mixItems) {
                  const mixProp = newQuantity / Math.max(invItem.quantity || 1, 0.001);
                  updateData.mixItems = invItem.mixItems.map(mi => ({...mi, quantity: Number((mi.quantity * mixProp).toFixed(2)), cost: Number((mi.cost * mixProp).toFixed(2))})).filter(mi => mi.quantity > 0.01);
                  const tQ = updateData.mixItems.reduce((s,i)=>s+i.quantity,0);
                  const tC = updateData.mixItems.reduce((s,i)=>s+i.cost,0);
                  updateData.price = tQ > 0 ? Number((tC/tQ).toFixed(2)) : (invItem.price || 0);
               }

               await updateDoc(doc(db, 'bakery', 'main', 'inventory', invItem.id), updateData); 
               await logInventoryMovement(invItem.id, invItem.name, 'OUT', Number(amt.toFixed(2)), invItem.unit, invItem.price || 0, 'Замовлення');
             } 
          }
        } 
      };
      
      await deductIngs(recipe.ingredients, proportion); 
      if (item.fillingId && recipe.fillings) { 
        const filling = recipe.fillings.find(f => f.id === item.fillingId); 
        if (filling) await deductIngs(filling.ingredients, proportion); 
      }
    }
  };

  const handleSaveOrder = async (saleData, originalOrder = null) => {
    if (!user) return; setIsLoading(true); setLoadingStep("Збереження...");
    try {
      let hCost = (Number(saleData.decorPrice) || 0) + (Number(saleData.internalCost) || 0);
      (saleData.items || []).forEach(item => {
         const r = recipes.find(rec => rec.id === item.recipeId);
         if (r) {
            const unitC = calculateCost(r, item.fillingId) / Math.max(r.baseYield || 1, 0.001);
            hCost += unitC * item.quantity;
         }
      });
      const finalSaleDataToSave = { ...saleData, historicalCost: Number(hCost.toFixed(2)) };

      if (originalOrder) {
        await updateDoc(doc(db, 'bakery', 'main', 'sales', originalOrder.id), finalSaleDataToSave);
        if (originalOrder.status === 'planned' && saleData.status === 'completed') {
           await deductInventoryForOrder(saleData.items || []);
        }
        showToast("Замовлення оновлено!");
      } else {
        const finalSaleData = { ...finalSaleDataToSave, createdAt: Date.now() };
        await addDoc(collection(db, 'bakery', 'main', 'sales'), finalSaleData);
        if (saleData.status === 'completed') await deductInventoryForOrder(saleData.items || []);
        
        if(saleData.customer) {
          const exist = customers.find(c => c.name.toLowerCase().trim() === saleData.customer.toLowerCase().trim());
          if(exist) {
            await updateDoc(doc(db, 'bakery', 'main', 'customers', exist.id), { orderCount: exist.orderCount + 1, totalSpent: exist.totalSpent + saleData.totalPrice, lastOrderDate: saleData.date });
          } else {
            await addDoc(collection(db, 'bakery', 'main', 'customers'), { name: saleData.customer.trim(), orderCount: 1, totalSpent: saleData.totalPrice, lastOrderDate: saleData.date });
          }
        }
        showToast("Замовлення збережено!");
      }
      setEditingOrder(null);
      setIsAddingNew(false);
    } catch (err) { showToast("Помилка: " + err.message); }
    setIsLoading(false);
  };

  const handleCompleteOrder = (sale, onCancel) => askConfirm("Видача замовлення", "Підтвердити видачу? Інгредієнти будуть списані зі складу.", async () => {
    setIsLoading(true); setLoadingStep("Списання...");
    try { 
      await deductInventoryForOrder(sale.items || [{ recipeId: sale.recipeId, fillingId: sale.fillingId, quantity: sale.quantity }]); 
      await updateDoc(doc(db, 'bakery', 'main', 'sales', sale.id), { status: 'completed', completedAt: Date.now() }); 
      showToast("Успішно видано!"); 
    } catch (err) { 
      alert("Помилка при видачі: " + err.message); 
      showToast("Помилка!"); 
    }
    setIsLoading(false);
  }, onCancel);

  const handleCookPrep = async (prep, yieldAmount) => {
    if (!user || yieldAmount <= 0) return; setIsLoading(true); setLoadingStep("Створення заготівлі...");
    try {
      const proportion = yieldAmount / Math.max(prep.baseYield || 1, 0.001); 
      const unitPrice = calculateCost(prep) / Math.max(prep.baseYield || 1, 0.001);
      
      const deductIngs = async (ings, currentProportion) => {
        if(!ings) return;
        for (const ing of ings) {
          if (ing.prepId) {
             const p = preps.find(pr => pr.id === ing.prepId);
             if (p) await deductIngs(p.ingredients, currentProportion * (ing.amount / Math.max(p.baseYield || 1, 0.001)));
          } else if (ing.invId) {
             const invItem = inventory.find(i => i.id === ing.invId); 
             if (invItem) { 
               const amt = (Number(ing.amount) || 0) * currentProportion;
               let newQty = Number(Math.max(0, (invItem.quantity || 0) - amt).toFixed(2)); 
               
               let updateData = { quantity: newQty };
               if (invItem.isMix && invItem.mixItems) {
                  const mixProp = newQty / Math.max(invItem.quantity || 1, 0.001);
                  updateData.mixItems = invItem.mixItems.map(mi => ({...mi, quantity: Number((mi.quantity * mixProp).toFixed(2)), cost: Number((mi.cost * mixProp).toFixed(2))})).filter(mi => mi.quantity > 0.01);
                  const tQ = updateData.mixItems.reduce((s,i)=>s+i.quantity,0);
                  const tC = updateData.mixItems.reduce((s,i)=>s+i.cost,0);
                  updateData.price = tQ > 0 ? Number((tC/tQ).toFixed(2)) : (invItem.price || 0);
               }

               await updateDoc(doc(db, 'bakery', 'main', 'inventory', invItem.id), updateData); 
               await logInventoryMovement(invItem.id, invItem.name, 'OUT', Number(amt.toFixed(2)), invItem.unit, invItem.price || 0, `На заготівлю: ${prep.name}`);
             }
          }
        }
      };

      await deductIngs(prep.ingredients, proportion);
      
      const existing = inventory.find(i => (i.name||'').toLowerCase() === (prep.name||'').toLowerCase());
      if (existing) {
        await updateDoc(doc(db, 'bakery', 'main', 'inventory', existing.id), { quantity: Number((existing.quantity + Number(yieldAmount)).toFixed(2)), price: Number(unitPrice.toFixed(2)) });
        await logInventoryMovement(existing.id, prep.name, 'IN', Number(yieldAmount), prep.unit, Number(unitPrice.toFixed(2)), 'Приготовано');
      } else {
        const newRef = await addDoc(collection(db, 'bakery', 'main', 'inventory'), { name: prep.name, unit: prep.unit, quantity: Number(Number(yieldAmount).toFixed(2)), price: Number(unitPrice.toFixed(2)), isPrep: true, imageUrl: prep.imageUrl || null });
        await logInventoryMovement(newRef.id, prep.name, 'IN', Number(yieldAmount), prep.unit, Number(unitPrice.toFixed(2)), 'Приготовано');
      }
      handleBack(); showToast("Заготівлю додано на склад!");
    } catch (err) { showToast("Помилка!"); }
    setIsLoading(false);
  };

  const handleSaveRecipeWithImage = async (data, file, type) => {
     setIsLoading(true); setLoadingStep("Збереження...");
     try { 
       let imgUrl = null; 
       if(file) imgUrl = await compressImage(file); 
       await addDoc(collection(db, 'bakery', 'main', type==='recipe'?'recipes':'preps'), { ...data, imageUrl: imgUrl, ingredients:[], fillings:[] }); 
       handleBack(); showToast("Збережено!"); 
     } catch(e) { showToast("Помилка"); }
     setIsLoading(false);
  }

  const handleSaveCategory = async (categoryId, oldName, newName, icon, file) => {
    if (!user) return;
    setIsLoading(true); setLoadingStep("Збереження папки...");
    try {
      let imageUrl = null; if (file) { imageUrl = await compressImage(file); }
      if (categoryId) {
         const updateData = { name: newName, icon }; if (imageUrl) updateData.imageUrl = imageUrl;
         await updateDoc(doc(db, 'bakery', 'main', 'categories', categoryId), updateData);
      } else {
         const addData = { name: newName, icon }; if (imageUrl) addData.imageUrl = imageUrl;
         await addDoc(collection(db, 'bakery', 'main', 'categories'), addData);
      }
      if (oldName && oldName !== newName) {
         const recipesToUpdate = recipes.filter(r => (r.category || 'Інше') === oldName);
         for (const r of recipesToUpdate) await updateDoc(doc(db, 'bakery', 'main', 'recipes', r.id), { category: newName });
      }
      showToast("Папку збережено!");
    } catch (err) { showToast("Помилка: " + err.message); }
    setIsLoading(false);
  };

  const handleDeleteCategory = async (categoryId, catName) => {
    setIsLoading(true); setLoadingStep("Видалення папки...");
    try {
      if (categoryId) await deleteDoc(doc(db, 'bakery', 'main', 'categories', categoryId));
      const recipesToUpdate = recipes.filter(r => (r.category || 'Інше') === catName);
      for (const r of recipesToUpdate) await updateDoc(doc(db, 'bakery', 'main', 'recipes', r.id), { category: 'Інше' });
      showToast("Папку видалено!");
    } catch(err) { showToast("Помилка видалення!"); }
    setIsLoading(false);
  };

  if (isLoading) return <div className="fixed inset-0 bg-[#151212] flex flex-col items-center justify-center text-[#F4EFEA] z-50"><Loader className="animate-spin mb-5 text-[#D4AF37]" size={48} /><p className="text-[#8C7A7A] font-medium tracking-widest uppercase text-sm">{loadingStep}</p></div>;
  if (errorMsg) return <div className="fixed inset-0 bg-[#151212] flex items-center justify-center p-6 z-50"><div className="bg-[#1E1919] border border-[#2A2323] p-8 rounded-[32px] max-w-sm w-full text-center"><AlertCircle className="text-red-500 mx-auto mb-5" size={60} /><h2 className="text-[#F4EFEA] text-xl font-bold mb-3">Помилка</h2><p className="text-[#8C7A7A]">{errorMsg}</p></div></div>;

  let headerTitle = 'Продажі'; 
  if (activeTab === 'recipes') headerTitle = selectedCategory || 'Меню'; 
  if (activeTab === 'inventory') headerTitle = 'Склад'; 
  if (activeTab === 'preps') headerTitle = 'Заготівлі'; 
  if (activeTab === 'analytics') headerTitle = 'Аналітика'; 
  if (activeTab === 'customers') headerTitle = 'База клієнтів';
  if (activeTab === 'help') headerTitle = 'Довідник';
  if (selectedItem) headerTitle = selectedItem.name; 
  if (isAddingNew) headerTitle = 'Новий запис'; 
  if (editingOrder) headerTitle = 'Редагування'; 
  if (showInvoicePreview) headerTitle = 'Накладна'; 
  if (showShoppingListPreview) headerTitle = 'Список покупок';
  
  const upcomingOrders = sales.filter(s => s.status === 'planned');

// --- ЛОГІКА ДОСТУПУ (РОУТИНГ ТА ПІН-КОД) ---
  const isStorefront = window.location.hash === '#menu';
  
  if (isStorefront) {
    return <Storefront recipes={recipes} />;
  }

  if (!isAuthenticated) {
    return (
      <PinScreen onUnlock={() => {
        setIsAuthenticated(true);
        localStorage.setItem('adminUnlocked', 'true');
      }} />
    );
  }
  // --- КІНЕЦЬ ЛОГІКИ ДОСТУПУ ---

  return (
    <div className="fixed inset-0 bg-[#000000] flex justify-center sm:items-center sm:py-8 z-50 overflow-hidden font-sans"
         style={{ WebkitOverflowScrolling: 'touch' }}>
<style>{`
        * { 
          -webkit-tap-highlight-color: transparent !important; 
          -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
          -webkit-touch-callout: none !important;
          outline: none !important;
        }
        /* Вбиваємо синю рамку на Android та iOS для всіх станів */
        *:focus, *:active, *:focus-visible { 
          outline: none !important; 
          box-shadow: none !important; 
          -webkit-tap-highlight-color: transparent !important;
        }
        /* Скидаємо стандартний вигляд кнопок */
        button, a {
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        button:active, 
        [role="button"]:active,
        .clickable:active {
          opacity: 0.7;
          transform: scale(0.98);
          transition: all 0.1s ease;
        }
        /* Виправлення автозуму на iOS */
        input, select, textarea {
          font-size: 16px !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #2A2323; border-radius: 10px; } 
        ::selection { background: #D4AF37; color: #151212; }
      `}</style>
      
      <div className="w-full max-w-[420px] bg-[#151212] h-full sm:h-[850px] sm:rounded-[48px] sm:border-[8px] border-[#2A2323] flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#151212]/95 backdrop-blur-xl sticky top-0 z-30 border-b border-[#2A2323]">
          <div className="flex items-center gap-3 overflow-hidden">
            {selectedItem || isAddingNew || editingOrder || showInvoicePreview || showShoppingListPreview || (activeTab === 'recipes' && selectedCategory) ? (
              <button onClick={handleBack} className="text-[#D4AF37] p-1 -ml-1"><ChevronLeft size={28} /></button>
            ) : (
              <button onClick={() => setIsDrawerOpen(true)} className="text-[#8C7A7A] p-1 -ml-1"><Menu size={28} /></button>
            )}
            <h1 className="text-[#F4EFEA] text-xl font-bold truncate tracking-tight">{headerTitle}</h1>
          </div>
          
          {(!selectedItem && !isAddingNew && !editingOrder && !showInvoicePreview && !showShoppingListPreview && activeTab !== 'analytics' && activeTab !== 'help') && (
            <div className="flex gap-2">
              {activeTab === 'sales' && !invoiceMode && <button onClick={() => setInvoiceMode(true)} className="text-[#8C7A7A] p-2 bg-[#1E1919] rounded-xl border border-[#2A2323]"><Receipt size={20} /></button>}
              {activeTab === 'sales' && invoiceMode && <button onClick={() => { setInvoiceMode(false); setSelectedForInvoice([]); }} className="text-red-400 p-2 bg-[#1E1919] rounded-xl border border-[#2A2323]"><X size={20} /></button>}
              {activeTab === 'inventory' && <button onClick={() => setShowShoppingListPreview(true)} className="text-[#D4AF37] p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl"><ClipboardList size={20} /></button>}
              {!invoiceMode && (!selectedCategory && activeTab === 'recipes' ? null : <button onClick={() => {setIsAddingNew(true); setInvoiceMode(false);}} className="bg-[#D4AF37] text-[#151212] p-2 rounded-xl shadow-lg shadow-[#D4AF37]/20 active:scale-95"><Plus size={20} strokeWidth={2.5} /></button>)}
            </div>
          )}
        </div>

        {/* DRAWER MENU */}
        {isDrawerOpen && (
          <div className="absolute inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
            <div className="w-[75%] max-w-[300px] bg-[#1E1919] h-full relative flex flex-col shadow-2xl border-r border-[#2A2323] animate-in slide-in-from-left duration-200">
              <div className="p-6 border-b border-[#2A2323]">
                <h2 className="text-2xl font-black text-[#F4EFEA] tracking-widest uppercase">Mmalinka<span className="text-[#D4AF37]">.Cake</span></h2>
                <p className="text-[#8C7A7A] text-xs mt-1 font-medium tracking-widest uppercase">Premium Bakery</p>
              </div>
              <div className="flex flex-col py-4 flex-1">
                <DrawerBtn icon={<ShoppingCart size={20}/>} label="Замовлення" active={activeTab==='sales'} onClick={() => changeMainTab('sales')}/>
                <DrawerBtn icon={<Book size={20}/>} label="Каталог десертів" active={activeTab==='recipes'} onClick={() => changeMainTab('recipes')}/>
                <DrawerBtn icon={<Utensils size={20}/>} label="Заготівлі" active={activeTab==='preps'} onClick={() => changeMainTab('preps')}/>
                <DrawerBtn icon={<Package size={20}/>} label="Склад інгредієнтів" active={activeTab==='inventory'} onClick={() => changeMainTab('inventory')}/>
                <DrawerBtn icon={<Users size={20}/>} label="База клієнтів (CRM)" active={activeTab==='customers'} onClick={() => changeMainTab('customers')}/>
                <DrawerBtn icon={<BarChart2 size={20}/>} label="Аналітика та CRM" active={activeTab==='analytics'} onClick={() => changeMainTab('analytics')}/>
              </div>
            </div>
          </div>
        )}

        {/* НАГАДУВАННЯ */}
        {!selectedItem && !isAddingNew && !editingOrder && !showInvoicePreview && !showShoppingListPreview && activeTab === 'sales' && upcomingOrders.length > 0 && (
           <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-4 py-3 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="bg-[#D4AF37]/20 p-2 rounded-full"><Clock size={16} className="text-[#D4AF37]"/></div>
               <div><p className="text-[#F4EFEA] font-bold text-sm">Активні замовлення</p><p className="text-[#8C7A7A] text-xs">В роботі: {upcomingOrders.length}</p></div>
             </div>
             <button onClick={() => setShowShoppingListPreview(true)} className="text-[10px] uppercase tracking-widest bg-[#D4AF37] text-[#151212] px-3 py-1.5 rounded-lg font-bold shadow-md shadow-[#D4AF37]/20">Що купити?</button>
           </div>
        )}

        {/* CONTENT AREA */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#151212] custom-scrollbar scroll-smooth relative">
          {showInvoicePreview ? (
            <InvoicePreview sales={sales.filter(s => selectedForInvoice.includes(s.id))} recipes={recipes} />
          ) : showShoppingListPreview ? (
            <ShoppingListPreview inventory={inventory} sales={sales} recipes={recipes} preps={preps} />
          ) : (isAddingNew || editingOrder) ? (
            activeTab === 'sales' ? <AddOrderForm recipes={recipes} inventory={inventory} preps={preps} onSave={handleSaveOrder} customers={customers} initialData={editingOrder} /> : 
            activeTab === 'inventory' ? <AddInventoryForm onSave={async (d, f) => { 
                setIsLoading(true); setLoadingStep("Збереження...");
                try {
                    let imgUrl = null; 
                    if(f) imgUrl = await compressImage(f); 
                    const nRef = await addDoc(collection(db, 'bakery', 'main', 'inventory'), { ...d, imageUrl: imgUrl }); 
                    await logInventoryMovement(nRef.id, d.name, 'IN', d.quantity, d.unit, d.price, 'Початкове внесення');
                    handleBack(); showToast("Матеріал додано"); 
                } catch(e) { showToast("Помилка"); }
                setIsLoading(false);
            }} /> :
            activeTab === 'customers' ? <AddCustomerForm onSave={async (d) => { 
                setIsLoading(true); setLoadingStep("Збереження...");
                try { await addDoc(collection(db, 'bakery', 'main', 'customers'), { ...d, orderCount: 0, totalSpent: 0 }); handleBack(); showToast("Клієнта додано!"); } 
                catch(e) { showToast("Помилка"); } setIsLoading(false);
            }} /> :
            activeTab === 'recipes' ? <AddRecipeForm onSave={(d,f) => handleSaveRecipeWithImage(d,f,'recipe')} type="recipe" initialCategory={selectedCategory} allCategories={availableCategoriesList} /> : 
            activeTab === 'preps' ? <AddRecipeForm onSave={(d,f) => handleSaveRecipeWithImage(d,f,'prep')} type="prep" /> : null
          ) : selectedItem ? (
            activeTab === 'inventory' ? <InventoryDetail item={selectedItem} onUpdate={(d) => handleUpdateSelectedItem('inventory', selectedItem.id, d)} onDelete={() => handleDeleteDoc('inventory', selectedItem.id, "Видалити матеріал?")} onWaste={handleWasteInventory} askConfirm={askConfirm} askPrompt={askPrompt} showToast={showToast} logs={inventoryLogs} logMovement={logInventoryMovement} /> :
            activeTab === 'customers' ? <CustomerDetail item={selectedItem} onUpdate={(d) => handleUpdateSelectedItem('customers', selectedItem.id, d)} onDelete={() => handleDeleteDoc('customers', selectedItem.id, "Видалити клієнта?")} askPrompt={askPrompt} sales={sales} /> :
            activeTab === 'recipes' ? <RecipeDetail item={selectedItem} type="recipes" inventory={inventory} preps={preps} costFn={calculateCost} compressImage={compressImage} onUpdate={(d) => handleUpdateSelectedItem('recipes', selectedItem.id, d)} onDelete={() => handleDeleteDoc('recipes', selectedItem.id, "Видалити рецепт?")} askConfirm={askConfirm} askPrompt={askPrompt} allCategories={availableCategoriesList} /> : 
            activeTab === 'preps' ? <RecipeDetail item={selectedItem} type="preps" inventory={inventory} preps={preps} costFn={calculateCost} compressImage={compressImage} onUpdate={(d) => handleUpdateSelectedItem('preps', selectedItem.id, d)} onDelete={() => handleDeleteDoc('preps', selectedItem.id, "Видалити заготівлю?")} onCook={handleCookPrep} askConfirm={askConfirm} askPrompt={askPrompt} /> : null
            ) : (
            <div className="pt-4">
              {activeTab === 'sales' && <OrdersList sales={sales} recipes={recipes} costFn={calculateCost} onDelete={(id) => handleDeleteDoc('sales', id, "Видалити замовлення?")} onComplete={handleCompleteOrder} invoiceMode={invoiceMode} selectedForInvoice={selectedForInvoice} toggleSelection={(id) => setSelectedForInvoice(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id])} onEditOrder={setEditingOrder} />}
              {activeTab === 'customers' && <CustomersList customers={customers} sales={sales} onClick={setSelectedItem} />}
              {activeTab === 'recipes' && !selectedCategory && <RecipeCategories recipes={recipes} dbCategories={categories} allUniqueNames={availableCategoriesList} onSelectCategory={setSelectedCategory} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} askConfirm={askConfirm} />}
              {activeTab === 'recipes' && selectedCategory && <List items={recipes.filter(r => (r.category || 'Інше') === selectedCategory)} costFn={calculateCost} onClick={setSelectedItem} emptyTxt={`В папці порожньо`} showThumb={true} />}
              {activeTab === 'preps' && <List items={preps} costFn={calculateCost} onClick={setSelectedItem} emptyTxt="Немає заготівель." showThumb={true} />}
             {activeTab === 'inventory' && (
                <div className="pt-2">
                  <div className="flex bg-[#1E1919] mx-4 rounded-[20px] p-1.5 mb-2 shadow-sm border border-[#2A2323]">
                    <button onClick={() => setInventoryMode('list')} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-xl transition-all ${inventoryMode === 'list' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>Залишки</button>
                    <button onClick={() => setInventoryMode('history')} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-xl transition-all ${inventoryMode === 'history' ? 'bg-[#151212] text-[#F4EFEA] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>Історія руху</button>
                  </div>
                  {inventoryMode === 'list' ? (
                    <InventoryList inventory={inventory} onClick={setSelectedItem} />
                  ) : (
                    <InventoryHistory historyLogs={inventoryLogs.map(log => ({
                      id: log.id,
                      itemName: log.invName,
                      type: log.type === 'IN' ? 'add' : log.type === 'WASTE' ? 'waste' : (log.reason || '').includes('Ревізія') ? 'edit' : 'usage',
                      change: log.type === 'IN' ? log.amount : -log.amount,
                      unit: log.unit,
                      reason: log.reason,
                      date: new Date(log.timestamp).toISOString()
                    }))} />
                  )}
                </div>
              )}
              {activeTab === 'analytics' && <Analytics sales={sales} recipes={recipes} inventory={inventory} costFn={calculateCost} customers={customers} waste={waste} onCustomerClick={(custName) => {
                  const foundCust = customers.find(c => (c.name || '').toLowerCase().trim() === (custName || '').toLowerCase().trim());
                  if (foundCust) {
                      setActiveTab('customers');
                      setSelectedItem(foundCust);
                  } else {
                      alert("Цього клієнта ще немає в базі CRM");
                  }
              }} />}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS FOR INVOICE MODE */}
        {activeTab === 'sales' && invoiceMode && !showInvoicePreview && selectedForInvoice.length > 0 && (
          <div className="absolute bottom-[90px] w-full px-4 z-20">
             <button 
               onClick={() => setShowInvoicePreview(true)} 
               className="w-full bg-[#D4AF37] text-[#151212] font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 outline-none focus:outline-none select-none"
               style={{ WebkitTapHighlightColor: 'transparent' }}
             >
               <Receipt size={20}/> Сформувати чек ({selectedForInvoice.length})
             </button>
          </div>
        )}

        {/* BOTTOM TAB BAR */}
        {(!selectedItem && !isAddingNew && !editingOrder && !showInvoicePreview && !showShoppingListPreview) && (
          <div className="bg-[#151212]/95 backdrop-blur-xl border-t border-[#2A2323] flex justify-around px-2 py-2 pb-6 absolute bottom-0 w-full z-10">
            <TabButton icon={<ShoppingCart size={24} />} label="Замовлення" active={activeTab === 'sales'} onClick={() => changeMainTab('sales')} />
            <TabButton icon={<Book size={24} />} label="Меню" active={activeTab === 'recipes'} onClick={() => changeMainTab('recipes')} />
            <TabButton icon={<Package size={24} />} label="Склад" active={activeTab === 'inventory'} onClick={() => changeMainTab('inventory')} />
          </div>
        )}
        
        {/* CUSTOM MODALS & TOASTS */}
        <CustomPrompt config={promptDialog} onClose={() => setPromptDialog(null)} />

        {confirmDialog && (
          <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-5 animate-in fade-in duration-200">
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
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#151212] px-6 py-3 rounded-full font-bold text-sm shadow-xl shadow-black/50 z-[110] animate-in slide-in-from-bottom-5 fade-in duration-300">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

// --- НОВИЙ ВІДЖЕТ: КАСТОМНЕ ВІКНО ВВОДУ (ЗАМІНА window.prompt) ---
function CustomPrompt({ config, onClose }) {
  const [values, setValues] = useState({});
  
  useEffect(() => {
    if (config) {
      setValues(config.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue || '' }), {}));
    }
  }, [config]);

  if (!config) return null;

  const handleSubmit = () => {
    config.onSave(values);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-5 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-[#1E1919] border border-[#2A2323] p-6 rounded-[32px] w-full max-w-sm shadow-2xl">
        <h3 className="text-[#F4EFEA] font-bold text-xl mb-6">{config.title}</h3>
        {config.fields.map((f, i) => (
          <div key={f.name} className="mb-4">
            <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">{f.label}</label>
            {f.type === 'select' ? (
              <select value={values[f.name] || ''} onChange={e => setValues({...values, [f.name]: e.target.value})} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-medium appearance-none">
                <option value="">Оберіть...</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input 
                type={f.type || 'text'} 
                inputMode={f.type === 'number' ? 'decimal' : 'text'}
                value={values[f.name] || ''} 
                onChange={e => setValues({...values, [f.name]: e.target.value})} 
                placeholder={f.placeholder}
                className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-medium transition-colors"
                autoFocus={i === 0}
              />
            )}
          </div>
        ))}
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} className="flex-1 bg-[#D4AF37] text-[#151212] font-bold py-3.5 rounded-xl shadow-lg shadow-[#D4AF37]/20 active:scale-95">Зберегти</button>
          <button onClick={onClose} className="flex-1 bg-[#151212] text-[#F4EFEA] border border-[#2A2323] font-bold py-3.5 rounded-xl active:scale-95">Скасувати</button>
        </div>
      </div>
    </div>
  );
}

// --- UI ВІДЖЕТИ ---
function DrawerBtn({ icon, label, active, onClick }) { 
  return (
    <div 
      onClick={onClick} 
      className={`flex items-center gap-4 px-6 py-4 transition-colors w-full text-left cursor-pointer select-none active:opacity-70 ${active ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-r-4 border-[#D4AF37]' : 'text-[#8C7A7A] hover:bg-[#1E1919] hover:text-[#F4EFEA] border-r-4 border-transparent'}`}
      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      {icon}
      <span className="font-bold text-sm tracking-wide">{label}</span>
    </div>
  ); 
}

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

// --- КАТЕГОРІЇ (ПАПКИ) ---
function RecipeCategories({ recipes, dbCategories, allUniqueNames, onSelectCategory, onSaveCategory, onDeleteCategory, askConfirm }) {
  const [isEditingMode, setIsEditingMode] = useState(false); 
  const [editingCat, setEditingCat] = useState(null);
  
  const enrichedCategories = allUniqueNames.map(name => { 
    const dbCat = dbCategories.find(c => c.name === name); 
    return { name, id: dbCat?.id || null, imageUrl: dbCat?.imageUrl || null, icon: dbCat?.icon || null }; 
  });
  
  if (editingCat) return <CategoryForm cat={editingCat} onSave={(...args) => { onSaveCategory(...args); setEditingCat(null); }} onCancel={() => setEditingCat(null)} onDelete={(id, name) => { askConfirm("Видалити папку?", "Всі десерти з неї перемістяться в папку 'Інше'", ()=>{onDeleteCategory(id, name); setEditingCat(null)}); }} />;
  
  return (
    <div className="p-4 pb-28">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-[#F4EFEA] font-bold text-xl tracking-wide">Колекції</h2>
        <div className="flex gap-2">
          <button onClick={() => setEditingCat({name: '', icon: ''})} className="text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">+ Нова</button>
          <button onClick={() => setIsEditingMode(!isEditingMode)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 ${isEditingMode ? 'bg-[#5B7A5A]/20 text-[#5B7A5A] border border-[#5B7A5A]/30' : 'bg-[#1E1919] text-[#8C7A7A] border border-[#2A2323]'}`}>{isEditingMode ? 'Готово' : 'Налашт.'}</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {enrichedCategories.map(cat => { 
          const count = recipes.filter(r => (r?.category || 'Інше') === cat.name).length; 
          const hasImage = !!cat.imageUrl; 
          return (
            <div key={cat.name} onClick={() => isEditingMode ? setEditingCat(cat) : onSelectCategory(cat.name)} className="relative rounded-[28px] overflow-hidden shadow-lg shadow-black/40 h-32 cursor-pointer active:scale-95 transition-transform group border border-[#2A2323]">
              {hasImage ? (<div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cat.imageUrl})` }}><div className="absolute inset-0 bg-[#151212]/70 group-hover:bg-[#151212]/50 transition-colors"></div></div>) : (<div className="absolute inset-0 bg-[#1E1919] group-hover:bg-[#2A2323] transition-colors"></div>)}
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 text-center">
                {cat.icon ? (<span className="text-3xl mb-2 drop-shadow-md">{cat.icon}</span>) : (<Folder size={30} className={`${count > 0 ? (hasImage ? 'text-[#F4EFEA]' : 'text-[#D4AF37]') : 'text-[#8C7A7A]'} mb-2 opacity-90`} strokeWidth={1.5} />)}
                <h3 className="text-[#F4EFEA] font-bold text-sm leading-tight mb-1 drop-shadow-md">{cat.name}</h3>
                <p className="text-[#8C7A7A] text-[9px] uppercase tracking-widest font-bold">{count} шт</p>
              </div>
              {isEditingMode && (<div className="absolute top-2 right-2 bg-[#151212]/80 p-1.5 rounded-full backdrop-blur-sm z-20 border border-[#8C7A7A]"><Edit2 size={12} className="text-[#D4AF37]"/></div>)}
            </div>
          ); 
        })}
      </div>
    </div>
  )
}

function CategoryForm({ cat, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(cat.name || ''); const [icon, setIcon] = useState(cat.icon || ''); const [file, setFile] = useState(null); const [preview, setPreview] = useState(cat.imageUrl || null);
  const handleFileChange = (e) => { const s = e.target.files[0]; if(s){setFile(s);setPreview(URL.createObjectURL(s));} };
  return (
    <div className="p-4">
      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg shadow-black/40">
        <h2 className="text-[#F4EFEA] font-bold text-xl mb-6 tracking-wide">{cat.name ? 'Налаштування' : 'Нова папка'}</h2>
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Назва</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-2xl mb-5 outline-none focus:border-[#D4AF37]" placeholder="Напр: Мусові торти"/>
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Іконка (Емодзі)</label>
        <input value={icon} onChange={e=>setIcon(e.target.value)} placeholder="🍰" className="w-20 bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-2xl mb-5 outline-none text-2xl text-center" maxLength={2} />
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Фонове фото</label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="cat-photo" />
        <label htmlFor="cat-photo" className="w-full border-2 border-dashed border-[#2A2323] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] bg-[#151212] mb-8 h-40 bg-cover bg-center relative overflow-hidden">
          {preview && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: `url(${preview})`}}></div>}
          <Camera size={32} className="mb-2 text-[#8C7A7A] relative z-10"/>
          <span className="text-sm font-medium text-[#8C7A7A] relative z-10">{preview ? 'Змінити' : 'Завантажити'}</span>
        </label>
        <div className="flex flex-col gap-3">
          <button onClick={() => onSave(cat.id, cat.name, name, icon, file)} disabled={!name} className="w-full bg-[#D4AF37] text-[#151212] font-bold py-4 rounded-2xl">Зберегти</button>
          {cat.name && <button onClick={onDelete} className="w-full bg-[#151212] text-red-400 border border-[#2A2323] font-bold py-4 rounded-2xl">Видалити</button>}
          <button onClick={onCancel} className="w-full bg-[#151212] text-[#F4EFEA] border border-[#2A2323] font-bold py-4 rounded-2xl">Скасувати</button>
        </div>
      </div>
    </div>
  )
}

// --- СПИСКИ (МЕНЮ / СКЛАД) ---
function List({ items, costFn, onClick, emptyTxt, showPrice, showThumb }) {
  const [searchTerm, setSearchTerm] = useState(''); 
  const filteredItems = items.filter(i => (i?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  
  return (
    <div className="pb-28">
      <div className="px-4 mb-4">
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3 flex items-center gap-3 shadow-inner">
          <Search size={18} className="text-[#8C7A7A]" />
          <input type="text" placeholder="Швидкий пошук..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm" />
        </div>
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center mt-4">
          <PackageOpen size={48} className="text-[#2A2323] mb-4" />
          <p className="text-[#8C7A7A] font-medium">{emptyTxt}</p>
        </div>
      ) : (
        [...filteredItems].sort((a,b) => (a?.name || '').localeCompare(b?.name || '')).map(item => { 
          const hasFillings = item.fillings && item.fillings.length > 0; 
          const baseCost = costFn(item); 
          return (
            <div key={item.id} onClick={() => onClick(item)} className="flex items-center justify-between p-4 bg-[#1E1919] border border-[#2A2323] mb-3 mx-4 rounded-3xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-black/20">
              <div className="flex flex-1 items-center gap-4">
                {showThumb && (
                  <div className="w-14 h-14 rounded-2xl bg-[#151212] border border-[#2A2323] shrink-0 bg-cover bg-center flex items-center justify-center" style={{backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none'}}>
                    {!item.imageUrl && <Utensils size={20} className="text-[#2A2323]"/>}
                  </div>
                )}
                <div className="pr-2">
                  <h3 className="text-[#F4EFEA] font-semibold text-[17px] tracking-tight leading-tight mb-1">{item.name}</h3>
                  {showPrice && item.defaultPrice > 0 && <p className="text-[#D4AF37] text-sm font-bold">Прайс: {item.defaultPrice} ₴ / {item.baseYield || 1}{item.unit || 'шт'}</p>}
                  {hasFillings && <p className="text-[#D4AF37]/70 text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-widest"><Layers size={10}/> {item.fillings.length} варіантів</p>}
                </div>
              </div>
              <div className="text-right shrink-0 bg-[#151212] px-3 py-2 rounded-xl border border-[#2A2323]">
                <p className="text-[#8C7A7A] text-[8px] uppercase font-bold tracking-widest">Собівартість</p>
                <p className="text-[#F4EFEA] font-bold text-sm">{baseCost.toFixed(2)} ₴</p>
              </div>
            </div>
          ) 
        })
      )}
    </div>
  );
}

function InventoryList({ inventory, onClick }) {
  const [searchTerm, setSearchTerm] = useState(''); 
  const filteredInventory = inventory.filter(i => (i?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  
  return (
    <div className="pb-28">
      <div className="px-4 mb-4">
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3 flex items-center gap-3 shadow-inner">
          <Search size={18} className="text-[#8C7A7A]" />
          <input type="text" placeholder="Пошук матеріалу..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm" />
        </div>
      </div>
      
      {filteredInventory.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center mt-4">
          <PackageOpen size={48} className="text-[#2A2323] mb-4" />
          <p className="text-[#8C7A7A] font-medium">Нічого не знайдено.</p>
        </div>
      ) : (
        [...filteredInventory].sort((a,b) => (a?.name || '').localeCompare(b?.name || '')).map(item => (
          <div key={item.id} onClick={() => onClick(item)} className="flex items-center justify-between p-4 bg-[#1E1919] border border-[#2A2323] mb-3 mx-4 rounded-3xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-black/20 relative overflow-hidden">
            {item.isPrep && <div className="absolute top-0 right-0 bg-[#D4AF37]/20 text-[#D4AF37] text-[8px] uppercase font-bold px-3 py-1 rounded-bl-xl">Заготівля</div>}
            {!item.isPrep && item.isMix && <div className="absolute top-0 right-0 bg-[#2AABEE]/20 text-[#2AABEE] text-[8px] uppercase font-bold px-3 py-1 rounded-bl-xl">Мікс (Кошик)</div>}
            
            <div className="flex items-center gap-4 flex-1">
               <div className="w-14 h-14 rounded-2xl bg-[#151212] border border-[#2A2323] shrink-0 bg-cover bg-center flex items-center justify-center shadow-inner" style={{backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none'}}>
                  {!item.imageUrl && <Package size={20} className="text-[#2A2323]"/>}
               </div>
               <div className="flex-1 pr-2">
                 <h3 className="text-[#F4EFEA] font-bold text-[16px] leading-tight tracking-tight mb-1">{item.name}</h3>
                 <p className="text-[#8C7A7A] text-[11px] font-bold uppercase tracking-widest">{Number(item.price).toFixed(2)} ₴ / 1 {item.unit}</p>
               </div>
            </div>

            <div className="text-right flex items-center gap-3 shrink-0">
              <div className="text-right">
                 <p className={item.quantity <= 0 ? "text-red-400 font-black text-2xl" : "text-[#D4AF37] font-black text-2xl"}>{item.quantity}</p>
                 <p className="text-[#8C7A7A] text-[9px] uppercase font-bold tracking-widest">{item.unit}</p>
              </div>
              <ChevronRight size={20} className="text-[#8C7A7A]" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// --- ДЕТАЛІЗАЦІЯ СКЛАДУ ТА ФОРМИ ---
function InventoryDetail({ item, onUpdate, onDelete, onWaste, askConfirm, askPrompt, showToast, logs, logMovement }) {
  const [amount, setAmount] = useState('');
  const [addedCost, setAddedCost] = useState('');
  const [auditAmount, setAuditAmount] = useState('');
  const [compName, setCompName] = useState(''); 

  if (!item) return null;

  const quantity = Number(item.quantity) || 0;
  const price = Number(item.price) || 0;
  const unit = item.unit || 'г';
  const name = item.name || 'Без назви';
  const isMix = item.isMix || false;
  const mixItems = item.mixItems || [];

  const calculateProportionalMix = (invItem, newTotalQty) => {
      if (!invItem.isMix || !invItem.mixItems) return { mixItems: invItem.mixItems || [], price: invItem.price };
      if (newTotalQty <= 0) return { mixItems: [], price: 0 };
      const proportion = newTotalQty / (invItem.quantity || 1);
      const newMixItems = invItem.mixItems.map(mi => ({...mi, quantity: Number((mi.quantity * proportion).toFixed(2)), cost: Number((mi.cost * proportion).toFixed(2))})).filter(mi => mi.quantity > 0.01);
      const tQ = newMixItems.reduce((s,i)=>s+i.quantity,0);
      const tC = newMixItems.reduce((s,i)=>s+i.cost,0);
      const newPrice = tQ > 0 ? Number((tC/tQ).toFixed(2)) : invItem.price;
      return { mixItems: newMixItems, price: newPrice };
  };

  const handleAdd = () => {
    const addedQty = Number(amount);
    if (addedQty <= 0) return;
    
    const newQty = Number(Math.max(0, quantity + addedQty).toFixed(2));
    let updatePayload = { quantity: newQty };
    let movementReason = 'Поповнення';

    if (isMix) {
       if (!compName) { showToast("Введіть назву фрукта/компонента!"); return; }
       const addedC = Number(addedCost) || 0;
       const newMixItem = { id: Date.now().toString(), name: compName, quantity: addedQty, cost: addedC };
       const newMixItems = [...mixItems, newMixItem];
       
       const tQ = newMixItems.reduce((s,i)=>s+i.quantity,0);
       const tC = newMixItems.reduce((s,i)=>s+i.cost,0);
       const newAvgPrice = tQ > 0 ? (tC/tQ) : 0;
       
       updatePayload = { quantity: Number(tQ.toFixed(2)), price: Number(newAvgPrice.toFixed(2)), mixItems: newMixItems };
       movementReason = `Додано в мікс: ${compName}`;
       setCompName('');
    } else {
       let newAvgPrice = price;
       if (addedCost && Number(addedCost) > 0) {
          const totalOldValue = quantity * price;
          const totalNewValue = Number(addedCost);
          newAvgPrice = (totalOldValue + totalNewValue) / newQty;
       }
       updatePayload.price = Number(newAvgPrice.toFixed(2));
    }

    onUpdate(updatePayload);
    logMovement(item.id, name, 'IN', addedQty, unit, updatePayload.price || price, movementReason);
    setAmount('');
    setAddedCost('');
  };

  const handleSubtract = () => {
    const deductQty = Number(amount);
    if (deductQty <= 0) return;
    const newQty = Number(Math.max(0, quantity - deductQty).toFixed(2));
    
    let updatePayload = { quantity: newQty };
    if (isMix) {
        const mixData = calculateProportionalMix(item, newQty);
        updatePayload = { ...updatePayload, mixItems: mixData.mixItems, price: mixData.price };
    }

    onUpdate(updatePayload); 
    logMovement(item.id, name, 'OUT', deductQty, unit, price, 'Списання вручну');
    setAmount('');
    setAddedCost('');
  };

  const handleWasteAction = () => {
    const wasteQty = Number(amount);
    if (wasteQty <= 0) return;
    askConfirm("Списання браку", `Списати ${wasteQty} ${unit} в брак? Сума збитків: ${(wasteQty * price).toFixed(2)} ₴. Це відобразиться в аналітиці.`, () => {
       onWaste(item, wasteQty);
       setAmount('');
       setAddedCost('');
    });
  };

  const handleAudit = () => {
    if (auditAmount === '') return;
    const actualQty = Number(auditAmount);
    const diff = Number((actualQty - quantity).toFixed(2));
    
    if (diff === 0) {
       showToast("Кількість збігається!");
       setAuditAmount('');
       return;
    }

    const type = diff > 0 ? 'IN' : 'OUT';
    const reason = diff > 0 ? 'Ревізія (Надлишок)' : 'Ревізія (Нестача)';
    
    askConfirm("Підтвердження ревізії", `Система виявила ${diff > 0 ? 'надлишок' : 'нестачу'} ${Math.abs(diff)} ${unit}. Зберегти фактичний залишок ${actualQty} ${unit}?`, () => {
       let updatePayload = { quantity: actualQty };
       if (isMix) {
           const mixData = calculateProportionalMix(item, actualQty);
           updatePayload = { ...updatePayload, mixItems: mixData.mixItems, price: mixData.price };
       }

       onUpdate(updatePayload);
       logMovement(item.id, name, type, Math.abs(diff), unit, updatePayload.price || price, reason);
       setAuditAmount('');
       showToast("Залишки оновлено!");
    });
  };

  const handleImageChange = async (e) => { 
    const f = e.target.files[0]; 
    if(f){ 
        const img = await compressImage(f); 
        onUpdate({imageUrl: img}); 
    } 
  }

  const itemLogs = logs.filter(l => l.invId === item.id).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="p-4 pb-24">
      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 mb-6 shadow-lg">
        
        <div className="flex justify-between items-start mb-8 gap-2">
          <div className="flex items-center gap-4">
             <div className="relative w-16 h-16 rounded-2xl bg-[#151212] border border-[#2A2323] flex-shrink-0 bg-cover bg-center overflow-hidden shadow-inner group" style={{backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none'}}>
                {!item.imageUrl && <Camera size={24} className="text-[#2A2323] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                <input type="file" accept="image/*" id="inv-img" className="hidden" onChange={handleImageChange} />
                <label htmlFor="inv-img" className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera size={16} className="text-white"/>
                </label>
                <label htmlFor="inv-img" className="absolute bottom-1 right-1 bg-[#151212]/80 p-1 rounded-full cursor-pointer md:hidden border border-[#2A2323]">
                   <Camera size={10} className="text-[#8C7A7A]"/>
                </label>
             </div>
             <div>
               <label className="text-[#8C7A7A] text-xs uppercase font-bold tracking-widest block mb-1">Товар</label>
               <h2 className="text-2xl font-bold text-[#F4EFEA] leading-tight pr-2">
                 {name}
                 {isMix && <span className="ml-2 text-[#2AABEE] bg-[#2AABEE]/20 border border-[#2AABEE]/30 px-2 py-1 rounded-lg text-[9px] uppercase font-bold align-middle">Мікс</span>}
               </h2>
             </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button onClick={() => askPrompt("Назва матеріалу", [{name: 'val', label: 'Назва', defaultValue: name}], (res) => { if(res.val) onUpdate({name:res.val}) })} className="text-[#8C7A7A] hover:text-[#D4AF37] p-2 bg-[#151212] rounded-xl border border-[#2A2323]">
              <Edit2 size={16}/>
            </button>
            <button onClick={onDelete} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#151212] rounded-xl border border-[#2A2323]">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <label className="text-[#8C7A7A] text-xs uppercase font-bold tracking-widest block mb-2">На складі</label>
        <p className="text-[#D4AF37] text-5xl mb-8 font-black">
          {quantity} <span className="text-xl font-medium text-[#8C7A7A]">{unit}</span>
        </p>

        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block mb-2">Собівартість за 1 {unit}</label>
        <div className="flex items-center bg-[#151212] border border-[#2A2323] rounded-2xl p-4">
          <input type="number" inputMode="decimal" value={price} onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })} disabled={isMix} className={`bg-transparent text-[#F4EFEA] text-2xl font-bold w-full outline-none focus:text-[#D4AF37] transition-colors ${isMix ? 'opacity-50' : ''}`}/>
          <span className="text-[#8C7A7A] font-bold ml-3 text-lg">₴</span>
        </div>
        <p className="text-[#8C7A7A] text-[10px] mt-2 px-1">
          {isMix ? 'Ціна міксу розраховується автоматично на основі його складу.' : 'Ви можете змінити цю ціну вручну, або вона перерахується автоматично при поповненні складу нижче.'}
        </p>
      </div>

      {isMix && (
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-4">
             <Layers size={16} className="text-[#2AABEE]"/>
             <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block">Склад міксу на сьогодні</label>
          </div>
          {mixItems.length === 0 ? (
             <p className="text-[#8C7A7A] text-xs text-center py-4 font-medium border border-dashed border-[#2A2323] rounded-2xl">Кошик порожній. Додайте фрукти нижче!</p>
          ) : (
             <div className="space-y-3">
               {mixItems.map((comp, idx) => (
                 <div key={idx} className="flex justify-between items-center py-2 border-b border-[#2A2323] last:border-0">
                   <div>
                     <p className="text-[#F4EFEA] font-bold text-sm leading-tight">{comp.name}</p>
                     <p className="text-[#8C7A7A] text-[10px] mt-0.5">Витрачено: {comp.cost.toFixed(2)} ₴</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[#D4AF37] font-black text-sm">{comp.quantity} {unit}</p>
                     <p className="text-[#8C7A7A] text-[10px]">{comp.quantity > 0 ? (comp.cost/comp.quantity).toFixed(2) : 0} ₴/1{unit}</p>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      )}

      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg mb-6">
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-3 block">Надходження / Списання</label>
        
        {isMix && (
           <input type="text" placeholder="Що саме додаємо? (напр. Полуниця)" value={compName} onChange={(e) => setCompName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-bold text-sm transition-colors mb-3"/>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <input type="number" inputMode="decimal" placeholder={`Кількість (${unit})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-bold text-center text-lg transition-colors"/>
          <input type="number" inputMode="decimal" placeholder="Вартість (₴)" value={addedCost} onChange={(e) => setAddedCost(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#D4AF37] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-bold text-center text-lg transition-colors"/>
        </div>

        {Number(amount) > 0 && Number(addedCost) > 0 && (
           <div className="mb-5 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl flex justify-between items-center">
              <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">{isMix ? 'Компонент міксу:' : 'Нова партія:'}</span>
              <span className="text-[#F4EFEA] font-bold text-sm">{(Number(addedCost) / Number(amount)).toFixed(2)} ₴ <span className="text-[#8C7A7A] text-[10px]">/ 1 {unit}</span></span>
           </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleAdd} disabled={!amount || (isMix && !compName) || (isMix && !addedCost)} className="flex-1 bg-[#D4AF37] text-[#151212] shadow-lg shadow-[#D4AF37]/20 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
            Поповнити
          </button>
          <button onClick={handleSubtract} disabled={!amount} className="flex-1 bg-[#151212] text-[#F4EFEA] border border-[#2A2323] py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
            Списати
          </button>
          <button onClick={handleWasteAction} disabled={!amount} className="flex-1 bg-red-900/20 text-red-400 border border-red-500/20 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
            В брак
          </button>
        </div>
        <p className="text-center text-[#8C7A7A] text-[9px] mt-4 uppercase tracking-widest leading-relaxed">
           {isMix ? 'При поповненні введіть назву фрукта. При списанні - складники зменшаться пропорційно.' : 'При поповненні з вказаною вартістю, програма перерахує середню ціну. "В брак" зафіксує фінансові збитки.'}
        </p>
      </div>

      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg mb-6">
        <div className="flex items-center gap-2 mb-3">
           <ClipboardList size={16} className="text-[#D4AF37]"/>
           <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest block">Інвентаризація (Звірка)</label>
        </div>
        <p className="text-[#8C7A7A] text-[10px] mb-4">Введіть фактичну вагу товару, яку показують ваші ваги. Програма сама вирахує різницю.</p>
        <div className="flex gap-3">
          <input type="number" inputMode="decimal" placeholder={`Фактично (${unit})`} value={auditAmount} onChange={(e) => setAuditAmount(e.target.value)} className="w-2/3 bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] rounded-2xl p-4 outline-none font-bold text-center text-lg transition-colors"/>
          <button onClick={handleAudit} disabled={auditAmount === ''} className="w-1/3 bg-[#151212] text-[#D4AF37] border border-[#D4AF37]/30 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
            Звірити
          </button>
        </div>
      </div>

      <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg">
        <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-4 flex items-center gap-1.5"><History size={14}/> Історія руху товару</label>
        {itemLogs.length === 0 ? (
           <p className="text-[#8C7A7A] text-xs text-center py-4">Історія порожня</p>
        ) : (
           <div className="space-y-3">
             {itemLogs.map(log => (
               <div key={log.id} className="flex justify-between items-center py-2 border-b border-[#2A2323] last:border-0">
                 <div>
                   <p className="text-[#F4EFEA] font-bold text-sm leading-tight">{log.reason}</p>
                   <p className="text-[#8C7A7A] text-[10px] mt-0.5">{new Date(log.timestamp).toLocaleString('uk-UA', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                 </div>
                 <div className="text-right">
                   <p className={`font-black text-sm ${log.type === 'IN' ? 'text-[#D4AF37]' : log.type === 'WASTE' ? 'text-red-400' : 'text-[#F4EFEA]'}`}>
                     {log.type === 'IN' ? '+' : '-'}{log.amount} {log.unit}
                   </p>
                   <p className="text-[#8C7A7A] text-[10px]">{Number(log.price).toFixed(2)} ₴/{log.unit}</p>
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
}

function AddInventoryForm({ onSave }) {
  const [name, setName] = useState(''); 
  const [quantity, setQuantity] = useState(''); 
  const [totalCost, setTotalCost] = useState(''); 
  const [unit, setUnit] = useState('г');
  const [file, setFile] = useState(null); 
  const [preview, setPreview] = useState('');
  const [isMix, setIsMix] = useState(false);

  const calcPrice = (Number(quantity) > 0 && Number(totalCost) > 0) ? (Number(totalCost) / Number(quantity)) : 0;

  return (
    <div className="p-4 h-full">
       <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Назва матеріалу</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-4 outline-none font-medium transition-colors" />
          
          <label className="flex items-center gap-3 mb-6 p-4 bg-[#151212] border border-[#2A2323] rounded-2xl cursor-pointer">
            <input type="checkbox" checked={isMix} onChange={e=>setIsMix(e.target.checked)} className="w-5 h-5 accent-[#D4AF37]" />
            <span className="text-[#F4EFEA] text-sm font-bold">Це збірний мікс (наприклад, кошик фруктів)</span>
          </label>

          {!isMix && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                   <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Придбана К-ть</label>
                   <input type="number" inputMode="decimal" value={quantity} onChange={e=>setQuantity(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none" />
                </div>
                <div>
                   <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Одиниці</label>
                   <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none appearance-none">
                      <option value="г">Грами</option>
                      <option value="кг">Кілограми</option>
                      <option value="шт">Штуки</option>
                      <option value="мл">Мілілітри</option>
                   </select>
                </div>
              </div>
              
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Загальна вартість покупки (₴)</label>
              <input type="number" inputMode="decimal" value={totalCost} onChange={e=>setTotalCost(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-bold" />
              
              {calcPrice > 0 && (
                 <div className="mb-6 p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-between">
                    <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">Авто-розрахунок:</span>
                    <span className="text-[#F4EFEA] font-bold text-sm">{calcPrice.toFixed(2)} ₴ <span className="text-[#8C7A7A] font-medium text-xs">/ 1 {unit}</span></span>
                 </div>
              )}
            </>
          )}

          {isMix && (
            <div className="mb-6 p-4 bg-[#2AABEE]/10 border border-[#2AABEE]/30 rounded-2xl">
               <p className="text-[#2AABEE] text-xs leading-relaxed font-medium">Ви зможете додавати конкретні фрукти/компоненти всередину цього міксу після його збереження на склад.</p>
            </div>
          )}
          
          <div className="mb-8">
             <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Фото (необов'язково)</label>
             <input type="file" accept="image/*" onChange={e=>{const s=e.target.files[0]; if(s){setFile(s); setPreview(URL.createObjectURL(s));}}} className="hidden" id="inv-photo" />
             <label htmlFor="inv-photo" className="w-full border-2 border-dashed border-[#2A2323] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] bg-[#151212] h-24 bg-cover bg-center relative overflow-hidden">
                {preview && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: `url(${preview})`}}></div>}
                <Camera size={24} className="mb-1 text-[#8C7A7A] relative z-10"/>
                <span className="text-xs font-medium text-[#8C7A7A] relative z-10">{preview?'Змінити':'Завантажити'}</span>
             </label>
          </div>

          <button onClick={() => onSave({ name, isMix, mixItems: [], quantity: isMix ? 0 : Number(quantity), price: isMix ? 0 : Number(calcPrice.toFixed(2)), unit: isMix ? 'г' : unit }, file)} disabled={!name || (!isMix && (!totalCost || !quantity))} className="w-full bg-[#D4AF37] disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-[#D4AF37]/20 active:scale-95">Зберегти на склад</button>
       </div>
    </div>
  );
}

function OrdersList({ sales, recipes, costFn, onDelete, onComplete, invoiceMode, selectedForInvoice, toggleSelection, onEditOrder }) {
  const [filter, setFilter] = useState('planned'); 
  useEffect(() => { if(invoiceMode) setFilter('completed'); }, [invoiceMode]);
  
  const filteredSales = sales.filter(s => filter === 'completed' ? s.status !== 'planned' : s.status === 'planned');
  
  const sortedSales = [...filteredSales].sort((a,b) => { 
    if (filter === 'planned') { 
      const timeA = new Date(`${a.date || '1970-01-01'}T${a.dueTime||'00:00'}`).getTime(); 
      const timeB = new Date(`${b.date || '1970-01-01'}T${b.dueTime||'00:00'}`).getTime(); 
      return timeA - timeB; 
    } 
    return (b.createdAt || 0) - (a.createdAt || 0); 
  });

  const [swipeId, setSwipeId] = useState(null); 
  let startX = 0; let startY = 0;

  useEffect(() => { setSwipeId(null); }, [sales, filter]);
  
  const handleTouchStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
  const handleTouchEnd = (e, id, order) => { 
    const dx = e.changedTouches[0].clientX - startX; 
    const dy = Math.abs(e.changedTouches[0].clientY - startY); 
    if(filter === 'planned' && !invoiceMode && dx > 90 && dy < 40) { 
      setSwipeId(id); 
      setTimeout(() => {
         onComplete(order);
         setSwipeId(null);
      }, 300); 
    } 
  };

  return (
    <div className="pb-36">
      {!invoiceMode && (
        <div className="flex bg-[#1E1919] mx-4 rounded-[20px] p-1.5 mb-5 shadow-sm border border-[#2A2323]">
          <button onClick={() => setFilter('planned')} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-xl transition-all ${filter === 'planned' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>Активні</button>
          <button onClick={() => setFilter('completed')} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-xl transition-all ${filter === 'completed' ? 'bg-[#151212] text-[#F4EFEA] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>Історія</button>
        </div>
      )}
      
      {sortedSales.length === 0 && (
        <div className="p-8 text-center flex flex-col items-center mt-10">
          <PackageOpen size={48} className="text-[#2A2323] mb-4" />
          <p className="text-[#8C7A7A] font-medium">Список порожній.</p>
        </div>
      )}
      
      {sortedSales.map(order => { 
        const items = order.items || [{ recipeId: order.recipeId, fillingId: order.fillingId, quantity: order.quantity, sellPrice: order.sellPrice }]; 
        let tr = (order.decorPrice || 0); 
        let dynamicTc = (order.decorPrice || 0) + (order.internalCost || 0); 
        
        const itemsDisplay = items.map((item, idx) => { 
          const rec = recipes.find(r => r.id === item.recipeId); if (!rec) return null; 
          const fil = rec.fillings?.find(f => f.id === item.fillingId); 
          const dN = fil ? `${rec.name} (${fil.name})` : rec.name; 
          dynamicTc += (costFn(rec, item.fillingId) / Math.max(rec.baseYield || 1, 0.001)) * item.quantity; 
          tr += (item.sellPrice || 0); 
          
          return (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-[#2A2323] last:border-0">
              <span className="text-[#F4EFEA] text-sm pr-2 flex-1 font-medium">• {dN}</span>
              <span className="text-[#D4AF37] font-bold text-xs bg-[#151212] px-2 py-1 rounded-lg border border-[#2A2323]">{item.quantity} {rec.unit}</span>
            </div>
          ); 
        }); 
        
        const tc = order.historicalCost !== undefined ? order.historicalCost : dynamicTc;
        const profit = tr - tc; 
        const isSelected = selectedForInvoice.includes(order.id); 
        
        return (
          <div key={order.id} className="relative mb-4 mx-4">
            {filter==='planned'&&!invoiceMode && (
              <div className="absolute inset-0 bg-[#5B7A5A] rounded-[32px] flex items-center pl-8">
                <CheckCircle className="text-white" size={32}/>
              </div>
            )}
            
            <div 
              onTouchStart={handleTouchStart} 
              onTouchEnd={(e)=>handleTouchEnd(e, order.id, order)} 
              onClick={() => invoiceMode && toggleSelection(order.id)} 
              className={`p-5 rounded-[32px] shadow-lg relative transition-all duration-300 z-10 ${swipeId === order.id ? 'translate-x-[120%]' : ''} ${invoiceMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-[#1E1919] border-2 border-[#D4AF37]' : 'bg-[#1E1919] border border-[#2A2323] shadow-black/30'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-start w-full">
                  {invoiceMode && <div className="mt-1">{isSelected ? <CheckSquare className="text-[#D4AF37]" size={20}/> : <Square className="text-[#8C7A7A]" size={20}/>}</div>}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-3">
                      {filter === 'planned' ? (
                        <div className="flex items-center gap-1.5 text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl text-xs border border-[#D4AF37]/20">
                          <CalendarClock size={14} /> {order.date} {order.dueTime ? `о ${order.dueTime}` : ''}
                        </div>
                      ) : ( <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest">{order.date}</p> )}
                      
                      {!invoiceMode && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); onEditOrder(order); }} className="text-[#8C7A7A] hover:text-[#D4AF37] p-2 bg-[#151212] rounded-xl border border-[#2A2323]"><Edit2 size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(order.id); }} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#151212] rounded-xl border border-[#2A2323]"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                    
                    {order.customer && <p className="text-[#F4EFEA] font-black text-xl mb-3 tracking-tight">{order.customer}</p>}
                    
                    <div className="bg-[#151212] rounded-2xl p-4 mb-4 border border-[#2A2323]">
                      {itemsDisplay}
                      {order.decorPrice > 0 && <div className="flex justify-between py-2 text-[#8C7A7A] text-xs mt-1 border-t border-[#2A2323] pt-2 font-medium"><span>+ Декор / Коробка</span><span className="text-[#F4EFEA]">{order.decorPrice} ₴</span></div>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`grid grid-cols-3 gap-2 p-3 rounded-2xl ${isSelected ? 'bg-[#D4AF37]/5' : 'bg-[#151212]'} border border-[#2A2323]`}>
                <div className="text-center"><p className="text-[8px] uppercase font-bold text-[#8C7A7A] mb-1 tracking-widest">Заг. Чек</p><p className="text-[#D4AF37] font-bold text-base">{tr.toFixed(2)}₴</p></div>
                <div className="text-center border-l border-r border-[#2A2323]"><p className="text-[8px] uppercase font-bold text-[#8C7A7A] mb-1 tracking-widest">Витрати</p><p className="text-[#F4EFEA] font-bold text-base">{tc.toFixed(2)}₴</p></div>
                <div className="text-center"><p className="text-[8px] uppercase font-bold text-[#8C7A7A] mb-1 tracking-widest">Прибуток</p><p className="text-[#5B7A5A] font-black text-base">{profit > 0 ? '+' : ''}{profit.toFixed(2)}₴</p></div>
              </div>
              
              {filter === 'planned' && !invoiceMode && (
                <p className="text-center text-[#8C7A7A] text-[10px] mt-4 flex justify-center items-center gap-1 uppercase tracking-widest font-bold"><ChevronRight size={14}/> Свайп вправо для видачі <ChevronRight size={14}/></p>
              )}
            </div>
          </div>
        ); 
      })}
    </div>
  );
}

function AddOrderForm({ recipes, inventory, preps, onSave, customers, initialData }) {
  const [cart, setCart] = useState(initialData?.items || []); 
  const [recipeId, setRecipeId] = useState(''); 
  const [fillingId, setFillingId] = useState(''); 
  const [quantity, setQuantity] = useState('1'); 
  const [itemPrice, setItemPrice] = useState(''); 
  const [customer, setCustomer] = useState(initialData?.customer || ''); 
  const [showCusts, setShowCusts] = useState(false);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]); 
  const [dueTime, setDueTime] = useState(initialData?.dueTime || ''); 
  const [decorPrice, setDecorPrice] = useState(initialData?.decorPrice || ''); 
  const [internalCost, setInternalCost] = useState(initialData?.internalCost || ''); 
  const [status, setStatus] = useState(initialData?.status || 'planned'); 
  const [missingIngredients, setMissingIngredients] = useState([]);

  const selectedRecipe = recipes.find(r => r.id === recipeId);
  
  useEffect(() => { 
    if (selectedRecipe) { 
      if (selectedRecipe.fillings?.length > 0) { 
        if (!fillingId || !selectedRecipe.fillings.find(f => f.id === fillingId)) setFillingId(selectedRecipe.fillings[0].id); 
      } else {
        setFillingId(''); 
      }
      
      if (selectedRecipe.defaultPrice > 0) { 
        const p = (selectedRecipe.defaultPrice / Math.max(selectedRecipe.baseYield || 1, 0.001)) * Number(quantity || 1); 
        setItemPrice(Number.isInteger(p) ? p.toString() : p.toFixed(2)); 
      } 
    } 
  }, [recipeId, quantity, recipes]);
  
  useEffect(() => { 
    if (cart.length === 0 || !inventory) { setMissingIngredients([]); return; } 
    const reqMap = {}; 
    
    const processIngs = (ings, prop) => {
       (ings || []).forEach(ing => {
          if (ing.prepId) {
             const p = preps.find(pr => pr.id === ing.prepId);
             if (p) processIngs(p.ingredients, prop * (ing.amount / Math.max(p.baseYield || 1, 0.001)));
          } else if (ing.invId) {
             reqMap[ing.invId] = (reqMap[ing.invId] || 0) + (ing.amount * prop);
          }
       });
    };

    cart.forEach(item => { 
      const r = recipes.find(r => r.id === item.recipeId); if (!r) return; 
      const p = item.quantity / Math.max(r.baseYield || 1, 0.001); 
      processIngs(r.ingredients, p);
      if (item.fillingId && r.fillings) { 
        const f = r.fillings.find(f => f.id === item.fillingId); 
        if (f) processIngs(f.ingredients, p);
      } 
    }); 
    
    const miss = []; 
    Object.keys(reqMap).forEach(id => { 
      const i = inventory.find(i => i.id === id); 
      const av = i ? i.quantity : 0; 
      if (av < reqMap[id]) miss.push({ name: i ? i.name : '?', missingAmt: (reqMap[id] - av).toFixed(2), unit: i ? i.unit : '?' }); 
    }); 
    setMissingIngredients(miss); 
  }, [cart, inventory, recipes, preps]);

  const handleAddToCart = () => { 
    if (!selectedRecipe || !itemPrice) return; 
    setCart([...cart, { recipeId, fillingId, quantity: Number(quantity), sellPrice: Number(itemPrice) }]); 
    setRecipeId(''); setFillingId(''); setQuantity('1'); setItemPrice(''); 
  };
  
  const totalVal = cart.reduce((s, i) => s + i.sellPrice, 0) + Number(decorPrice || 0);
  const filteredCusts = customers.filter(c => c.name.toLowerCase().includes(customer.toLowerCase()) && customer.length > 0 && c.name !== customer);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-10">
        <div className="flex bg-[#1E1919] border border-[#2A2323] rounded-[20px] p-1.5 mb-6 shadow-sm">
          <button onClick={() => setStatus('planned')} className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-xl transition-all ${status === 'planned' ? 'bg-[#151212] text-[#D4AF37] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>На дату</button>
          <button onClick={() => setStatus('completed')} className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-xl transition-all ${status === 'completed' ? 'bg-[#151212] text-[#F4EFEA] shadow-md border border-[#2A2323]' : 'text-[#8C7A7A]'}`}>Видано</button>
        </div>
        
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 mb-5 shadow-lg shadow-black/20">
          <h3 className="text-[#F4EFEA] font-bold text-lg mb-5 flex items-center gap-2 tracking-wide"><ShoppingCart size={20} className="text-[#D4AF37]"/> Кошик</h3>
          
          {cart.length === 0 ? (
            <div className="bg-[#151212] rounded-2xl p-8 text-center border border-dashed border-[#2A2323] mb-6 flex flex-col items-center">
              <PackageOpen size={36} className="text-[#2A2323] mb-3" />
              <p className="text-[#8C7A7A] text-sm font-medium">Ваш кошик порожній.<br/>Час додати туди щось солоденьке!</p>
            </div>
          ) : (
            <div className="bg-[#151212] rounded-2xl p-4 mb-6 border border-[#2A2323]">
              {cart.map((item, idx) => { 
                const rec = recipes.find(r => r.id === item.recipeId); 
                const fil = rec?.fillings?.find(f => f.id === item.fillingId); 
                return (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-[#2A2323] last:border-0">
                    <div className="flex-1 pr-3">
                      <p className="text-[#F4EFEA] font-semibold leading-tight">{rec?.name} {fil ? <span className="text-[#8C7A7A] text-xs font-normal">({fil.name})</span> : ''}</p>
                      <p className="text-[#D4AF37] font-bold text-sm mt-1">{item.quantity} {rec?.unit} <span className="text-[#8C7A7A] font-normal mx-1">на</span> {item.sellPrice.toFixed(2)} ₴</p>
                    </div>
                    <button onClick={() => setCart(cart.filter((_,i)=>i!==idx))} className="text-[#8C7A7A] hover:text-red-400 p-2 bg-[#1E1919] border border-[#2A2323] rounded-xl"><Trash2 size={16}/></button>
                  </div>
                ) 
              })}
            </div>
          )}

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-5 mb-2">
            <label className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-3 block">Додати позицію</label>
            <select value={recipeId} onChange={e=>setRecipeId(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-xl mb-4 outline-none font-medium appearance-none">
              <option value="">Оберіть десерт...</option>
              {[...recipes].sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            
            {selectedRecipe && selectedRecipe.fillings?.length > 0 && (
              <select value={fillingId} onChange={e=>setFillingId(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-xl mb-4 outline-none font-medium appearance-none">
                {selectedRecipe.fillings.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input type="number" inputMode="decimal" placeholder="К-ть" value={quantity} onChange={e=>setQuantity(e.target.value)} min="1" className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-xl outline-none font-medium text-center" />
              <input type="number" inputMode="decimal" placeholder="Ціна ₴" value={itemPrice} onChange={e=>setItemPrice(e.target.value)} className="w-full bg-[#151212] border border-[#D4AF37]/50 text-[#D4AF37] focus:border-[#D4AF37] p-4 rounded-xl outline-none font-bold text-center" />
            </div>
            
            <button onClick={handleAddToCart} disabled={!recipeId || !itemPrice} className="w-full bg-[#151212] border border-[#D4AF37]/30 disabled:opacity-50 text-[#D4AF37] font-bold py-4 rounded-xl active:scale-95 uppercase text-xs tracking-widest">+ В кошик</button>
          </div>
        </div>
        
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg shadow-black/20 mb-6 relative">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Клієнт</label>
          <input type="text" placeholder="Ім'я" value={customer} onFocus={()=>setShowCusts(true)} onBlur={()=>setTimeout(()=>setShowCusts(false),200)} onChange={e=>setCustomer(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] focus:border-[#D4AF37] p-4 rounded-2xl mb-5 outline-none font-medium" />
          
          {showCusts && filteredCusts.length > 0 && (
            <div className="absolute left-6 right-6 top-24 bg-[#151212] border border-[#D4AF37] rounded-xl z-30 shadow-2xl overflow-hidden">
              {filteredCusts.map(c=>(
                <div key={c.id} onClick={()=>{setCustomer(c.name); setShowCusts(false)}} className="p-4 border-b border-[#2A2323] last:border-0 active:bg-[#1E1919] flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3"><Users size={16} className="text-[#D4AF37]"/><span className="text-[#F4EFEA] font-bold">{c.name}</span></div>
                  <span className="text-[#8C7A7A] text-[10px] uppercase tracking-widest">{c.orderCount} зам.</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">{status === 'completed' ? 'Дата' : 'Дата видачі'}</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-xl outline-none font-medium text-sm" />
            </div>
            {status === 'planned' && (
              <div>
                <label className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><Clock size={12}/> Час</label>
                <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-xl outline-none font-medium text-sm" />
              </div>
            )}
          </div>
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Декор для клієнта (в чек)</label>
          <input type="number" inputMode="decimal" placeholder="Сума (₴)" value={decorPrice} onChange={e=>setDecorPrice(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none font-bold mb-4" />

          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 block">Внутрішня собівартість (Фрукти/Пакування, не в чек)</label>
          <input type="number" inputMode="decimal" placeholder="Сума витрат (₴)" value={internalCost} onChange={e=>setInternalCost(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl outline-none font-bold" />
        </div>
        
        {missingIngredients.length > 0 && (
          <div className="mb-6 p-6 bg-[#151212] border border-red-900/50 rounded-[32px] shadow-lg">
            <div className="flex items-center gap-2 mb-4 text-red-400 font-bold text-sm tracking-wide"><AlertCircle size={18} /><span>Дефіцит інгредієнтів:</span></div>
            <ul className="text-[#8C7A7A] text-sm space-y-2 pl-2 mb-6">
              {missingIngredients.map((item, idx) => (
                <li key={idx} className="flex justify-between border-b border-[#2A2323] pb-1"><span>{item.name}</span><span className="font-bold text-red-400">{item.missingAmt} {item.unit}</span></li>
              ))}
            </ul>
            <button onClick={()=>window.open(`https://t.me/share/url?url=${encodeURIComponent(`🛒 *КУПИТИ* ${customer ? `(${customer})` : ''}\n` + missingIngredients.map(i=>`🔹 ${i.name} — ${i.missingAmt}${i.unit}`).join('\n'))}`, '_blank')} className="w-full bg-[#1E1919] border border-[#2A2323] text-[#F4EFEA] font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 text-sm">
              <Send size={18} className="text-[#D4AF37]"/> В Telegram
            </button>
          </div>
        )}
      </div>

      <div className="bg-[#151212]/95 backdrop-blur-md border-t border-[#2A2323] p-5 shrink-0 z-20">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-[#8C7A7A] font-bold uppercase tracking-widest text-xs">Разом:</span>
          <span className="text-[#D4AF37] text-3xl font-black">{totalVal.toFixed(2)} ₴</span>
        </div>
        <button onClick={() => onSave({ items: cart, decorPrice: Number(decorPrice), internalCost: Number(internalCost), customer, date, dueTime: status === 'planned' ? dueTime : null, status, totalPrice: totalVal }, initialData)} disabled={cart.length === 0} className={`w-full disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-bold text-lg active:scale-95 shadow-xl ${status === 'completed' ? 'bg-[#5B7A5A] shadow-[#5B7A5A]/20' : 'bg-[#D4AF37] shadow-[#D4AF37]/20'}`}>
          {initialData ? 'Зберегти зміни' : (status === 'completed' ? 'Зафіксувати продаж' : 'Зберегти замовлення')}
        </button>
      </div>
    </div>
  );
}

function ShoppingListPreview({ inventory, sales, recipes, preps }) {
  const plannedSales = sales.filter(s => s.status === 'planned'); 
  const reqMap = {}; 
  
  const processIngs = (ings, prop) => {
     (ings || []).forEach(ing => {
        if (ing.prepId) {
           const p = preps.find(pr => pr.id === ing.prepId);
           if (p) processIngs(p.ingredients, prop * (ing.amount / Math.max(p.baseYield || 1, 0.001)));
        } else if (ing.invId) {
           reqMap[ing.invId] = (reqMap[ing.invId] || 0) + (ing.amount * prop);
        }
     });
  };

  plannedSales.forEach(order => { 
    const items = order.items || [{ recipeId: order.recipeId, fillingId: order.fillingId, quantity: order.quantity }]; 
    items.forEach(item => { 
      const r = recipes.find(r => r.id === item.recipeId); if (!r) return; 
      const p = item.quantity / Math.max(r.baseYield || 1, 0.001); 
      processIngs(r.ingredients, p);
      if (item.fillingId && r.fillings) { 
        const fil = r.fillings.find(f => f.id === item.fillingId); 
        if (fil) processIngs(fil.ingredients, p);
      } 
    }); 
  }); 
  
  const def = []; 
  inventory.forEach(i => { 
    const av = i.quantity || 0; 
    const rq = reqMap[i.id] || 0; 
    if (rq > 0 && av < rq) def.push({ name: i.name, missingAmt: (rq - av).toFixed(1), unit: i.unit, reason: 'Дефіцит' }); 
  }); 
  
  const dt = new Date().toLocaleDateString('uk-UA');
  
  return (
    <div className="p-4 pb-28">
      <div className="bg-[#FDFBF7] text-[#2A2323] p-6 rounded-sm shadow-lg max-w-full font-mono text-sm relative mb-6 border border-[#D4AF37]/30">
        <div className="text-center mb-6 border-b-2 border-dashed border-[#8C7A7A]/30 pb-4">
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-[#151212]">Mmalinka.Cake</h2>
          <p className="text-[#8C7A7A] text-xs">Список закупівель</p>
          <p className="font-bold mt-2">{dt}</p>
        </div>
        
        {def.length === 0 ? ( 
          <div className="text-center py-10">
            <p className="font-bold text-lg text-[#5B7A5A]">Склад повністю готовий! 📦</p>
            <p className="text-[#8C7A7A] mt-2">Інгредієнтів вистачає на всі замовлення.</p>
          </div> 
        ) : (
          <div className="mb-4">
            {def.sort((a,b) => (a.name||'').localeCompare(b.name||'')).map((i, x) => (
              <div key={x} className="flex justify-between py-3 border-b border-[#8C7A7A]/10 items-center">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 border-2 border-[#2A2323] rounded-sm mt-0.5"></div>
                  <div>
                    <span className="font-bold text-base leading-tight block text-[#151212]">{i.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-lg text-red-600">{i.missingAmt}</span>
                  <span className="font-bold ml-1 text-sm text-[#8C7A7A]">{i.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {def.length > 0 && (
        <button onClick={()=>{ window.open(`https://t.me/share/url?url=${encodeURIComponent(`🛒 *СПИСОК ПОКУПОК Mmalinka.Cake* (${dt})\n\n` + def.map(i=>`🔹 ${i.name} — ${i.missingAmt} ${i.unit}`).join('\n'))}`, '_blank'); }} className="w-full bg-[#2AABEE] text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 text-lg">
          <Send size={20}/> Відправити в Telegram
        </button>
      )}
    </div>
  );
}

function InvoicePreview({ sales, recipes }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef(null);

  const ts = sales.reduce((s, o) => { 
    const is = (o.items || [{ sellPrice: o.sellPrice }]).reduce((x, i) => x + (i.sellPrice || 0), 0); 
    return s + is + (o.decorPrice || 0); 
  }, 0); 
  const dt = new Date().toLocaleDateString('uk-UA');

  const shareInvoice = async () => {
    setIsGenerating(true);
    try {
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const canvas = await window.html2canvas(invoiceRef.current, { scale: 3, backgroundColor: '#FDFBF7' });
      
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `чек_mmalinka_${Date.now()}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Ваш чек Mmalinka.Cake' });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
          URL.revokeObjectURL(url);
          alert("Чек збережено! Тепер ви можете скинути його клієнту.");
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (error) {
      console.error(error); alert("Не вдалося створити картинку."); setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 pb-28 flex flex-col items-center">
      <div ref={invoiceRef} className="bg-[#FDFBF7] text-[#2A2323] p-6 rounded-sm shadow-xl w-full max-w-sm font-mono text-sm relative border border-[#D4AF37]/50">
        <div className="text-center mb-6 border-b-2 border-dashed border-[#8C7A7A]/30 pb-4">
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-[#151212]">Mmalinka.Cake</h2>
          <p className="text-[#8C7A7A] text-xs uppercase tracking-widest">Товарний чек</p>
          <p className="font-bold mt-2 text-sm">{dt}</p>
        </div>
        <div className="mb-4">
          <div className="flex justify-between font-bold border-b border-[#8C7A7A]/30 pb-2 mb-2 text-[10px] uppercase tracking-widest text-[#8C7A7A]">
            <span className="w-[45%]">Найменування</span>
            <span className="w-[20%] text-center">Ціна</span>
            <span className="w-[15%] text-center">К-ть</span>
            <span className="w-[20%] text-right">Сума</span>
          </div>
          {sales.map(o => { 
            const is = o.items || [{ recipeId: o.recipeId, fillingId: o.fillingId, quantity: o.quantity, sellPrice: o.sellPrice }]; 
            return (
              <React.Fragment key={o.id}>
                {is.map((i, x) => { 
                  const r = recipes.find(r => r.id === i.recipeId); 
                  const f = r?.fillings?.find(f => f.id === i.fillingId); 
                  const dN = f ? `${r.name} (${f.name})` : (r ? r.name : 'Товар'); 
                  const unitPrice = i.quantity > 0 ? (i.sellPrice / i.quantity).toFixed(2) : i.sellPrice.toFixed(2);
                  return (
                    <div key={x} className="flex justify-between py-2 border-b border-[#8C7A7A]/10 items-center">
                      <span className="w-[45%] pr-2 font-bold leading-tight text-[#151212]">{dN}</span>
                      <span className="w-[20%] text-center text-[#8C7A7A]">{unitPrice}₴</span>
                      <span className="w-[15%] text-center font-bold">{i.quantity}</span>
                      <span className="w-[20%] text-right font-black text-base">{Number(i.sellPrice).toFixed(2)}₴</span>
                    </div>
                  )
                })}
                {o.decorPrice > 0 && (
                  <div className="flex justify-between py-2 border-b border-[#8C7A7A]/10 items-center text-[#8C7A7A] text-xs italic">
                    <span className="w-[45%] pr-2">+ Декор / Пакування</span>
                    <span className="w-[20%] text-center">-</span>
                    <span className="w-[15%] text-center">-</span>
                    <span className="w-[20%] text-right font-bold text-[#151212]">{Number(o.decorPrice).toFixed(2)}₴</span>
                  </div>
                )}
              </React.Fragment>
            ); 
          })}
        </div>
        <div className="border-t-2 border-dashed border-[#8C7A7A]/30 pt-4 mt-4 flex justify-between items-center">
          <span className="text-sm font-bold uppercase text-[#8C7A7A] tracking-widest">Всього:</span>
          <span className="text-3xl font-black text-[#151212]">{ts.toFixed(2)} ₴</span>
        </div>
        <div className="text-center mt-10 text-[#8C7A7A] text-xs uppercase tracking-widest">Дякуємо за замовлення!<br/>Чекаємо на вас знову.</div>
      </div>

      <button onClick={shareInvoice} disabled={isGenerating} className="mt-6 w-full max-w-sm bg-[#2AABEE] text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 text-lg">
        {isGenerating ? <Loader className="animate-spin" size={20}/> : <Send size={20}/>}
        {isGenerating ? 'Формуємо картинку...' : 'Відправити чек (Зберегти)'}
      </button>
    </div>
  )
}



// --- КОМПОНЕНТИ: CRM (КЛІЄНТИ) ---
function CustomersList({ customers, sales, onClick }) {
  const [searchTerm, setSearchTerm] = useState(''); 
  
  const enhancedCustomers = customers.map(c => {
     const safeName = c?.name ? String(c.name) : 'Без імені';
     const cSales = sales.filter(s => s.customer?.toString().toLowerCase().trim() === safeName.toLowerCase().trim());
     const orderCount = cSales.length;
     const totalSpent = cSales.reduce((sum, s) => {
         const itemsList = s.items || [{ sellPrice: s.sellPrice }];
         return sum + itemsList.reduce((acc, i) => acc + (i.sellPrice || 0), 0) + (s.decorPrice || 0);
     }, 0);
     return { ...c, name: safeName, orderCount, totalSpent };
  });

  const filtered = enhancedCustomers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  return (
    <div className="pb-28">
      <div className="px-4 mb-4">
        <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3 flex items-center gap-3 shadow-inner">
          <Search size={18} className="text-[#8C7A7A]" />
          <input type="text" placeholder="Пошук клієнта..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm" />
        </div>
      </div>
      
      {filtered.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center mt-4">
          <Users size={48} className="text-[#2A2323] mb-4" />
          <p className="text-[#8C7A7A] font-medium">Клієнтів не знайдено.</p>
        </div>
      ) : (
        [...filtered].sort((a,b) => b.totalSpent - a.totalSpent).map(c => (
          <div key={c.id} onClick={() => onClick(c)} className="flex items-center justify-between p-4 bg-[#1E1919] border border-[#2A2323] mb-3 mx-4 rounded-3xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center gap-4 flex-1">
               <div className="w-12 h-12 rounded-full bg-[#151212] border border-[#D4AF37]/30 flex items-center justify-center shadow-inner shrink-0">
                  <span className="text-[#D4AF37] font-bold text-lg">{c.name.charAt(0).toUpperCase()}</span>
               </div>
               <div className="flex-1 overflow-hidden">
                 <h3 className="text-[#F4EFEA] font-bold text-base leading-tight mb-0.5 truncate">{c.name}</h3>
                 <p className="text-[#8C7A7A] text-[10px] uppercase tracking-widest">{c.orderCount || 0} замовлень</p>
               </div>
            </div>
            <div className="text-right flex items-center gap-3 shrink-0 pl-2">
              <p className="text-[#D4AF37] font-black text-lg">{(c.totalSpent || 0).toFixed(0)} ₴</p>
              <ChevronRight size={20} className="text-[#8C7A7A]" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AddCustomerForm({ onSave }) {
  const [name, setName] = useState(''); 
  const [phone, setPhone] = useState(''); 
  const [instagram, setInstagram] = useState(''); 
  const [notes, setNotes] = useState(''); 

  return (
    <div className="p-4 h-full">
       <div className="bg-[#1E1919] border border-[#2A2323] rounded-[32px] p-6 shadow-lg">
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Ім'я клієнта (обов'язково)</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-medium transition-colors" />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Телефон</label>
          <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-medium transition-colors" />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Instagram / Telegram</label>
          <input type="text" value={instagram} onChange={e=>setInstagram(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-6 outline-none font-medium transition-colors" />
          
          <label className="text-[#8C7A7A] text-[10px] uppercase font-bold mb-2 block tracking-widest">Нотатки</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full bg-[#151212] border border-[#2A2323] focus:border-[#D4AF37] text-[#F4EFEA] p-4 rounded-2xl mb-8 outline-none font-medium transition-colors min-h-[100px] resize-y custom-scrollbar" />

          <button onClick={() => onSave({ name, phone, instagram, notes })} disabled={!name} className="w-full bg-[#D4AF37] disabled:opacity-50 text-[#151212] py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-[#D4AF37]/20 active:scale-95">Додати клієнта</button>
       </div>
    </div>
  );
}

