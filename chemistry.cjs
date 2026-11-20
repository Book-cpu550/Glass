const {utilityProcess}=require('electron');
const path=require('node:path');
const fs=require('node:fs'),{atomicWrite}=require('./core.cjs'),input=require('./chem-input.cjs');
let job=null;
let lookupController=null;
let generation=0;
function cancel(){++generation;lookupController?.abort();lookupController=null;if(job)job.finish(Error('Chemistry generation cancelled.'));}
function start(action,data){
 return new Promise((resolve,reject)=>{
  const child=utilityProcess.fork(path.join(__dirname,'chem-worker.cjs'),[],{serviceName:'Glass chemistry'});let timer;
  const task={finish(error,result){if(job!==task)return;job=null;clearTimeout(timer);child.kill();error?reject(error):resolve(result);}};job=task;
  child.on('message',message=>task.finish(message.ok?null:Error(message.error),message.result));child.on('exit',code=>task.finish(Error('The chemistry engine stopped ('+code+'). Try a smaller structure.')));child.on('error',()=>task.finish(Error('The chemistry engine could not start.')));
  timer=setTimeout(()=>task.finish(Error('This structure took too long to generate. Try a smaller structure.')),20000);child.once('spawn',()=>{if(job===task)try{child.postMessage({action,data});}catch{task.finish(Error('The chemistry input could not be sent to the local engine.'));}});
 });
}
function run(action,data){cancel();return start(action,data);}
async function build(data,folder,fetcher){
 cancel();const token=generation;const ensureCurrent=()=>{if(token!==generation)throw Error('Chemistry generation cancelled.');};
 const parsed=input.parse(data.input,data.mode);const file=path.join(folder,'chemistry-cache.json');let cache={};try{cache=JSON.parse(fs.readFileSync(file,'utf8'));if(!cache||typeof cache!=='object'||Array.isArray(cache))cache={};}catch{}
 const custom=Object.create(null);for(const s of parsed.species){if(s.direct||input.candidates(s.token).length)continue;const query=input.plain(s.token);if(Object.hasOwn(cache,query)&&Array.isArray(cache[query]))custom[query]=cache[query];
  else if(data.online===true){
   const controller=new AbortController();lookupController=controller;const timer=setTimeout(()=>controller.abort(),12000);
   try{const type=input.isFormula(query)?'fastformula':'name';const url='https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/'+type+'/'+encodeURIComponent(query)+'/property/SMILES,IUPACName,MolecularFormula/JSON?MaxRecords=12';const response=await fetcher(url,{signal:controller.signal});ensureCurrent();if(!response.ok)throw Error(response.status===404?'No PubChem match for “'+query+'”.':'PubChem lookup failed ('+response.status+'). Try again later.');const text=await response.text();ensureCurrent();if(text.length>300000)throw Error('Too many matches. Use a specific name or SMILES.');const result=JSON.parse(text);custom[query]=(result.PropertyTable?.Properties||[]).slice(0,12).filter(c=>c.SMILES).map(c=>({id:'pubchem-'+c.CID,title:c.IUPACName||'CID '+c.CID,smiles:c.SMILES,formula:c.MolecularFormula,source:'PubChem CID '+c.CID}));if(!custom[query].length)throw Error('No usable structure found. Enter SMILES.');cache[query]=custom[query];const keys=Object.keys(cache);for(const key of keys.slice(0,Math.max(0,keys.length-200)))delete cache[key];atomicWrite(file,JSON.stringify(cache));
   }finally{clearTimeout(timer);if(lookupController===controller)lookupController=null;}
  }
 }
 ensureCurrent();return start('build',{...data,custom});
}
module.exports={run,cancel,build};
