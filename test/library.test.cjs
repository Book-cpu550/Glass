const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const library=require('../theorem-data.js'),katex=require('katex'),{LibraryStore}=require('../library-store.cjs'),{publicAddress}=require('../library-ai.cjs');
test('reference library covers every course, has unique IDs and valid display math',()=>{
 assert.ok(library.entries.length>=250);assert.equal(new Set(library.entries.map(e=>e.id)).size,library.entries.length);
 for(const course of library.courses.filter(c=>c!=='Custom'))assert.ok(library.entries.filter(e=>e.level===course).length>=10,course);
 for(const entry of library.entries){assert.ok(entry.title&&entry.conditions&&entry.example&&entry.statement,entry.title);assert.ok(library.sources[entry.source]);katex.renderToString(entry.latex,{throwOnError:true,trust:false});}
});
test('custom entries and favorites are saved locally with recoverable history',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-library-'));try{const store=new LibraryStore(root),entry=store.save({kind:'Formula',level:'Algebra 1',title:'A custom formula',statement:'A local test entry.',latex:'x=1'});store.favorite(entry.id,true);const reload=new LibraryStore(root).read();assert.equal(reload.entries[0].title,entry.title);assert.deepEqual(reload.favorites,[entry.id]);assert.ok(fs.readdirSync(path.join(root,'library-history')).length);assert.throws(()=>store.save({...entry,id:null}),/already exists/);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('library links reject private network addresses',()=>{for(const address of ['127.0.0.1','10.0.0.1','192.168.1.1','172.16.0.1','::1','fc00::1'])assert.equal(publicAddress(address),false);assert.equal(publicAddress('8.8.8.8'),true);});
