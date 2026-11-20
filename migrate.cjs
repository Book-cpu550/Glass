const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function migrate(local,legacy){
 if(fs.existsSync(local)||!fs.existsSync(legacy))return false;
 const staging=local+'.migrating-'+crypto.randomUUID();fs.mkdirSync(staging,{recursive:true});
 // Publish the new data folder only after the complete copy succeeds. Keep the old folder intact.
 for(const name of ['settings.json','library.json','notes','versions','drawing-drafts','archive','migration-backups','recovery-originals','library-history']){const source=path.join(legacy,name);if(fs.existsSync(source))fs.cpSync(source,path.join(staging,name),{recursive:true,errorOnExist:true});}
 fs.renameSync(staging,local);return true;
}
module.exports={migrate};
