const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DIRECTORY}=require('./matlab-runtime.cjs');
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function verify(root,manifest){return manifest.critical?.length&&manifest.critical.every(entry=>{const file=path.resolve(root,entry.path);return file.startsWith(path.resolve(root)+path.sep)&&fs.existsSync(file)&&digest(file)===entry.sha256;});}
function copyRuntime(source,target){const metadata=path.join(source,'GLASS-RUNTIME.json');if(!fs.existsSync(metadata))throw Error('The verified bundled runtime is missing.');const manifest=JSON.parse(fs.readFileSync(metadata,'utf8'));if(!verify(source,manifest))throw Error('Bundled runtime verification failed.');const installed=path.join(target,'GLASS-RUNTIME.json');if(fs.existsSync(installed)){try{const previous=JSON.parse(fs.readFileSync(installed,'utf8'));if(previous.sha256===manifest.sha256&&verify(target,manifest))return false;}catch{}}
 fs.cpSync(source,target,{recursive:true,force:true});if(!verify(target,manifest))throw Error('Copied runtime verification failed.');return true;}
module.exports={DIRECTORY,copyRuntime,verify};
