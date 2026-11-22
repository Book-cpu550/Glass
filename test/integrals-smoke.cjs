const {chooseSymbol}=require('./symbol-helper.cjs');
const {_electron:electron}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),katex=require('katex');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-integrals-'));
(async()=>{const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});try{
 const page=await app.firstWindow();await page.waitForSelector('#notes button');
 for(const [label,symbol,region]of [['Line integral','\\int','C'],['Line integral (vector)','\\int','C'],['Closed line integral','\\oint','C'],['Surface integral','\\iint','S'],['Surface flux','\\iint','S'],['Closed surface flux','\\oiint','S']]){
  await page.getByRole('button',{name:/New note\b/}).click();await page.locator('#new-blank-note').click();await page.getByRole('textbox',{name:'Document editor'}).fill('The integral is ');
  await chooseSymbol(page,'math',label);await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');
  await page.keyboard.type(region);await page.keyboard.press('Tab');await page.keyboard.type('f');
  const field=page.locator('math-field'),value=await field.evaluate(f=>f.value);assert.ok(value.includes(symbol),label+': '+value);assert.ok(value.includes('_'+region)||value.includes('_{'+region+'}'),label+': '+value);assert.ok(value.includes('f'));assert.ok(!value.includes('placeholder'),value);
  katex.renderToString(value,{throwOnError:true});await page.keyboard.press('Tab');await page.keyboard.type(' and the proof continues.');
  assert.ok((await page.evaluate(()=>active().blocks)).some(b=>b.value.includes('and the proof continues.')));
  await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');assert.ok((await page.evaluate(()=>active().blocks)).some(b=>b.value.includes(symbol)));
 }
 console.log('PASS: six line/surface integral templates, editable regions/integrands, LaTeX rendering, prose continuation and local save.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
