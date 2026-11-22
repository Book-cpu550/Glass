const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Backups}=require('../backups.cjs'),{Notebook}=require('../notebook.cjs'),{Notebooks}=require('../notebooks.cjs'),{exportEditable}=require('../workspace-files.cjs');
test('single-notebook exports isolate all note-owned files and metadata and restore without replacing other notebooks',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glass-scoped-export-')),destination=fs.mkdtempSync(path.join(os.tmpdir(),'glass-scoped-restore-'));
 try{
  const book=new Notebook(root),notebooks=new Notebooks(root),other=notebooks.update({action:'create',name:'Private notebook'}).activeId;
  const put=(name,data)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data));};
  book.save({id:'a',notebookId:'personal',title:'Chosen note',blocks:[]});book.save({id:'a-private',notebookId:other,title:'PRIVATE-SENTINEL',blocks:[]});
  for(const id of ['a','a-private']){
   for(const folder of ['citation-drafts','migration-backups','history-baselines'])put(folder+'/'+id+'.json',{title:id==='a'?'keep':'PRIVATE-SENTINEL'});
   for(const folder of ['versions','checkpoints'])put(folder+'/'+id+'/entry.json',{title:id==='a'?'keep':'PRIVATE-SENTINEL'});
   put('drawing-drafts/'+id+'-new.json',{title:id==='a'?'keep':'PRIVATE-SENTINEL'});
   put('drawing-drafts/'+id+'-'+('f'.repeat(64))+'.json',{title:id==='a'?'keep':'PRIVATE-SENTINEL'});
   put('recovery-originals/'+id+'-'+('f'.repeat(16))+'.json',{title:id==='a'?'keep':'PRIVATE-SENTINEL'});
  }
  for(const name of ['library.json','biology-tools-draft.json','personal-dictionary.json','library-history/private.json'])put(name,{title:'PRIVATE-SENTINEL'});
  const store=new Backups(root),created=store.create(path.join(root,'backups'),{notebookId:'personal'}),backup=store.inspect(created.file),names=backup.entries.map(e=>e.name);
  assert.equal(backup.notebookId,'personal');assert.ok(names.includes('citation-drafts/a.json'));assert.ok(names.includes('checkpoints/a/entry.json'));assert.ok(names.includes('drawing-drafts/a-new.json'));assert.ok(names.includes('recovery-originals/a-'+('f'.repeat(16))+'.json'));
  assert.ok(!JSON.stringify(backup.entries.map(e=>Buffer.from(e.data,'base64').toString())).includes('PRIVATE-SENTINEL'));
  assert.ok(names.every(n=>!n.includes('a-private')));assert.ok(!names.includes('library.json'));
  const index=JSON.parse(Buffer.from(backup.entries.find(e=>e.name==='notebooks.json').data,'base64'));assert.equal(index.notebooks.length,1);assert.equal(index.notebooks[0].id,'personal');
  const targetIndex=new Notebooks(destination),existing=targetIndex.update({action:'create',name:'Existing destination notebook'}).activeId;
  new Backups(destination).restore(created.file,path.join(destination,'backups'));const restored=targetIndex.read();assert.ok(restored.notebooks.some(n=>n.id===existing&&n.name==='Existing destination notebook'));assert.equal(restored.activeId,existing);assert.equal(new Notebook(destination).read('a').title,'Chosen note');
  const all=store.inspect(store.create(path.join(root,'backups')).file);assert.ok(all.entries.some(e=>e.name==='citation-drafts/a-private.json'));assert.ok(all.entries.some(e=>e.name==='library.json'));
 }finally{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(destination,{recursive:true,force:true});}
});
test('editable chemistry exports declare mhchem before inline and display chemistry commands',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glass-chem-export-'));
 try{const note={id:'chem',title:'Reaction notes',blocks:[],doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Water: '},{type:'inlineMath',attrs:{latex:'\\ce{H2O}'}}]},{type:'displayMath',attrs:{latex:'\\ce{2 H2 + O2 -> 2 H2O}'}},{type:'displayMath',attrs:{latex:'\\pu{298 K}'}}]}};
 const file=exportEditable(note,'tex',path.join(root,'chemistry.tex')).file,text=fs.readFileSync(file,'utf8');assert.ok(text.includes('\\usepackage[version=4]{mhchem}'));assert.ok(text.indexOf('{mhchem}')<text.indexOf('\\begin{document}'));assert.ok(text.includes('$\\ce{H2O}$'));assert.ok(text.includes('\\ce{2 H2 + O2 -> 2 H2O}'));assert.ok(text.includes('\\pu{298 K}'));assert.equal((text.match(/\\usepackage\[version=4\]\{mhchem\}/g)||[]).length,1);
 const md=exportEditable(note,'md',path.join(root,'chemistry.md')).file;assert.ok(fs.readFileSync(md,'utf8').includes('\\ce{H2O}'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
