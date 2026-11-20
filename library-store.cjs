const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {atomicWrite}=require('./core.cjs');
const builtins=require('./theorem-data.js');
const chemistry=require('./chemistry-data.js'),biology=require('./biology-data.js');
const kinds=['Theorem','Law','Principle','Rule','Formula','Identity','Definition'];
function validateEntry(input){
 const subject=input?.subject==='biology'?'biology':input?.subject==='chemistry'?'chemistry':'math',reference=subject==='biology'?biology:subject==='chemistry'?chemistry:builtins;
 if(!input||!kinds.includes(input.kind)||!reference.courses.includes(input.level))throw Error('Choose a valid entry type and course.');
 const result={};
 for(const [key,max]of Object.entries({title:180,topic:180,statement:6000,conditions:4000,latex:6000,example:4000,proofIdea:6000,pitfall:3000,sourceUrl:2000,sourceTitle:300})){
  const value=input[key]??'';if(typeof value!=='string'||value.length>max)throw Error('Invalid or excessively long '+key);result[key]=value.trim();
 }
 if(!result.title||!result.statement)throw Error('Give the entry a name and a statement.');
 if(result.sourceUrl&&!/^https:\/\//i.test(result.sourceUrl))throw Error('Use an HTTPS source link.');
 result.subject=subject;result.kind=input.kind;result.level=input.level;result.origin=input.origin==='AI-assisted'?'AI-assisted':'Custom';
 result.id=input.id&&/^custom-[a-zA-Z0-9-]+$/.test(input.id)?input.id:'custom-'+crypto.randomUUID();
 result.updated=new Date().toISOString();result.tags=(result.title+' '+result.topic+' '+result.statement).toLowerCase();return result;
}
class LibraryStore{
 constructor(root){this.root=root;}
 read(){const file=path.join(this.root,'library.json');if(!fs.existsSync(file))return {entries:[],favorites:[]};try{const data=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(data.entries)||!Array.isArray(data.favorites))throw Error();const seen=new Set(),entries=data.entries.filter(entry=>{try{if(!entry||typeof entry.id!=='string'||!/^custom-[a-zA-Z0-9-]{1,100}$/.test(entry.id)||seen.has(entry.id))return false;validateEntry(entry);seen.add(entry.id);return true;}catch{return false;}}),ids=new Set([...builtins.entries,...chemistry.entries,...biology.entries,...entries].map(e=>e.id));return {entries,favorites:[...new Set(data.favorites.filter(id=>typeof id==='string'&&ids.has(id)))],...(entries.length!==data.entries.length?{warning:'Some damaged custom library entries were hidden. The original file is unchanged; any subsequent save keeps it in library-history.'}:{})};}catch{throw Error('The local library file could not be read. It was left untouched. Check library-history for earlier versions.');}}
 write(data){const file=path.join(this.root,'library.json');if(fs.existsSync(file)){
  const folder=path.join(this.root,'library-history');atomicWrite(path.join(folder,Date.now()+'-'+crypto.randomUUID().slice(0,8)+'.json'),fs.readFileSync(file));
  for(const name of fs.readdirSync(folder).sort().reverse().slice(30))fs.unlinkSync(path.join(folder,name));
 }atomicWrite(file,JSON.stringify({entries:data.entries,favorites:data.favorites},null,2));return data;}
 save(input){const entry=validateEntry(input),data=this.read();const duplicate=data.entries.find(e=>e.id!==entry.id&&(e.subject||'math')===entry.subject&&e.kind===entry.kind&&e.title.toLowerCase()===entry.title.toLowerCase());if(duplicate)throw Error('An entry with this name and type already exists. Edit it or choose a different name.');const index=data.entries.findIndex(e=>e.id===entry.id);if(index<0)data.entries.push(entry);else data.entries[index]=entry;this.write(data);return entry;}
 favorite(id,value){const data=this.read();if(![...builtins.entries,...chemistry.entries,...biology.entries,...data.entries].some(e=>e.id===id))throw Error('Unknown library entry');data.favorites=data.favorites.filter(key=>key!==id);if(value)data.favorites.push(id);this.write(data);return data.favorites;}
 remove(id){if(!id.startsWith('custom-'))throw Error('Built-in reference entries cannot be deleted.');const data=this.read();data.entries=data.entries.filter(e=>e.id!==id);data.favorites=data.favorites.filter(key=>key!==id);return this.write(data);}
}
module.exports={LibraryStore,validateEntry,kinds};
