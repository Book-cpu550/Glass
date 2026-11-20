const fs=require('node:fs');
process.parentPort.once('message',event=>{
 const {file,temp,bytes}=event.data;
 try{fs.writeFileSync(temp,Buffer.from(bytes),{flag:'wx'});fs.renameSync(temp,file);process.parentPort.postMessage({ok:true});}
 catch(error){try{fs.unlinkSync(temp);}catch{}process.parentPort.postMessage({ok:false,error:error.message});}
});
