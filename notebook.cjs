const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {atomicWrite,validateNote}=require('./core.cjs');
const {validDocument}=require('./document-tools.js');
const {substantial}=require('./history-policy.cjs');
class Notebook{
 constructor(root){this.root=root;}
 file(id){if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Invalid note ID');return path.join(this.root,'notes',id+'.json');}
 preserve(file,category='recovery-originals'){
  const content=fs.readFileSync(file),hash=crypto.createHash('sha256').update(content).digest('hex').slice(0,16);
  const target=path.join(this.root,category,path.basename(file,'.json')+'-'+hash+'.json');
  if(!fs.existsSync(target))atomicWrite(target,content);return target;
 }
 read(id,warnings=[]){
  const file=this.file(id),note=validateNote(JSON.parse(fs.readFileSync(file,'utf8')));
  if(note.id!==id)throw Error('Note ID does not match filename');
  if(note.doc&&!validDocument(note.doc)){
   this.preserve(file);delete note.doc;
   warnings.push(`Recovered “${note.title}” from its text and equations. Its original file was preserved in recovery-originals.`);
  }
  const fallback=fs.statSync(file).mtime.toISOString();
  if(!Number.isFinite(Date.parse(note.created)))note.created=fallback;
  if(!Number.isFinite(Date.parse(note.updated)))note.updated=fallback;
  delete note._sync;return note;
 }
 versions(id){this.file(id);const directory=path.join(this.root,'versions',id);if(!fs.existsSync(directory))return [];return fs.readdirSync(directory).filter(name=>name.endsWith('.json')).sort().reverse();}
 snapshot(id,raw,force=false){
  const versions=this.versions(id),latest=versions[0];
  atomicWrite(path.join(this.root,'versions',id,Date.now()+'-'+crypto.randomUUID().slice(0,8)+'.json'),raw);
  for(const name of this.versions(id).slice(50))fs.unlinkSync(path.join(this.root,'versions',id,name));
 }
 save(input,{forceVersion=false}={}){
  const note=structuredClone(validateNote(input)),file=this.file(note.id);
  if(note.doc&&!validDocument(note.doc))throw Error('Document structure is invalid. Your existing saved note was not replaced.');
  let previous=null,checkpoint=null,advance=false;
  const baseline=path.join(this.root,'history-baselines',note.id+'.json');
  if(fs.existsSync(file)){
   const raw=fs.readFileSync(file,'utf8');previous=JSON.parse(raw);
   if(previous.doc&&!validDocument(previous.doc))this.preserve(file);
   if(note.doc&&!previous.doc&&!fs.existsSync(path.join(this.root,'migration-backups',note.id+'.json')))atomicWrite(path.join(this.root,'migration-backups',note.id+'.json'),raw);
   checkpoint=previous;
   if(fs.existsSync(baseline)){try{checkpoint=validateNote(JSON.parse(fs.readFileSync(baseline,'utf8')));if(checkpoint.doc&&!validDocument(checkpoint.doc))throw Error('Invalid history baseline document');if(checkpoint.id!==note.id)throw Error('Mismatched history baseline');}catch{this.preserve(baseline);checkpoint=previous;advance=true;}}
   if(forceVersion){if(JSON.stringify(previous.doc||previous.blocks)!==JSON.stringify(note.doc||note.blocks)||previous.title!==note.title)this.snapshot(note.id,raw,true);advance=true;}
   else if(substantial(checkpoint,note)){this.snapshot(note.id,JSON.stringify(checkpoint,null,2));advance=true;}
  }
  delete note._sync;
  atomicWrite(file,JSON.stringify(note,null,2));
  if(advance||!fs.existsSync(baseline))atomicWrite(baseline,JSON.stringify(advance?note:checkpoint||note,null,2));return note;
 }
 getVersion(id,name){
  if(!this.versions(id).includes(name))throw Error('Unknown saved version');
  const note=validateNote(JSON.parse(fs.readFileSync(path.join(this.root,'versions',id,name),'utf8')));
  if(note.id!==id||note.doc&&!validDocument(note.doc))throw Error('This saved version is damaged. It has not been changed.');
  return note;
 }
 restoreVersion(id,name){
  const restored=this.getVersion(id,name),current=this.read(id);if(current.shared)throw Error('Restore a shared version as a new local copy to protect collaborators’ work.');delete restored.shared;restored.id=id;restored.notebookId=current.notebookId||'personal';restored.updated=new Date().toISOString();return this.save(restored,{forceVersion:true});
 }
}
module.exports={Notebook};
