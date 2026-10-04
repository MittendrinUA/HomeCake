const fs = require('fs');
let text = fs.readFileSync('src/App.jsx', 'utf8');

const loaderComponent = `
const SuspenseLoader = () => (
  <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-8 mt-20">
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div className="absolute inset-0 border-4 border-[#2A2323] rounded-full"></div>
      <div className="absolute inset-0 border-4 border-[#D4AF37] rounded-full border-t-transparent animate-spin"></div>
    </div>
  </div>
);

export default function App() {
`;

text = text.replace('export default function App() {', loaderComponent);
text = text.replace(/<div className="p-4">\{t\("auto\.t_1", "Завантаження\.\.\."\)\}<\/div>/g, '<SuspenseLoader />');
text = text.replace(/<div className="p-4 text-center">\{t\("auto\.t_1", "Завантаження\.\.\."\)\}<\/div>/g, '<SuspenseLoader />');

fs.writeFileSync('src/App.jsx', text);
console.log('Replaced successfully');
