const fs=require('node:fs'),path=require('node:path');
const {atomicWrite}=require('./core.cjs'),{serverURL}=require('./collaboration.cjs');
class SharingSettings {
 constructor(root,{protect,unprotect}){this.file=path.join(root,'sharing-service.json');this.protect=protect;this.unprotect=unprotect;}
 read(){if(!fs.existsSync(this.file))return null;const value=JSON.parse(fs.readFileSync(this.file,'utf8')),server=serverURL(value.server);if(!server.startsWith('wss://'))throw Error('Automatic internet sharing requires WSS.');return {server,createToken:this.unprotect(value.sealed)};}
 status(){try{const value=this.read();return {configured:!!value,server:value?.server||''};}catch{return {configured:false,server:'',error:'Sharing service settings could not be unlocked. Configure the service again.'};}}
 save({server,createToken}){server=serverURL(server);if(!server.startsWith('wss://'))throw Error('Use the secure wss:// address of your sharing service.');if(typeof createToken!=='string'||createToken.length<32||createToken.length>256)throw Error('Use the service creation token supplied during setup (32–256 characters).');atomicWrite(this.file,JSON.stringify({v:1,server,sealed:this.protect(createToken)}));return this.status();}
}
module.exports={SharingSettings};
