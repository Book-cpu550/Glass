const {_electron:electron}=require('playwright');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-delete-'));
async function launch(){const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});const page=await app.firstWindow();await page.waitForFunction(()=>document.querySelector('#notes button'));return {app,page};}
(async()=>{let {app,page}=await launch();try{
  const note=await page.evaluate(()=>window.desk.load().then(d=>d.notes[0]));
  await app.evaluate(({dialog,shell})=>{const fs=process.getBuiltinModule('fs');dialog.showMessageBox=async()=>({response:0});shell.trashItem=async file=>{fs.renameSync(file,file+'.trashed');};});
  await page.getByRole('button',{name:'Delete note',exact:true}).click();
  assert.ok(fs.existsSync(path.join(root,'notes',note.id+'.json')));
  await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1});});
  await page.getByRole('button',{name:'Delete note',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('title').value==='Untitled note');
  assert.ok(!fs.existsSync(path.join(root,'notes',note.id+'.json')));
  assert.ok(fs.existsSync(path.join(root,'notes',note.id+'.json.trashed')));
  await app.close();({app,page}=await launch());
  const remaining=await page.evaluate(()=>window.desk.load().then(d=>d.notes));
  assert.equal(remaining.length,1);assert.notEqual(remaining[0].id,note.id);
  await app.evaluate(({dialog,shell})=>{dialog.showMessageBox=async()=>({response:1});shell.trashItem=async()=>{throw Error('Recycle Bin unavailable');};});
  await page.getByRole('button',{name:'Delete note',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Recycle Bin unavailable'));
  assert.ok(fs.existsSync(path.join(root,'notes',remaining[0].id+'.json')));
  assert.equal(await page.locator('#notes button').count(),1);
  console.log('PASS: cancel, confirmed deletion, last-note replacement, restart persistence, failed-delete recovery.');
}catch(e){console.error(await page.locator('#toast').textContent());throw e;}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
