const {_electron}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'glass-prime-pdf-'));
(async()=>{const app=await _electron.launch({args:[process.env.MATHDESK_TEST_ASAR||path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});try{
 const page=await app.firstWindow();await page.waitForSelector('#notes button');
 const source=String.raw`f(x)=-x^3\Rightarrow f^{\doubleprime}(x)=-6x`;
 await page.evaluate(async source=>{await newNote();doc().editor.commands.setContent({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Inline derivative: '},{type:'inlineMath',attrs:{latex:String.raw`g^{\doubleprime}(t)=-2`}}]},{type:'displayMath',attrs:{latex:source}}]});await flush();},source);
 const before=await page.evaluate(()=>structuredClone(active().doc));
 assert.equal(await page.evaluate(()=>desk.previewPDF(structuredClone(active()))),true);
 assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),2);
 await app.evaluate(({BrowserWindow})=>{for(const win of BrowserWindow.getAllWindows())if(win.webContents.getURL().includes('Glass-preview-'))win.close();});
 const output=path.join(root,'double-primes.pdf');await app.evaluate(({dialog},output)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:output});},output);
 await page.locator('#pdf-export').click();await page.waitForFunction(()=>document.getElementById('export-state').textContent.startsWith('PDF exported')||document.getElementById('toast').textContent.includes('could not be rendered'));
 assert.ok(fs.existsSync(output),await page.locator('#toast').textContent());assert.equal(fs.readFileSync(output).subarray(0,5).toString(),'%PDF-');assert.deepEqual(await page.evaluate(()=>active().doc),before);
 assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
 console.log('PASS: inline/display double-prime derivatives preview and export to real PDF without changing stored equations or leaving print windows open.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
