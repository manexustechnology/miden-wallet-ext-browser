#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const EXTENSION_NAME = 'miden-wallet-extension';
const VERSION = '1.0.0';
const BUILD_DIR = 'dist';
const OUTPUT_DIR = 'builds';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create archive
const output = fs.createWriteStream(path.join(OUTPUT_DIR, `${EXTENSION_NAME}-v${VERSION}.zip`));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Extension built successfully!`);
  console.log(`📦 Size: ${sizeInMB} MB`);
  console.log(`📁 Output: ${OUTPUT_DIR}/${EXTENSION_NAME}-v${VERSION}.zip`);
  console.log(`\n🚀 Ready to upload to Chrome Web Store!`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add files to archive
console.log('📁 Adding files to extension package...');

// Add manifest
archive.file('dist/manifest.json', { name: 'manifest.json' });

// Add built JavaScript files
archive.file('dist/popup.js', { name: 'popup.js' });
archive.file('dist/background.js', { name: 'background.js' });
archive.file('dist/content.js', { name: 'content.js' });

// Add HTML files
archive.file('dist/popup.html', { name: 'popup.html' });

// Add icons
if (fs.existsSync('dist/icons')) {
  archive.directory('dist/icons', 'icons');
}

// Add public assets
if (fs.existsSync('dist/public')) {
  archive.directory('dist/public', 'public');
}

// Add source maps for debugging (optional)
if (fs.existsSync('dist/popup.js.map')) {
  archive.file('dist/popup.js.map', { name: 'popup.js.map' });
}
if (fs.existsSync('dist/background.js.map')) {
  archive.file('dist/background.js.map', { name: 'background.js.map' });
}
if (fs.existsSync('dist/content.js.map')) {
  archive.file('dist/content.js.map', { name: 'content.js.map' });
}

// Finalize archive
archive.finalize();

console.log('🔄 Building extension package...');
