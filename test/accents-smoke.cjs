const {chooseSymbol}=require('./symbol-helper.cjs');
const {_electron:electron}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),katex=require('katex');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-accents-'));
(async()=>{const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});try{
 const page=await app.firstWindow();await page.waitForSelector('#notes button');await page.getByRole('textbox',{name:'Document editor'}).fill('The coordinates are ');await chooseSymbol(page,'math','Barred coordinates');await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');await page.keyboard.type('x');await page.keyboard.press('Tab');await page.keyboard.type('y');const value=await page.locator('math-field').evaluate(f=>f.value);assert.equal((value.match(/\\bar/g)||[]).length,2);assert.ok(!value.includes('placeholder'));katex.renderToString(value,{throwOnError:true});await page.keyboard.press('Tab');await page.keyboard.type(' in this coordinate system.');assert.ok((await page.locator('.ProseMirror').innerText()).includes('in this coordinate system.'));await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');
 async function clickBody(text,double=false){
  await page.waitForFunction(text=>[...document.querySelector('math-field').shadowRoot.querySelectorAll('[data-atom-id]')].some(el=>el.childElementCount===0&&el.textContent===text),text);
  const rect=await page.locator('math-field').evaluate((field,text)=>{const el=[...field.shadowRoot.querySelectorAll('[data-atom-id]')].find(el=>el.childElementCount===0&&el.textContent===text),r=el.getBoundingClientRect();return {x:r.x+r.width*0.75,y:r.y+r.height/2};},text);
  if(double)await page.mouse.dblclick(rect.x,rect.y);else await page.mouse.click(rect.x,rect.y);await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');
 }
 for(const command of ['bar','overline','vec','hat','widehat'])for(const display of [false,true]){
  const latex='\\'+command+'{\\placeholder{}}';
  await page.evaluate(({latex,display})=>doc().editor.commands.setContent({type:'doc',content:display?[{type:'displayMath',attrs:{latex}},{type:'paragraph'}]:[{type:'paragraph',content:[{type:'inlineMath',attrs:{latex}}]}]}),{latex,display});
  await clickBody('▢');await page.keyboard.type('x');assert.equal(await page.locator('math-field').evaluate(f=>f.value),'\\'+command+'{x}');
  await page.getByRole('textbox',{name:'Note title',exact:true}).click();await page.waitForTimeout(550);await clickBody('x',true);await page.keyboard.type('y');assert.equal(await page.locator('math-field').evaluate(f=>f.value),'\\'+command+'{y}');
 }
 console.log('PASS: mouse editing empty and filled overbar/overline/vector/hat bodies inline and display; barred-coordinate Tab navigation and prose continuation.');

}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
