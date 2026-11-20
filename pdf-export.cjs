const {BrowserWindow,utilityProcess}=require('electron'),path=require('node:path');
const {validateNote}=require('./core.cjs'),{validDocument}=require('./document-tools.js');
const fs=require('node:fs'),crypto=require('node:crypto');
function writePDF(file,bytes){
 return new Promise((resolve,reject)=>{
  const temp=file+'.'+crypto.randomUUID()+'.tmp';const writer=utilityProcess.fork(path.join(__dirname,'pdf-writer.cjs'),[],{stdio:'ignore',serviceName:'Mathdesk PDF writer'});let finished=false;
  const done=error=>{if(finished)return;finished=true;clearTimeout(timeout);writer.kill();if(error){fs.promises.unlink(temp).catch(()=>{});reject(Error('The PDF could not be saved. Close it in other applications or choose another location. '+error));}else resolve();};
  const timeout=setTimeout(()=>done('The file operation timed out.'),15000);
  writer.once('spawn',()=>writer.postMessage({file,temp,bytes}));writer.once('message',message=>done(message.ok?null:message.error));writer.once('exit',()=>{if(!finished)done('The file writer stopped unexpectedly.');});writer.once('error',()=>done('The file writer could not start.'));
 });
}
function noteStyle(note,settings){return note.printStyle==='mla'?{pageSize:'Letter',margin:25.4,...settings}:settings;}
async function createPDF(input,settings={}){
 const printOptions=require('./pdf-options.cjs').options(noteStyle(input,settings));
 const note=structuredClone(validateNote(input));if(note.doc&&!validDocument(note.doc))throw Error('The document structure is invalid. Your local note was not changed.');
 const printWindow=new BrowserWindow({show:false,width:1000,height:1000,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false}});
 printWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 printWindow.webContents.on('will-navigate',event=>event.preventDefault());
 let timeout;
 try{
  const operation=(async()=>{
  await printWindow.loadFile(path.join(__dirname,'pdf.html'));
  const result=await printWindow.webContents.executeJavaScript('window.renderPDF('+JSON.stringify(note)+','+JSON.stringify(printOptions)+')');
  if(result.errors.length)throw Error('PDF export stopped because an equation could not be rendered: '+result.errors[0]);
  return Buffer.from(await printWindow.webContents.printToPDF({printBackground:true,pageSize:printOptions.pageSize,landscape:printOptions.landscape,preferCSSPageSize:true,displayHeaderFooter:printOptions.pageNumbers,headerTemplate:note.printStyle==='mla'?'<div style="width:100%;text-align:right;margin-right:25.4mm;font:12pt Times New Roman">'+String(note.mlaSurname||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))+' <span class="pageNumber"></span></div>':'<span></span>',footerTemplate:note.printStyle==='mla'?'<span></span>':'<div style="width:100%;text-align:center;font:9px Arial;color:#777"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'}));
  })();
  return await Promise.race([operation,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('PDF generation took too long. Try exporting a shorter document.')),45000);})]);
 }finally{clearTimeout(timeout);if(!printWindow.isDestroyed())printWindow.destroy();}
}
module.exports={createPDF,writePDF};
