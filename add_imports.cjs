const fs = require('fs');

const files = [
  'src/components/shared/List.jsx',
  'src/components/RecipeDetail.jsx',
  'src/components/orders/OrdersList.jsx',
  'src/components/orders/AddOrderForm.jsx',
  'src/components/invoice/InvoicePreview.jsx',
  'src/components/inventory/InventoryList.jsx',
  'src/components/customers/CustomersList.jsx',
  'src/components/inventory/InventoryDetail.jsx',
  'src/components/inventory/AddInventoryForm.jsx',
  'src/components/CustomerDetail.jsx',
  'src/components/Analytics.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import useStore')) {
    const importPath = file.split('/').length > 3 ? '../../store/useStore' : '../store/useStore';
    content = `import useStore from '${importPath}';\n` + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Added to', file);
  }
});
