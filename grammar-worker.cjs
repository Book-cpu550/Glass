const {OfflineGrammar}=require('./offline-grammar.cjs');
const engine=OfflineGrammar.create(process.argv[2]);
process.parentPort.on('message',async({data})=>{try{const grammar=await engine;let result;if(data.action==='add')result=grammar.add(data.word);else if(data.action==='words')result=grammar.words;else result=grammar.check(data.segments);process.parentPort.postMessage({id:data.id,result});}catch(error){process.parentPort.postMessage({id:data.id,error:error.message});}});
