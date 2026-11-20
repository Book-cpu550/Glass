const fs=require('node:fs'),path=require('node:path');
const {atomicWrite}=require('./core.cjs');
const search=require('./note-search.js');
function summary(note){
 const text=search.text(note),raw=JSON.stringify(note.doc||note.blocks);
 return {id:note.id,title:note.title,notebookId:note.notebookId||'personal',created:note.created,updated:note.updated,folder:note.folder||'',tags:note.tags||[],pinned:!!note.pinned,searchText:text,hasMath:/"(?:inlineMath|displayMath|math)"/.test(raw),hasDrawing:/"drawing"/.test(raw),hasTable:/"table"/.test(raw),links:[...text.matchAll(/\[\[([^\]]+)\]\]/g)].map(m=>m[1]),_summary:true};
}
class NoteIndex{
 constructor(root,book){this.root=root;this.book=book;this.file=path.join(root,'search-index.json');this.entries={};try{const data=JSON.parse(fs.readFileSync(this.file));if(data.version===1)this.entries=data.entries||{};}catch{}}
 list(warnings=[]){const folder=path.join(this.root,'notes');fs.mkdirSync(folder,{recursive:true});const found=new Set();let changed=false;
  for(const name of fs.readdirSync(folder).filter(n=>/^[a-zA-Z0-9-]{1,80}\.json$/.test(n))){const id=name.slice(0,-5),stat=fs.statSync(path.join(folder,name)),stamp=stat.mtimeMs+':'+stat.size;found.add(id);if(this.entries[id]?.stamp===stamp)continue;try{this.entries[id]={stamp,note:summary(this.book.read(id,warnings))};changed=true;}catch{delete this.entries[id];warnings.push('Could not read '+name+'. The original file is untouched.');}}
  for(const id of Object.keys(this.entries))if(!found.has(id)){delete this.entries[id];changed=true;}
  if(changed)this.write();return Object.values(this.entries).map(e=>e.note);
 }
 update(note){const stat=fs.statSync(this.book.file(note.id));this.entries[note.id]={stamp:stat.mtimeMs+':'+stat.size,note:summary(note)};this.write();}
 write(){atomicWrite(this.file,JSON.stringify({version:1,entries:this.entries}));}
}
module.exports={NoteIndex,summary};
