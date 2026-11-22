const fs=require('node:fs'),path=require('node:path');
// Keep Electron's original runtime bytes. Resource-editing the executable creates
// a new launcher hash on every build and can fail Windows Application Control.
// Window AppDetails/relaunch identity and repaired shortcuts use Glass.ico.
// The installer also explicitly supplies this icon for its shortcuts.
const folder=path.join(__dirname,'release','Glass-win32-x64');
if(!fs.existsSync(path.join(folder,'resources','app.asar')))throw Error('Package Glass with --asar before finalizing.');
fs.copyFileSync(path.join(__dirname,'node_modules','electron','dist','electron.exe'),path.join(folder,'Glass.exe'));
fs.copyFileSync(path.join(__dirname,'icon.ico'),path.join(folder,'Glass.ico'));
console.log('Finalized Glass with the unmodified Electron runtime and Glass shortcut icon.');

const {copyRuntime,verify}=require('./bundle-matlab-runtime.cjs');
const cache=path.resolve(__dirname,'runtimes','.package-cache'),resources=path.resolve(folder,'resources');
for(const directory of [require('./matlab-runtime.cjs').DIRECTORY,require('./python-runtime.cjs').DIRECTORY]){
 const cached=path.resolve(cache,directory),target=path.resolve(resources,directory);
 if(!cached.startsWith(cache+path.sep)||!target.startsWith(resources+path.sep))throw Error('Invalid runtime bundle path');
 if(fs.existsSync(cached)&&!fs.existsSync(target)){const manifest=JSON.parse(fs.readFileSync(path.join(cached,'GLASS-RUNTIME.json'),'utf8'));if(!verify(cached,manifest))throw Error('Runtime cache verification failed');fs.renameSync(cached,target);}else copyRuntime(path.join(__dirname,'runtimes',directory),target);
}
console.log('Bundled verified GNU Octave and Python runtimes.');
