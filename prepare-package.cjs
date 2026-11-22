const fs=require('node:fs'),path=require('node:path');
const {verify}=require('./bundle-matlab-runtime.cjs');
const resources=path.resolve(__dirname,'release','Glass-win32-x64','resources'),cache=path.resolve(__dirname,'runtimes','.package-cache');
for(const directory of [require('./matlab-runtime.cjs').DIRECTORY,require('./python-runtime.cjs').DIRECTORY]){
 const source=path.resolve(resources,directory),target=path.resolve(cache,directory),metadata=path.join(source,'GLASS-RUNTIME.json');
 if(!source.startsWith(resources+path.sep)||!target.startsWith(cache+path.sep))throw Error('Invalid runtime cache path');
 if(!fs.existsSync(metadata)||fs.existsSync(target))continue;const manifest=JSON.parse(fs.readFileSync(metadata,'utf8'));if(!verify(source,manifest))throw Error('Packaged runtime verification failed');fs.mkdirSync(cache,{recursive:true});fs.renameSync(source,target);
}
