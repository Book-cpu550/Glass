const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {atomicWrite}=require('./core.cjs');
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(id);
class Notebooks{
 constructor(root){this.root=root;this.file=path.join(root,'notebooks.json');}
 read(notes=[]){let data={notebooks:[{id:'personal',name:'Personal notebook'}],activeId:'personal'};
  if(fs.existsSync(this.file)){try{const stored=JSON.parse(fs.readFileSync(this.file,'utf8'));if(!Array.isArray(stored.notebooks)||!stored.notebooks.length||stored.notebooks.some(n=>!validId(n.id)||typeof n.name!=='string'||!n.name.trim()||n.name.length>100)||new Set(stored.notebooks.map(n=>n.id)).size!==stored.notebooks.length)throw Error('Invalid notebook index');data=stored;}catch{const backup=this.file+'.unreadable-'+Date.now();fs.copyFileSync(this.file,backup);data.warning='The notebook list was recovered. Its original file was kept as a backup.';}}
  for(const note of notes){const id=note.notebookId||'personal';if(validId(id)&&!data.notebooks.some(n=>n.id===id))data.notebooks.push({id,name:id==='personal'?'Personal notebook':'Recovered notebook '+id.slice(0,8)});}
  if(!data.notebooks.some(n=>n.id===data.activeId))data.activeId=data.notebooks[0].id;this.write(data);return data;
 }
 write(data){const content=JSON.stringify({notebooks:data.notebooks,activeId:data.activeId},null,2);if(!fs.existsSync(this.file)||fs.readFileSync(this.file,'utf8')!==content)atomicWrite(this.file,content);return data;}
 update(input){const data=this.read();if(!input||!['create','rename','select','select-note'].includes(input.action))throw Error('Invalid notebook action');if(input.action==='select-note'){const entry=data.notebooks.find(n=>n.id===input.id);if(!entry||!validId(input.noteId))throw Error('Invalid selected note');entry.lastNoteId=input.noteId;return this.write(data);}if(input.action==='create'||input.action==='rename'){const name=typeof input.name==='string'?input.name.trim():'';if(!name||name.length>100)throw Error('Use a notebook name from 1 to 100 characters.');if(data.notebooks.some(n=>n.name.toLowerCase()===name.toLowerCase()&&(input.action==='create'||n.id!==input.id)))throw Error('A notebook with this name already exists.');if(input.action==='create'){const entry={id:crypto.randomUUID(),name};data.notebooks.push(entry);data.activeId=entry.id;}else{const entry=data.notebooks.find(n=>n.id===input.id);if(!entry)throw Error('Unknown notebook');entry.name=name;}}
  else{if(!data.notebooks.some(n=>n.id===input.id))throw Error('Unknown notebook');data.activeId=input.id;}return this.write(data);
 }
}
module.exports={Notebooks,validId};
