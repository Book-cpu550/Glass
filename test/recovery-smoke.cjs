const {_electron:electron}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-recovery-'));
async function launch(){const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});const page=await app.firstWindow();await page.waitForSelector('#notes button');return {app,page};}
(async()=>{let {app,page}=await launch();try{
  const note=await page.evaluate(()=>active());
  await page.getByRole('textbox',{name:'Document editor'}).fill('Saved locally during recovery testing.');
  await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');
  await page.getByRole('button',{name:/New note\b/}).click();await page.waitForFunction(()=>document.getElementById('title').value==='Untitled note');
  await page.getByRole('textbox',{name:'Note title',exact:true}).fill('Offline note');
  await page.getByRole('textbox',{name:'Document editor'}).fill('This can still be saved and deleted.');
  await page.keyboard.press('Control+s');
  await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');
  await app.evaluate(({dialog,shell})=>{dialog.showMessageBox=async()=>({response:1});shell.trashItem=async file=>process.getBuiltinModule('fs').renameSync(file,file+'.trashed');});
  await page.getByRole('button',{name:'Delete note',exact:true}).click();await page.waitForFunction(()=>document.getElementById('title').value!=='Offline note');
  await app.close();app=null;
  fs.writeFileSync(path.join(root,'notes','broken.json'),'{bad json');
  ({app,page}=await launch());
  assert.ok((await page.locator('#load-warnings').innerText()).includes('broken.json'));
  const restored=await page.evaluate(()=>window.desk.load());assert.ok(restored.notes.some(n=>n.id===note.id));
  assert.ok(fs.existsSync(path.join(root,'notes','broken.json')));
  const recoveredBody=await page.evaluate(id=>desk.getNote(id),note.id);
  assert.ok(recoveredBody.blocks.some(b=>b.value.includes('Saved locally during recovery testing.')));
  assert.ok(restored.notes.every(n=>n._summary&&!n.blocks));
  // A failed recognition retry must not leave the earlier successful result insertable.
  await page.evaluate(()=>{photo={id:'missing'};photoResult={answer:'Old result',blocks:[{type:'text',value:'Old result'}]};document.getElementById('photo-dialog').showModal();document.getElementById('photo-insert').hidden=false;});
  await page.getByRole('button',{name:'Transcribe photo ✧',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('photo-result').textContent.includes('Select a photo first'));
  assert.equal(await page.locator('#photo-insert').isVisible(),false);
  assert.equal(await page.evaluate(()=>photoResult),null);
  console.log('PASS: local saving/navigation/deletion, corrupt-note isolation, and stale-photo prevention.');
}finally{if(app)await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
