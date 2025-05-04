const fs = require('fs-extra');
const path = require('path');

// Ensure the dist directory exists
fs.ensureDirSync(path.join(__dirname, '../dist'));

// Copy _locales directory
fs.copySync(
  path.join(__dirname, '../_locales'),
  path.join(__dirname, '../dist/_locales'),
  { overwrite: true }
);

// Copy individual files
const filesToCopy = ['manifest.json', 'style.css', 'otak-voice-128.png'];

filesToCopy.forEach(file => {
  fs.copySync(
    path.join(__dirname, '../', file),
    path.join(__dirname, '../dist/', file),
    { overwrite: true }
  );
  console.log(`Copied ${file} to dist/`);
});

console.log('All assets copied successfully!');