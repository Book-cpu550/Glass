const {chooseSymbol}=require('./symbol-helper.cjs');
const {_electron:electron}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),katex=require('katex');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-evaluation-'));
async function launch(){const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});const page=await app.firstWindow();await page.waitForSelector('#notes button');return {app,page};}
(async()=>{let {app,page}=await launch();try{
 for(const display of [false,true]){
  await page.getByRole('button',{name:/New note\b/}).click();await page.getByRole('textbox',{name:'Document editor'}).fill('Evaluate ');if(display){await page.keyboard.press('Control+Shift+m');await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');}
  await chooseSymbol(page,'math','Evaluation brackets');await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');await page.keyboard.type('f(x)');await page.keyboard.press('Tab');await page.keyboard.type('a');await page.keyboard.press('Tab');await page.keyboard.type('b');
  const value=await page.locator('math-field').evaluate(f=>f.value);assert.ok(!value.includes('placeholder'),value);assert.match(value,/_\{?a\}?/);assert.match(value,/\^\{?b\}?/);assert.ok(value.includes('f'));katex.renderToString(value,{throwOnError:true});
  await page.keyboard.press('Tab');await page.keyboard.type(' then continue.');assert.ok((await page.locator('.ProseMirror').innerText()).includes('then continue.'));
  for(const [letter,replacement]of [['b','d'],['a','c']]){
   const point=await page.locator('math-field').evaluate((f,letter)=>{const el=[...f.shadowRoot.querySelectorAll('[data-atom-id]')].find(el=>el.childElementCount===0&&el.textContent===letter);if(!el)throw Error('Missing editable bound '+letter);const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};},letter);await page.mouse.dblclick(point.x,point.y);await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');await page.keyboard.type(replacement);
  }
  const edited=await page.locator('math-field').evaluate(f=>f.value);assert.match(edited,/_\{?c\}?/);assert.match(edited,/\^\{?d\}?/);await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');
 }
 const saved=await page.locator('math-field').evaluate(f=>f.value);await app.close();({app,page}=await launch());assert.equal(await page.locator('math-field').evaluate(f=>f.value),saved);
 console.log('PASS: inline/display evaluation brackets, expression/lower/upper boxes, Tab continuation, mouse editing both bounds and restart persistence.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
