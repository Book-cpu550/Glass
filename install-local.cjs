const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function installArchive({source,destination,isRunning=()=>false,rename=fs.renameSync,wait=delay,attempts=20}){
 if(path.basename(destination)!=='app.asar')throw Error('Expected the Glass app.asar destination.');
 if(isRunning())throw Error('Close Glass before installing. The installed app was not changed.');
 const expected=hash(source);if(fs.existsSync(destination)&&hash(destination)===expected)return {changed:false,hash:expected};
 fs.mkdirSync(path.dirname(destination),{recursive:true});const staged=destination+'.pending-'+crypto.randomUUID(),backup=destination+'.previous';
 fs.copyFileSync(source,staged);if(hash(staged)!==expected)throw Error('The staged update failed verification.');
 try{
  for(let attempt=0;attempt<attempts;attempt++){
   if(isRunning())throw Error('Glass reopened before installation. Close it and run the installer again.');
   try{if(fs.existsSync(destination))fs.copyFileSync(destination,backup);rename(staged,destination);if(hash(destination)!==expected){if(fs.existsSync(backup)){const rollback=destination+'.rollback-'+crypto.randomUUID();fs.copyFileSync(backup,rollback);fs.renameSync(rollback,destination);throw Error('Update verification failed; the previous app archive was restored.');}throw Error('Installed update verification failed.');}return {changed:true,hash:expected};}
   catch(error){if(!['EPERM','EACCES','EBUSY'].includes(error.code)||attempt===attempts-1)throw error;await wait(1000);}
  }
 }finally{if(fs.existsSync(staged))fs.unlinkSync(staged);}
}
function running(exe){const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"@(Get-CimInstance Win32_Process -Filter \"Name='Glass.exe'\" | Where-Object {$_.ExecutablePath -eq $env:GLASS_INSTALL_TARGET_EXE}).Count"],{windowsHide:true,encoding:'utf8',env:{...process.env,GLASS_INSTALL_TARGET_EXE:exe}});return Number(output.trim())>0;}
async function install(){
 const packaged=path.join(__dirname,'release','Glass-win32-x64'),target=path.join(process.env.LOCALAPPDATA,'Programs','Glass'),exe=path.join(target,'Glass.exe');
 if(!fs.existsSync(exe))throw Error('Install the full Glass package before applying a local update.');
 if(hash(exe)!==hash(path.join(packaged,'Glass.exe')))throw Error('The Electron runtime changed. A full application update is required.');
 const result=await installArchive({source:path.join(packaged,'resources','app.asar'),destination:path.join(target,'resources','app.asar'),isRunning:()=>running(exe)});
 console.log(result.changed?'Installed and verified the Glass update.':'The verified Glass update is already installed.');
}
module.exports={installArchive,hash};
if(require.main===module)install().catch(error=>{console.error('Update not applied: '+error.message);process.exitCode=1;});
