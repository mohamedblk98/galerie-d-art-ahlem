const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules', '@designcodeio', 'threeui', 'lib-dist');

const patches = [
  {
    file: 'shaders/gallery/Gallery.js',
    replacements: [
      ['P.outputEncoding = S.sRGBEncoding;', 'P.outputColorSpace = S.SRGBColorSpace;'],
      ['e.encoding = S.sRGBEncoding,', 'e.colorSpace = S.SRGBColorSpace,'],
    ],
  },
  {
    file: 'shaders/skeuomorphic-toggle/glassToggleScene.js',
    replacements: [
      ['r.outputEncoding = t.sRGBEncoding,', 'r.outputColorSpace = t.SRGBColorSpace,'],
    ],
  },
  {
    file: 'shaders/temple-night/templeNightRenderer.js',
    replacements: [
      ['z.outputEncoding = le ? o.LinearEncoding : o.sRGBEncoding,', 'z.outputColorSpace = le ? o.LinearSRGBColorSpace : o.SRGBColorSpace,'],
      ['a.srgb !== !1 && (t.encoding = o.sRGBEncoding),', 'a.srgb !== !1 && (t.colorSpace = o.SRGBColorSpace),'],
    ],
  },
];

let changed = 0;
for (const p of patches) {
  const full = path.join(root, p.file);
  if (!fs.existsSync(full)) {
    console.warn('patch-threeui: missing', full);
    continue;
  }
  let src = fs.readFileSync(full, 'utf8');
  for (const [from, to] of p.replacements) {
    if (src.includes(to)) continue; // already patched
    if (!src.includes(from)) {
      console.warn('patch-threeui: pattern not found in', p.file, '->', from);
      continue;
    }
    src = src.split(from).join(to);
    changed++;
  }
  fs.writeFileSync(full, src, 'utf8');
}
console.log('patch-threeui: applied', changed, 'replacement(s)');