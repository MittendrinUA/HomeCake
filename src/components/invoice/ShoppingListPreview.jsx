import { useTranslation } from "react-i18next";
import React, { memo } from 'react';
import { Send, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../ui/Logo';

const ShoppingListPreview = memo(function ShoppingListPreview({ inventory, sales, recipes, preps }) {
  const { t } = useTranslation();
  const plannedSales = sales.filter((s) => s.status === 'planned');
  const reqMap = {};

  const processIngs = (ings, prop) => {
    (ings || []).forEach((ing) => {
      if (ing.prepId) {
        const p = preps.find((pr) => pr.id === ing.prepId);
        if (p) processIngs(p.ingredients, prop * (ing.amount / Math.max(p.baseYield || 1, 0.001)));
      } else if (ing.invId) {
        reqMap[ing.invId] = (reqMap[ing.invId] || 0) + ing.amount * prop;
      }
    });
  };

  plannedSales.forEach((order) => {
    const items = order.items || [{ recipeId: order.recipeId, fillingId: order.fillingId, quantity: order.quantity }];
    items.forEach((item) => {
      const r = recipes.find((r) => r.id === item.recipeId);if (!r) return;
      const p = item.quantity / Math.max(r.baseYield || 1, 0.001);
      processIngs(r.ingredients, p);
      if (item.fillingId && r.fillings) {
        const fil = r.fillings.find((f) => f.id === item.fillingId);
        if (fil) processIngs(fil.ingredients, p);
      }
    });
  });

  const def = [];
  inventory.forEach((i) => {
    const av = i.quantity || 0;
    const rq = reqMap[i.id] || 0;
    const minThreshold = i.minThreshold || 0;
    
    // We want to ensure that after fulfilling orders, we have at least minThreshold left.
    const targetQty = rq + minThreshold;
    if (av < targetQty) {
      let missingAmt = targetQty - av;
      let reason = '';
      if (rq > 0 && minThreshold > 0) {
        reason = `Замовлення + Мін. залишок`;
      } else if (rq > 0) {
        reason = `Під замовлення`;
      } else {
        reason = `Нижче мін. залишку`;
      }
      def.push({ name: i.name, missingAmt: missingAmt.toFixed(1), unit: i.unit, reason });
    }
  });

  const dt = new Date().toLocaleDateString('uk-UA');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 pb-28">
      <div className="bg-gradient-to-b from-[#FDFBF7] to-[#F4EFEA] text-[#2A2323] p-8 rounded-[32px] shadow-2xl max-w-full font-mono text-sm relative mb-6 border border-[#D4AF37]/30">
        
        <div className="absolute top-0 right-0 p-4 opacity-5"><ShoppingBag size={80} /></div>

        <div className="text-center mb-6 border-b-2 border-dashed border-[#8C7A7A]/30 pb-6 flex flex-col items-center relative z-10">
          <Logo size={36} textColor="#151212" iconColor="#D4AF37" className="mb-2" />
          <p className="text-[#8C7A7A] text-xs font-bold uppercase tracking-widest">{t("auto.t_62", "Список закупівель")}</p>
          <p className="font-black text-lg mt-2 tracking-tight">{dt}</p>
        </div>
        
        {def.length === 0 ?
          <div className="text-center py-12 relative z-10">
            <p className="font-black text-2xl text-[#5B7A5A] mb-2">{t("auto.t_63", "Склад повністю готовий! 📦")}</p>
            <p className="text-[#8C7A7A] font-medium leading-relaxed">{t("auto.t_64", "Інгредієнтів вистачає на всі замовлення, а запаси в нормі.")}</p>
          </div> :

          <div className="mb-6 relative z-10 space-y-4">
            {def.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((i, x) =>
              <div key={x} className="flex justify-between py-3 border-b border-[#8C7A7A]/15 items-center last:border-0">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 border-[3px] border-[#2A2323] rounded-md mt-0.5 opacity-40"></div>
                  <div>
                    <span className="font-bold text-[15px] leading-tight block text-[#151212]">{i.name}</span>
                    <span className="text-[10px] uppercase font-bold text-[#8C7A7A] tracking-widest">{i.reason}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-xl text-red-600">{i.missingAmt}</span>
                  <span className="font-bold ml-1.5 text-sm text-[#8C7A7A]">{i.unit}</span>
                </div>
              </div>
            )}
          </div>
        }
      </div>
      
      {def.length > 0 &&
        <button onClick={() => {window.open(`https://t.me/share/url?url=${encodeURIComponent(`🛒 *СПИСОК ПОКУПОК Whisked* (${dt})\n\n` + def.map((i) => `🔹 ${i.name} — ${i.missingAmt} ${i.unit}`).join('\n'))}`, '_blank');}} className="w-full bg-gradient-to-r from-[#2AABEE] to-[#1DA1F2] text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(42,171,238,0.3)] flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest transition-all">
            <Send size={18} />{t("auto.t_65", "Відправити в Telegram")}
        </button>
      }
    </motion.div>
  );
});

export default ShoppingListPreview;