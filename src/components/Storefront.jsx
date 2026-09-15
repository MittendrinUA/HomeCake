import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, ChevronLeft, Minus, Plus, Trash2, X, Camera, Phone, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const escapeHTML = (str) => {
  if (!str) return '';
  return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

export default function Storefront({ recipes }) {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Всі');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [recipeForFilling, setRecipeForFilling] = useState(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', contact: '', date: '', notes: ''
  });

  const [decorFile, setDecorFile] = useState(null);
  const [decorPreview, setDecorPreview] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupInfo, setPopupInfo] = useState(null);

  const checkoutScrollRef = useRef(null);

  useEffect(() => {
    if (showCheckout && checkoutScrollRef.current) {
      checkoutScrollRef.current.scrollTop = 0;
    }
  }, [showCheckout]);

  const categories = ['Всі', ...new Set(recipes.map(r => r.category || 'Інше'))];
  const displayRecipes = recipes.filter(r => {
    const matchCat = activeCategory === 'Всі' || (r.category || 'Інше') === activeCategory;
    const matchSearch = (r.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const hasPrice = Number(r.defaultPrice) > 0; 
    return matchCat && matchSearch && hasPrice;
  });

  const getUnitPrice = (item) => {
    const yieldAmt = Math.max(item.baseYield || 1, 0.001);
    return (Number(item.defaultPrice) || 0) / yieldAmt;
  };

  const getDisplayPrice = (item) => {
    const unitPrice = getUnitPrice(item);
    const safeUnit = item.unit || 'шт'; 
    if (safeUnit === 'г' || safeUnit === 'гр') return `${(unitPrice * 1000).toFixed(0)} ₴ / 1 кг`;
    return `${unitPrice.toFixed(0)} ₴ / 1 ${safeUnit}`;
  };

  const getStepAndMin = (item) => {
    const safeUnit = item.unit || 'шт'; 
    let step = 1; let min = Number(item.minOrder) || 1; 
    if (safeUnit === 'г' || safeUnit === 'гр') { step = 500; min = item.minOrder ? Number(item.minOrder) : 1000; } 
    else if (safeUnit === 'кг') { step = 0.5; min = item.minOrder ? Number(item.minOrder) : 1; }
    return { step, min, safeUnit };
  };

  const formatQty = (qty, unit) => {
    const safeUnit = unit || 'шт';
    if ((safeUnit === 'г' || safeUnit === 'гр') && qty >= 1000) return `${(qty / 1000).toFixed(2).replace(/\.?0+$/, '')} кг`;
    return `${qty} ${safeUnit}`;
  };

  const handleDecorImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDecorFile(file); setDecorPreview(URL.createObjectURL(file)); 
    }
  };

  const removeDecorImage = () => {
    if (decorPreview) URL.revokeObjectURL(decorPreview); 
    setDecorFile(null); setDecorPreview('');
  };

  const handleAddToCartClick = (e, recipe) => {
    if (e) { e.preventDefault(); e.stopPropagation(); } 
    if (recipe.fillings && recipe.fillings.length > 0) setRecipeForFilling(recipe);
    else addToCart(recipe, null);
  };

  const addToCart = (recipe, fillingName) => {
    setCart(prev => {
      const cartItemId = fillingName ? `${recipe.id}-${fillingName}` : recipe.id;
      const existing = prev.find(item => item.cartItemId === cartItemId);
      const { step, min } = getStepAndMin(recipe);
      if (existing) return prev.map(item => item.cartItemId === cartItemId ? { ...item, cartQty: Number((item.cartQty + step).toFixed(2)) } : item);
      return [...prev, { ...recipe, cartItemId, selectedFilling: fillingName, cartQty: min }];
    });
    setRecipeForFilling(null); 
  };

  const updateQty = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const { step, min } = getStepAndMin(item);
        const newQty = Number((item.cartQty + (delta * step)).toFixed(2));
        return { ...item, cartQty: Math.max(min, newQty) }; 
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId) => setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));

  const totalSum = cart.reduce((sum, item) => sum + (getUnitPrice(item) * item.cartQty), 0);
  const totalItems = cart.length;

  const handleOrderSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.date) {
      setPopupInfo({ 
        type: 'error', 
        title: 'Увага', 
        msg: "Будь ласка, заповніть обов'язкові поля: Ім'я, Телефон та Дату готовності!",
        onClose: () => setPopupInfo(null) // ВИПРАВЛЕНО: тепер вікно буде закриватися
      });
      return;
    }

    setIsSubmitting(true);

    const BOT_TOKEN = '8663457748:AAGLfvidDs6Wj715FykPpozqmsYIAhpEyIU'; 
    const CHAT_ID = '699804414';         

    let messageText = `🆕 <b>НОВЕ ЗАМОВЛЕННЯ З ВІТРИНИ!</b>\n\n`;
    messageText += `👤 <b>Клієнт:</b> ${escapeHTML(formData.name)}\n`;
    messageText += `📱 <b>Телефон:</b> ${escapeHTML(formData.phone)}\n`;
    if (formData.contact) messageText += `💬 <b>Зв'язок:</b> ${escapeHTML(formData.contact)}\n`;
    messageText += `📅 <b>Бажана дата:</b> ${escapeHTML(formData.date)}\n`;
    if (formData.notes) messageText += `📝 <b>Коментар:</b> ${escapeHTML(formData.notes)}\n\n`;
    
    messageText += `🛍 <b>КОШИК:</b>\n`;
    cart.forEach(item => {
      messageText += `▪️ ${escapeHTML(item.name)} `;
      if (item.selectedFilling) messageText += `(<i>${escapeHTML(item.selectedFilling)}</i>) `;
      messageText += `— <b>${formatQty(item.cartQty, item.unit)}</b>\n`;
    });

    messageText += `\n💰 <b>Орієнтовна сума:</b> ${totalSum.toFixed(2)} ₴\n`;
    if (decorFile) messageText += `🎨 <i>Клієнт прикріпив фото для декору! (див. вище)</i>`;

    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/${decorFile ? 'sendPhoto' : 'sendMessage'}`;
    
    const tgData = new FormData();
    tgData.append('chat_id', CHAT_ID);
    
    if (decorFile) {
      tgData.append('photo', decorFile);
      tgData.append('caption', messageText);
      tgData.append('parse_mode', 'HTML');
    } else {
      tgData.append('text', messageText);
      tgData.append('parse_mode', 'HTML');
    }

    try {
      const response = await fetch(apiUrl, { method: 'POST', body: tgData });
      const result = await response.json(); 
      
      if (response.ok && result.ok) {
        setPopupInfo({
          type: 'success',
          title: 'Замовлення прийнято!',
          msg: 'Дякуємо! Ваше замовлення успішно відправлено. Ми зв\'яжемося з вами найближчим часом для підтвердження деталей.',
          onClose: () => {
            setCart([]);
            removeDecorImage();
            setFormData({ name: '', phone: '', contact: '', date: '', notes: '' });
            setShowCheckout(false);
            setPopupInfo(null);
          }
        });
      } else {
        console.error("TG Error:", result);
        setPopupInfo({ 
          type: 'error', 
          title: 'Помилка Telegram', 
          msg: `Бот не зміг прийняти замовлення. Причина: ${result.description || 'Невідома помилка'}`, 
          onClose: () => setPopupInfo(null) 
        });
      }
    } catch (error) {
      setPopupInfo({ type: 'error', title: 'Немає зв\'язку', msg: 'Помилка з\'єднання. Перевірте інтернет та спробуйте ще раз.', onClose: () => setPopupInfo(null) });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Перевіряємо, чи всі обов'язкові поля заповнені
  const isFormValid = formData.name.trim() !== '' && formData.phone.trim() !== '' && formData.date !== '';

  const btnReset = "outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none";

  return (
    <div className="fixed inset-0 bg-[#000000] flex justify-center sm:items-center sm:py-8 z-[100] overflow-hidden font-sans selection:bg-[#D4AF37] selection:text-[#151212]">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        * { -webkit-tap-highlight-color: transparent !important; }
      `}</style>
      
      <div className="w-full max-w-[420px] bg-[#151212] h-full sm:h-[850px] sm:rounded-[48px] sm:border-[8px] border-[#2A2323] flex flex-col relative shadow-2xl overflow-hidden">
        
        {showCheckout ? (
          // ЕКРАН 2: ОФОРМЛЕННЯ ЗАМОВЛЕННЯ (CHECKOUT)
          <div className="flex flex-col h-full relative">
            <div className="p-4 flex justify-between items-center bg-[#151212] border-b border-[#2A2323] shrink-0 z-20">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setShowCheckout(false)} className={`${btnReset} p-2 bg-[#1E1919] rounded-full border border-[#2A2323] text-[#F4EFEA] active:scale-95 transition-transform select-none`}>
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-[#F4EFEA] text-lg font-bold tracking-wide select-none">Оформлення</h2>
              </div>
              <a href="tel:+380982332315" className={`${btnReset} p-2 text-[#8C7A7A] active:text-[#D4AF37] active:scale-95 transition-all bg-[#1E1919] rounded-full border border-[#2A2323] select-none`}>
                <Phone size={18} />
              </a>
            </div>

            <div ref={checkoutScrollRef} className="flex-1 overflow-y-auto p-5 pb-28 hide-scrollbar relative">
              <div className="bg-[#1E1919] border border-[#2A2323] rounded-[24px] p-5 mb-6 shadow-lg">
                <h3 className="text-[#8C7A7A] text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2 select-none"><ShoppingCart size={14}/> Ваше замовлення:</h3>
                
                <div className="flex flex-col mb-4">
                  {cart.map(item => {
                    const { min } = getStepAndMin(item);
                    const isAtMin = item.cartQty <= min; 
                    
                    return (
                    <div key={item.cartItemId} className="flex flex-col gap-3 py-4 border-b border-[#2A2323] last:border-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-[#F4EFEA] font-bold text-sm leading-tight select-none">{item.name}</p>
                          {item.selectedFilling && <p className="text-[#D4AF37] text-[10px] font-bold mt-1 select-none">Смак: {item.selectedFilling}</p>}
                          <p className="text-[#8C7A7A] text-[10px] mt-1 select-none">{getDisplayPrice(item)}</p>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.cartItemId)} className={`${btnReset} p-2 text-[#8C7A7A] active:text-red-400 bg-[#151212] rounded-xl border border-[#2A2323] active:scale-95 transition-transform select-none`}>
                          <Trash2 size={16}/>
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#D4AF37] font-black text-lg select-none">{(getUnitPrice(item) * item.cartQty).toFixed(2)} ₴</span>
                        <div className="flex items-center gap-2 bg-[#151212] p-1 rounded-xl border border-[#2A2323]">
                          <button type="button" onClick={() => updateQty(item.cartItemId, -1)} disabled={isAtMin} className={`${btnReset} p-2 transition-transform select-none ${isAtMin ? 'text-[#8C7A7A] opacity-30' : 'text-[#F4EFEA] active:text-[#D4AF37] active:scale-90'}`}>
                            <Minus size={16}/>
                          </button>
                          <span className="text-[#F4EFEA] font-bold text-sm w-14 text-center select-none">{formatQty(item.cartQty, item.unit)}</span>
                          <button type="button" onClick={() => updateQty(item.cartItemId, 1)} className={`${btnReset} p-2 text-[#F4EFEA] active:text-[#D4AF37] active:scale-90 transition-transform select-none`}>
                            <Plus size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>

                {cart.length === 0 ? (
                  <p className="text-[#8C7A7A] text-center text-xs py-4 select-none">Кошик порожній</p>
                ) : (
                  <div className="flex justify-between items-center pt-4 border-t border-[#D4AF37]/20 select-none">
                    <span className="text-[#F4EFEA] font-bold">Разом:</span>
                    <span className="text-[#D4AF37] text-2xl font-black">{totalSum.toFixed(2)} ₴</span>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <>
                  <h3 className="text-[#8C7A7A] text-[10px] uppercase tracking-widest font-bold mb-4 pl-1 select-none">Ваші дані:</h3>
                  <div className="flex flex-col gap-4 mb-8">
                    <input type="text" placeholder="Ваше Ім'я *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`${btnReset} bg-[#1E1919] border border-[#2A2323] p-4 rounded-2xl text-[#F4EFEA] placeholder-[#8C7A7A] focus:border-[#D4AF37] transition-colors`} />
                    <input type="tel" placeholder="Номер телефону *" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`${btnReset} bg-[#1E1919] border border-[#2A2323] p-4 rounded-2xl text-[#F4EFEA] placeholder-[#8C7A7A] focus:border-[#D4AF37] transition-colors`} />
                    <input type="text" placeholder="Нік в Inst / Telegram (для зв'язку)" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className={`${btnReset} bg-[#1E1919] border border-[#2A2323] p-4 rounded-2xl text-[#F4EFEA] placeholder-[#8C7A7A] focus:border-[#D4AF37] transition-colors`} />
                  </div>

                  <h3 className="text-[#8C7A7A] text-[10px] uppercase tracking-widest font-bold mb-4 pl-1 select-none">Деталі замовлення:</h3>
                  <div className="flex flex-col gap-4 mb-8">
                    <div>
                      <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 ml-1 block select-none">Бажана дата готовності *</label>
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={`${btnReset} w-full bg-[#1E1919] border border-[#2A2323] p-4 rounded-2xl text-[#F4EFEA] focus:border-[#D4AF37] block transition-colors`} />
                    </div>
                    
                    <div>
                      <label className="text-[#8C7A7A] text-[10px] uppercase font-bold tracking-widest mb-2 ml-1 block select-none">Коментар до замовлення</label>
                      <textarea placeholder="Побажання до смаків, пакування тощо..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={`${btnReset} w-full bg-[#1E1919] border border-[#2A2323] p-4 rounded-2xl text-[#F4EFEA] placeholder-[#8C7A7A] focus:border-[#D4AF37] h-24 resize-none hide-scrollbar block transition-colors`}></textarea>
                    </div>
                  </div>

                  <div className="mb-8">
                    {/* ВИПРАВЛЕНО: Прибрано Майнкрафт */}
                    <h3 className="text-[#8C7A7A] text-[10px] uppercase tracking-widest font-bold mb-3 pl-1 block select-none">Прикріпити фото бажаного декору</h3>
                    <input type="file" accept="image/*" id="decor-photo" className="hidden" onChange={handleDecorImageChange} />
                    
                    {decorPreview ? (
                      <div className="relative border border-[#2A2323] rounded-2xl bg-[#1E1919] p-3 shadow-inner flex flex-col items-center">
                          <img src={decorPreview} alt="Decor Preview" className="h-28 w-auto rounded-lg mx-auto select-none" />
                          <button type="button" onClick={removeDecorImage} className={`${btnReset} absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full text-white active:scale-90 select-none`}><X size={14}/></button>
                          <p className="text-[#8C7A7A] text-[10px] mt-2 font-mono truncate max-w-full px-4 select-none">{decorFile?.name}</p>
                      </div>
                    ) : (
                      <label htmlFor="decor-photo" className={`${btnReset} w-full h-20 bg-[#1E1919] border-2 border-dashed border-[#2A2323] rounded-2xl flex flex-col items-center justify-center cursor-pointer text-[#8C7A7A] active:border-[#D4AF37] active:text-[#D4AF37] transition-colors select-none`}>
                          <Camera size={24} className="mb-1.5" />
                          <span className="text-xs font-medium">Завантажити</span>
                      </label>
                    )}
                  </div>
                  
                  <p className="text-[#D4AF37] text-xs font-bold leading-relaxed mb-6 bg-[#D4AF37]/5 p-5 rounded-xl border border-[#D4AF37]/20 text-center tracking-wide drop-shadow-sm select-none">
                    Декор для тортів (фігурки, пряники, друк тощо) рахується окремо та обговорюється індивідуально.
                  </p>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-[#151212] via-[#151212]/95 to-transparent z-20 pointer-events-none">
                {/* ВИПРАВЛЕНО: Кнопка тепер неактивна, якщо форма не валідна */}
                <button 
                  type="button" 
                  onClick={handleOrderSubmit} 
                  disabled={isSubmitting || !isFormValid}
                  className={`${btnReset} w-full pointer-events-auto bg-[#D4AF37] text-[#151212] font-black py-4 rounded-2xl shadow-xl shadow-[#D4AF37]/20 flex justify-center items-center gap-2 select-none ${(isSubmitting || !isFormValid) ? 'opacity-50 grayscale-[30%]' : 'active:scale-95 transition-transform'}`}
                >
                  {isSubmitting ? <Loader className="animate-spin" size={20} /> : 'ПІДТВЕРДИТИ ЗАМОВЛЕННЯ'}
                </button>
              </div>
            )}
          </div>
        ) : (
          // ЕКРАН 1: ГОЛОВНА ВІТРИНА (КАТАЛОГ)
          <div className="flex flex-col h-full relative">
            <div className="p-5 flex justify-between items-center bg-[#151212]/95 backdrop-blur-xl z-20 border-b border-[#2A2323] shrink-0">
              <div className="flex items-center gap-3 select-none">
                <span className="text-2xl drop-shadow-md">🧁</span>
                <div className="flex flex-col">
                    <h1 className="font-black text-sm text-[#D4AF37] tracking-widest uppercase leading-tight">Mmalinka.Cake</h1>
                    <span className="text-[#8C7A7A] text-[9px] uppercase font-bold tracking-widest">Premium Bakery</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a href="tel:+380982332315" className={`${btnReset} p-2 text-[#8C7A7A] active:text-[#D4AF37] active:scale-95 transition-transform bg-[#1E1919] rounded-full border border-[#2A2323] select-none`}>
                  <Phone size={20} />
                </a>

                <button 
                  type="button"
                  className={`${btnReset} relative p-2 active:scale-95 transition-transform bg-[#1E1919] rounded-full border border-[#2A2323] select-none`} 
                  onClick={() => cart.length > 0 && setShowCheckout(true)}
                >
                  <ShoppingCart className={cart.length > 0 ? "text-[#D4AF37]" : "text-[#8C7A7A]"} size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#151212] text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-md shadow-[#D4AF37]/20">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar relative">
              <div className="p-5">
                  <h2 className="text-2xl font-black mb-4 text-[#F4EFEA] tracking-wide select-none">Наші Десерти</h2>
                  
                  <div className="bg-[#1E1919] border border-[#2A2323] rounded-2xl p-3.5 flex items-center gap-3 shadow-inner mb-6">
                    <Search size={18} className="text-[#8C7A7A]" />
                    <input 
                      type="text" placeholder="Шукати десерти..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className={`${btnReset} bg-transparent border-none text-[#F4EFEA] w-full placeholder-[#8C7A7A] text-sm`} 
                    />
                  </div>

                  <div className="relative mb-6 -mx-5">
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-5 pr-12 relative z-0">
                      {categories.map(cat => (
                        <button 
                          type="button" key={cat} onClick={(e) => { e.preventDefault(); setActiveCategory(cat); }}
                          className={`${btnReset} whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors active:scale-95 select-none ${
                            activeCategory === cat ? 'bg-[#D4AF37] text-[#151212] shadow-lg shadow-[#D4AF37]/20' : 'bg-[#1E1919] text-[#8C7A7A] border border-[#2A2323] active:border-[#D4AF37]/50 active:text-[#F4EFEA]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="absolute top-0 left-0 bottom-2 w-6 bg-gradient-to-r from-[#151212] to-transparent pointer-events-none z-10"></div>
                    <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-[#151212] via-[#151212]/90 to-transparent pointer-events-none z-10"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-24">
                    {displayRecipes.length > 0 ? displayRecipes.map(recipe => {
                      const { min, safeUnit } = getStepAndMin(recipe);
                      
                      return (
                        <div key={recipe.id} className="bg-[#1E1919] border border-[#2A2323] rounded-[24px] overflow-hidden flex flex-col shadow-lg shadow-black/20 group">
                          <div 
                            className="h-36 w-full bg-[#151212] bg-cover bg-center border-b border-[#2A2323] flex items-center justify-center relative overflow-hidden select-none"
                            style={{ backgroundImage: recipe.imageUrl ? `url(${recipe.imageUrl})` : 'none' }}
                          >
                            {!recipe.imageUrl && <span className="text-4xl opacity-50">🎂</span>}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1E1919] via-[#1E1919]/20 to-transparent opacity-90"></div>
                          </div>
                          
                          <div className="p-3 flex flex-col flex-1 justify-between gap-3 relative z-10">
                            <div>
                              <h3 className="font-bold text-[13px] leading-tight text-[#F4EFEA] mb-1.5 drop-shadow-md select-none">{recipe.name}</h3>
                              <p className="text-[#8C7A7A] text-[10px] font-bold uppercase tracking-widest leading-relaxed select-none">
                                {getDisplayPrice(recipe)}
                              </p>
                              <p className="text-[#D4AF37]/80 text-[8px] uppercase font-bold tracking-widest mt-1 select-none">
                                Мін: {formatQty(min, safeUnit)}
                              </p>
                            </div>
                            <button 
                              type="button" onClick={(e) => handleAddToCartClick(e, recipe)}
                              className={`${btnReset} w-full bg-[#D4AF37]/10 active:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase active:scale-95 transition-transform select-none`}
                            >
                              + Додати
                            </button>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="col-span-2 text-center py-10"><p className="text-[#8C7A7A] font-medium text-sm select-none">Нічого не знайдено.</p></div>
                    )}
                  </div>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#151212] via-[#151212]/95 to-transparent z-30 pointer-events-none">
                <button 
                  type="button" onClick={() => setShowCheckout(true)}
                  className={`${btnReset} w-full pointer-events-auto bg-[#D4AF37] text-[#151212] font-black py-4 rounded-2xl shadow-xl shadow-[#D4AF37]/20 flex items-center justify-between px-6 active:scale-95 transition-transform select-none`}
                >
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={18} />
                      <span>Оформити ({totalItems})</span>
                    </div>
                    <span>{totalSum.toFixed(2)} ₴</span>
                </button>
              </div>
            )}
          </div>
        )}

        {recipeForFilling && (
          <div className="absolute inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 pb-8 sm:p-0">
            <div className="w-full bg-[#1E1919] rounded-[32px] border border-[#2A2323] p-6 shadow-2xl animate-in slide-in-from-bottom-8">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-[#F4EFEA] text-lg font-bold tracking-wide select-none">Оберіть смак</h3>
                 <button type="button" onClick={() => setRecipeForFilling(null)} className={`${btnReset} text-[#8C7A7A] p-2 bg-[#151212] rounded-full active:scale-95 border border-[#2A2323] select-none`}>
                    <X size={18}/>
                 </button>
              </div>
              <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mb-6 select-none">{recipeForFilling.name}</p>
              
              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto hide-scrollbar pr-1 pb-4">
                {recipeForFilling.fillings.map(fil => (
                  <button
                    type="button" key={fil.id} onClick={() => addToCart(recipeForFilling, fil.name)}
                    className={`${btnReset} w-full bg-[#151212] border border-[#2A2323] text-[#F4EFEA] p-4 rounded-2xl text-left font-bold active:border-[#D4AF37] active:text-[#D4AF37] transition-colors flex justify-between items-center select-none`}
                  >
                    <span>{fil.name}</span>
                    <Plus size={16} className="text-[#8C7A7A]"/>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {popupInfo && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-5">
            <div className="bg-[#1E1919] border border-[#2A2323] p-8 rounded-[32px] w-full max-w-[320px] text-center shadow-2xl animate-in zoom-in-95 duration-200">
               {popupInfo.type === 'success' 
                 ? <CheckCircle size={64} className="text-[#5B7A5A] mx-auto mb-5 drop-shadow-md"/> 
                 : <AlertCircle size={64} className="text-red-400 mx-auto mb-5 drop-shadow-md"/>
               }
               <h3 className="text-[#F4EFEA] font-bold text-xl mb-3 tracking-wide select-none">{popupInfo.title}</h3>
               <p className="text-[#8C7A7A] text-sm mb-8 leading-relaxed px-2 select-none">{popupInfo.msg}</p>
               <button 
                 type="button" 
                 onClick={popupInfo.onClose} 
                 className={`${btnReset} w-full bg-[#D4AF37] text-[#151212] font-black py-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-[#D4AF37]/20 tracking-widest uppercase select-none`}
               >
                 ОК
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}