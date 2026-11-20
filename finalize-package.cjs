const fs=require('node:fs'),path=require('node:path');
// Keep Electron's original runtime bytes. Resource-editing the executable creates
// a new launcher hash on every build and can fail Windows Application Control.
// Glass branding comes from BrowserWindow's icon and the shortcut's Glass.ico.
const folder=path.join(__dirname,'release','Glass-win32-x64');
if(!fs.existsSync(path.join(folder,'resources','app.asar')))throw Error('Package Glass with --asar before finalizing.');
fs.copyFileSync(path.join(__dirname,'node_modules','electron','dist','electron.exe'),path.join(folder,'Glass.exe'));
fs.copyFileSync(path.join(__dirname,'icon.ico'),path.join(folder,'Glass.ico'));
console.log('Finalized Glass with the unmodified Electron runtime and Glass shortcut icon.');
