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

// Copy and modify manifest.json
const manifestPath = path.join(__dirname, '../manifest.json');
const manifestContent = fs.readJsonSync(manifestPath);

// Fix paths in manifest.json
if (manifestContent.background && manifestContent.background.service_worker) {
  manifestContent.background.service_worker = manifestContent.background.service_worker.replace('dist/', '');
}

if (manifestContent.content_scripts) {
  manifestContent.content_scripts.forEach(script => {
    if (script.js) {
      script.js = script.js.map(js => js.replace('dist/', ''));
    }
  });
}

// Write modified manifest.json to dist directory
fs.writeJsonSync(
  path.join(__dirname, '../dist/manifest.json'),
  manifestContent,
  { spaces: 2 }
);
console.log('Copied and modified manifest.json to dist/');

// Copy other files
const filesToCopy = ['style.css', 'otak-voice-128.png'];

filesToCopy.forEach(file => {
  fs.copySync(
    path.join(__dirname, '../', file),
    path.join(__dirname, '../dist/', file),
    { overwrite: true }
  );
  console.log(`Copied ${file} to dist/`);
});

console.log('All assets copied successfully!');