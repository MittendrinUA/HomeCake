const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src/components');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('₴')) {
    console.log(`Processing ${file}...`);
    
    // Add import if missing
    if (!content.includes("import useStore")) {
      // Find where to put it
      const reactImportMatch = content.match(/import .* from 'react';\n/);
      if (reactImportMatch) {
         let relativePath = '../store/useStore';
         let depth = file.split(path.sep).length - 3; // src/components = 3
         if (depth === 1) relativePath = '../store/useStore';
         else if (depth === 2) relativePath = '../../store/useStore';
         
         if (file.includes('Analytics.jsx') || file.includes('RecipeDetail.jsx') || file.includes('Trash.jsx') || file.includes('CustomerDetail.jsx')) {
            relativePath = '../store/useStore';
         }
         // Actually, let's just use regex to count depth:
         const rel = file.split(/\\|\//).slice(2, -1).map(() => '..').join('/');
         const storePath = rel ? `${rel}/store/useStore` : '../store/useStore';
         
         content = content.replace(reactImportMatch[0], `${reactImportMatch[0]}import useStore from '${storePath}';\n`);
      }
    }
    
    // Replace ₴ in JSX text and template strings
    // E.g., `50 ₴` -> `50 {currency}`
    // `(50 ₴)` -> `(50 {currency})`
    // `'50 ₴'` -> `'50 ' + currency` - tricky.
    
    // Let's do a basic global replace of '₴' with '{currency}' if not in a string, else we manually fix.
    // Since there are only 30 occurrences, let's see.
    content = content.replace(/₴/g, '{currency}');
    
    // Wait, replacing '₴' with '{currency}' in template strings like `${val} ₴` becomes `${val} {currency}`, which breaks JS syntax. It should be `${val} ${currency}`.
    content = content.replace(/\$\{([^\}]+)\} \{currency\}/g, '${$1} ${currency}');
    content = content.replace(/\$\{currency\}/g, '${currency}'); // just in case
    
    // Add const currency hook
    // We need to inject `const currency = useStore(s => s.settings?.currency || 'грн');` right after the component declaration.
    // e.g., `export default function OrdersList({ ... }) {`
    // or `const OrdersList = ({ ... }) => {`
    // or `const InvoicePreview = memo(function InvoicePreview(...) {`
    const compRegex = /(function [A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{|const [A-Z][a-zA-Z0-9_]*\s*=\s*(?:memo\()?function(?:\s+[A-Z][a-zA-Z0-9_]*)?\s*\([^)]*\)\s*\{|const [A-Z][a-zA-Z0-9_]*\s*=\s*\([^)]*\)\s*=>\s*\{)/g;
    
    let match;
    let modified = false;
    let newContent = content;
    
    while ((match = compRegex.exec(content)) !== null) {
       // Only add to the first main component in the file usually
       if (!modified) {
           const insertPos = match.index + match[0].length;
           const before = newContent.slice(0, insertPos);
           const after = newContent.slice(insertPos);
           newContent = before + `\n  const currency = useStore(s => s.settings?.currency || 'грн');` + after;
           modified = true;
       }
    }
    
    fs.writeFileSync(file, newContent, 'utf8');
  }
});
console.log('Done');
