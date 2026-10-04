const fs = require('fs');
let c = fs.readFileSync('src/components/orders/OrdersList.jsx', 'utf8');

c = c.replace(/<AnimatePresence mode="wait">/g, '');
c = c.replace(/<AnimatePresence mode="popLayout">/g, '');
c = c.replace(/<\/AnimatePresence>/g, '');

c = c.replace(/<motion\.div\s*key=\{filter\}[\s\S]*?transition=\{\{ duration: 0\.2 \}\}>/, '<div key={filter} className="animate-in fade-in duration-100">');
c = c.replace(/<\/motion\.div>\s*<\/div>\s*;\s*}\);\s*export default OrdersList;/, '</div>\n    </div>);\n\n});\n\nexport default OrdersList;');

fs.writeFileSync('src/components/orders/OrdersList.jsx', c);
console.log("Fixed OrdersList!");
