/**
 * PWA Icon Generator
 * 
 * This script converts SVG icons to PNG format for PWA support.
 * Run: node scripts/generate-pwa-icons.cjs
 * 
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Installing sharp...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'icon-180x180.png' },
  { size: 120, name: 'icon-120x120.png' },
];

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const sourceSvg = path.join(__dirname, '..', 'public', 'sacco_logo_dark.svg');

async function generateIcons() {
  console.log('Generating PWA icons from sacco_logo_dark.svg...\n');
  
  if (!fs.existsSync(sourceSvg)) {
    console.error('❌ Source SVG not found:', sourceSvg);
    return;
  }
  
  for (const { size, name } of sizes) {
    const pngPath = path.join(iconsDir, name);
    
    try {
      await sharp(sourceSvg)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(` Failed to generate ${name}:`, error.message);
    }
  }
  
  console.log('\n✨ Done! Icons saved to public/icons/');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open Chrome DevTools > Application > Manifest to verify');
  console.log('3. The install icon should appear in the URL bar');
}

generateIcons().catch(console.error);
