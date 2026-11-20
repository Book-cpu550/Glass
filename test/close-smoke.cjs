const {_electron:electron}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-close-'));
async function launch(){const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});const page=await app.firstWindow();await page.waitForSelector('#notes button');return {app,page};}
(async()=>{let {app,page}=await launch();try{
 await page.evaluate(()=>{doc().editor.commands.setContent('<p>The final edit before closing.</p>');window.close();});await page.waitForEvent('close');await app.close();
 const note=JSON.parse(fs.readFileSync(path.join(root,'notes',fs.readdirSync(path.join(root,'notes'))[0])));assert.ok(note.blocks.some(b=>b.value.includes('final edit before closing')));
 ({app,page}=await launch());assert.ok((await page.locator('.ProseMirror').innerText()).includes('final edit before closing'));
 console.log('PASS: close during debounce saves latest content and survives restart.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
