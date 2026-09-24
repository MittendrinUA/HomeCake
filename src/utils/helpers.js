export const formatOrderDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const calculateCost = (itemObj, preps, inventory, fillingId = null) => {
  if (!itemObj) return 0;
  let cost = 0;
  const calcIngsCost = (ings) => {
     return (ings || []).reduce((total, ing) => {
        if (ing.prepId) {
           const p = preps.find(pr => pr.id === ing.prepId);
           return total + (p ? (calculateCost(p, preps, inventory) / Math.max(p.baseYield || 1, 0.001)) * ing.amount : 0);
        }
        const invItem = inventory.find(i => i.id === ing.invId);
        return total + (invItem ? invItem.price * ing.amount : 0);
     }, 0);
  };
  
  if (fillingId && itemObj.fillings) {
     const filling = itemObj.fillings.find(f => f.id === fillingId);
     if (filling) {
       cost += calcIngsCost(filling.ingredients);
     }
  }
  cost += calcIngsCost(itemObj.ingredients);
  return cost;
};
