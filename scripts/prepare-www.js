// ওয়েব ফাইলগুলো www/ ফোল্ডারে কপি করে (Capacitor এখান থেকে অ্যাপ বানায়)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const files = ['index.html','style.css','app.js','store.js','ui.js','security.js',
  'icons.js','i18n.js','sw.js','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png'];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
files.forEach(f => {
  if (!fs.existsSync(path.join(root, f))) { console.error('Missing: ' + f); process.exit(1); }
  fs.copyFileSync(path.join(root, f), path.join(out, f));
});
console.log('www/ ready (' + files.length + ' files)');
