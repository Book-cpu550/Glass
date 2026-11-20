const {_electron:electron}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-ai-'));
async function launch(){const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});const page=await app.firstWindow();await page.waitForSelector('math-field');return {app,page};}
(async()=>{let {app,page}=await launch();try{
 const image=path.resolve(__dirname,'../../../work/recognition-test.png');fs.mkdirSync(path.dirname(image),{recursive:true});await page.locator('math-field').first().screenshot({path:image});
 await page.getByRole('button',{name:'✧ AI helper',exact:true}).click();await page.waitForFunction(()=>!document.getElementById('ai-ask').disabled);
 await page.getByRole('textbox',{name:'Question for AI helper'}).fill('What is the derivative of x squared? Be brief.');await page.getByRole('button',{name:'Ask AI ↗',exact:true}).click();
 await page.locator('.ai-message.assistant').waitFor({timeout:180000});assert.match(await page.locator('.ai-message.assistant').innerText(),/2x|2 x/);await page.getByRole('button',{name:'＋ Add answer to note',exact:true}).click();
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},image);await page.getByRole('button',{name:'▧ Photo to text',exact:true}).click();await page.getByRole('button',{name:'Transcribe photo ✧',exact:true}).click();
 await page.getByRole('button',{name:'Add to note',exact:true}).waitFor({timeout:180000});const transcription=await page.locator('#photo-transcript').inputValue();assert.match(transcription,/\\int/);assert.match(transcription,/frac/);
 await page.getByRole('button',{name:'Edit transcription',exact:true}).click();await page.locator('#photo-transcript').fill(transcription+'\n\nVerified transcription.');await page.getByRole('button',{name:'Add to note',exact:true}).click();
 await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');await app.close();({app,page}=await launch());
 assert.ok((await page.getByRole('textbox',{name:'Document editor'}).innerText()).includes('Verified transcription.'));await page.getByRole('button',{name:'✧ AI helper',exact:true}).click();assert.equal(await page.locator('.ai-message.assistant').count(),1);
 console.log('PASS: signed-in status, live Codex chat, rich answer insertion, photo recognition/review, chat and document persistence.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
