const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

c = c.replace(/<AnimatedLoadingLogo size=\{40\} \/>/g, `<Logo size={40} />
<p className="text-[#8C7A7A] mt-4 text-sm font-bold flex items-center gap-2">
  <span className="w-4 h-4 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin"></span>
  {loadingStep || t("auto.t_1", "Завантаження...")}
</p>`);

c = c.replace(/<AnimatePresence mode="wait">[\s\S]*?<motion\.div key=\{activeTab \+ \(selectedItem \? 'item' : ''\) \+ \(isAddingNew \? 'new' : ''\) \+ \(selectedCategory \|\| ''\) \+ \(showInvoicePreview \? 'inv' : ''\) \+ \(showShoppingListPreview \? 'shop' : ''\)\}[\s\S]*?className="flex-1">/g, 
`<div key={activeTab + (selectedItem ? 'item' : '') + (isAddingNew ? 'new' : '') + (selectedCategory || '') + (showInvoicePreview ? 'inv' : '') + (showShoppingListPreview ? 'shop' : '')} className="flex-1 animate-in fade-in duration-100 slide-in-from-bottom-2">`);

c = c.replace(/<\/motion\.div>[\s\S]*?<\/AnimatePresence>/g, '</div>');

fs.writeFileSync('src/App.jsx', c);
console.log("Fixed!");
