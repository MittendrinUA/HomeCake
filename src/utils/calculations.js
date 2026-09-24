/**
 * Compresses an image file to a base64 JPEG string.
 * @param {File} file
 * @returns {Promise<string>} base64 data URL
 */
export const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new window.Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400; const MAX_HEIGHT = 400;
      let w = img.width; let h = img.height;
      if (w > h) { if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; } }
      else { if (h > MAX_HEIGHT) { w *= MAX_HEIGHT / h; h = MAX_HEIGHT; } }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  };
});

/**
 * Recursively calculates ingredient cost for a recipe/prep item.
 * @param {object} itemObj  - recipe or prep object
 * @param {string|null} fillingId
 * @param {Array} inventory
 * @param {Array} preps
 * @returns {number} cost in UAH
 */
export const calculateCost = (itemObj, fillingId = null, inventory = [], preps = []) => {
  if (!itemObj) return 0;

  const calcIngsCost = (ings) => {
    return (ings || []).reduce((total, ing) => {
      if (ing.prepId) {
        const p = preps.find(pr => pr.id === ing.prepId);
        return total + (p ? (calculateCost(p, null, inventory, preps) / Math.max(p.baseYield || 1, 0.001)) * ing.amount : 0);
      }
      const invItem = inventory.find(i => i.id === ing.invId);
      return total + (invItem ? invItem.price * ing.amount : 0);
    }, 0);
  };

  let cost = calcIngsCost(itemObj.ingredients);
  if (fillingId && itemObj.fillings) {
    const filling = itemObj.fillings.find(f => f.id === fillingId);
    if (filling) cost += calcIngsCost(filling.ingredients);
  }
  return cost;
};
