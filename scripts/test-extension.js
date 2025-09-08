#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Miden Wallet Extension Build...\n');

const distDir = 'dist';
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'background.js',
  'content.js'
];

const requiredFolders = [
  'icons',
  'public'
];

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Dist directory not found!');
  console.log('💡 Run "npm run build" first');
  process.exit(1);
}

console.log('✅ Dist directory found');

// Check required files
console.log('\n📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check required folders
console.log('\n📁 Checking required folders:');
let allFoldersExist = true;

requiredFolders.forEach(folder => {
  const folderPath = path.join(distDir, folder);
  if (fs.existsSync(folderPath)) {
    const stats = fs.statSync(folderPath);
    console.log(`✅ ${folder}/ (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`❌ ${folder}/ - MISSING`);
    allFoldersExist = false;
  }
});

// Check manifest.json content
console.log('\n📋 Checking manifest.json:');
try {
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  console.log(`✅ Manifest version: ${manifestContent.manifest_version}`);
  console.log(`✅ Extension name: ${manifestContent.name}`);
  console.log(`✅ Version: ${manifestContent.version}`);
  
  if (manifestContent.manifest_version === 3) {
    console.log('✅ Using Manifest V3 (modern)');
  } else {
    console.log('⚠️  Using older manifest version');
  }
  
} catch (error) {
  console.log('❌ Failed to parse manifest.json:', error.message);
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist && allFoldersExist) {
  console.log('🎉 Extension build is READY!');
  console.log('\n📱 To install in Chrome:');
  console.log('1. Open chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select the "dist" folder');
  console.log('\n🚀 Extension should now appear in your browser!');
} else {
  console.log('❌ Extension build has issues');
  console.log('💡 Check the missing files/folders above');
}

console.log('\n' + '='.repeat(50));
