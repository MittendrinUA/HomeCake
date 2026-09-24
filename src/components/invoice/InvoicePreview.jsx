import React, { useState, useRef, memo } from 'react';
import { Send, Loader } from 'lucide-react';
import Logo from '../ui/Logo';

const InvoicePreview = memo(function InvoicePreview({ sales, recipes }) {
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
        const file = new File([blob], `чек_whisked_${Date.now()}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Ваш чек Whisked' });
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
        <div className="text-center mb-6 border-b-2 border-dashed border-[#8C7A7A]/30 pb-4 flex flex-col items-center">
          <Logo size={28} textColor="#151212" iconColor="#151212" className="mb-1" />
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
});

export default InvoicePreview;
