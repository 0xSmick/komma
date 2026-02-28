// Patches Electron.app so it shows "Komma" with the correct icon in dev mode
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

if (process.platform !== 'darwin') process.exit(0);

const electronDir = path.join(__dirname, '..', 'node_modules', 'electron');
const distDir = path.join(electronDir, 'dist');
const srcApp = path.join(distDir, 'Electron.app');
const destApp = path.join(distDir, 'Komma.app');

// Rename bundle (the definitive fix for macOS Cmd+Tab name)
if (fs.existsSync(srcApp)) {
  fs.renameSync(srcApp, destApp);
}

if (!fs.existsSync(destApp)) process.exit(0);

// Update path.txt so the electron package finds the renamed bundle
fs.writeFileSync(path.join(electronDir, 'path.txt'), 'Komma.app/Contents/MacOS/Electron');

// Patch Info.plist
const plist = path.join(destApp, 'Contents', 'Info.plist');
execSync(`/usr/libexec/PlistBuddy -c "Set CFBundleName Komma" "${plist}"`);
execSync(`/usr/libexec/PlistBuddy -c "Set CFBundleDisplayName Komma" "${plist}"`);

// Localized display name
const lprojDir = path.join(destApp, 'Contents', 'Resources', 'en.lproj');
fs.mkdirSync(lprojDir, { recursive: true });
fs.writeFileSync(path.join(lprojDir, 'InfoPlist.strings'), 'CFBundleName = "Komma";\nCFBundleDisplayName = "Komma";\n');

// Copy app icon
const iconSrc = path.join(__dirname, '..', 'build', 'icon.icns');
const iconDest = path.join(destApp, 'Contents', 'Resources', 'electron.icns');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, iconDest);
}

console.log('Patched Electron → Komma (bundle rename + plist + icon)');
