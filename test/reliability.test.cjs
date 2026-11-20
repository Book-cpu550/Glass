const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Notebook}=require('../notebook.cjs'),{validDocument,parseBlocks}=require('../document-tools.js'),grammar=require('../grammar-tools.js');
test('invalid rich documents are backed up and recovered from blocks',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-safe-'));try{
  const note={id:'bad-doc',title:'Important',blocks:[{type:'text',value:'Recoverable content'}],doc:{type:'doc',content:[{type:'unknownNode'}]}};
  fs.mkdirSync(path.join(root,'notes'));fs.writeFileSync(path.join(root,'notes','bad-doc.json'),JSON.stringify(note));const book=new Notebook(root,()=>({})),warnings=[];
  const recovered=book.read('bad-doc',warnings);assert.equal(recovered.doc,undefined);assert.ok(warnings.length);assert.ok(fs.readdirSync(path.join(root,'recovery-originals')).length);
  assert.equal(recovered.blocks[0].value,'Recoverable content');assert.throws(()=>book.save(note),/structure is invalid/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'notes','bad-doc.json'))),note);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('legacy transmission metadata is dropped while note content stays local',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-local-'));try{const book=new Notebook(root),note={id:'local',title:'Proof',blocks:[{type:'text',value:'Unchanged content'}],_sync:{pending:true}};book.save(note);const saved=book.read(note.id);assert.equal(saved._sync,undefined);assert.equal(saved.blocks[0].value,'Unchanged content');}finally{fs.rmSync(root,{recursive:true,force:true});}});

test('code fences, inline code, and escaped dollars remain text during import',()=>{
 const source='```python\nvalue="$$not math$$"\n```\nInline `$$code$$` and \\$5.\n\n$$x^2$$';const blocks=parseBlocks(source);
 assert.equal(blocks.filter(b=>b.type==='math').length,1);assert.equal(blocks.at(-1).value,'x^2');assert.ok(blocks[0].value.includes('$$not math$$'));assert.ok(blocks[0].value.includes('`$$code$$`'));
 assert.ok(validDocument({type:'doc',content:[{type:'paragraph'}]}));
});
test('grammar packets deduplicate context and split larger requests',()=>{
 const text='word '.repeat(400),segments=Array.from({length:200},(_,id)=>({id,text:'word ',contextId:1,context:id===0?text:''}));const packet=grammar.pack(segments);
 assert.equal(packet.contexts.length,1);assert.ok(JSON.stringify(packet).length<20000);assert.ok(grammar.batches(packet).every(batch=>JSON.stringify(batch).length<15000));
 assert.equal(grammar.quick([{id:0,text:'This are a example of teh proof.'}]).suggestions[0].replacement,'This is an example of the proof.');
});
test('local versions retain previous content and support restoration',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-history-'));try{const book=new Notebook(root,()=>({})),note={id:'history',title:'Version',blocks:[{type:'text',value:'Original'}]};book.save(note);book.save({...note,blocks:[{type:'text',value:'Changed'}]},{forceVersion:true});const versions=book.versions(note.id);assert.equal(versions.length,1);assert.equal(book.restoreVersion(note.id,versions[0]).blocks[0].value,'Original');assert.ok(book.versions(note.id).length>=2);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
