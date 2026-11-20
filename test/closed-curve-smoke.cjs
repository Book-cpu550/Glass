const {chooseSymbol}=require('./symbol-helper.cjs');
const {_electron:electron}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),katex=require('katex');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-closed-curve-'));
(async()=>{const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});try{
 const page=await app.firstWindow();await page.waitForSelector('#notes button');await page.getByRole('textbox',{name:'Document editor'}).fill('A scalar contour integral: ');await chooseSymbol(page,'math','Closed curve integral (scalar)');await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');await page.keyboard.type('C');await page.keyboard.press('Tab');await page.keyboard.type('x^2');await page.keyboard.press('Tab');await page.keyboard.type('y');
 let value=await page.locator('math-field').evaluate(f=>f.value);assert.ok(!value.includes('placeholder'),value);assert.match(value,/\\oint_\{?C\}?/);assert.match(value,/x\^2/);assert.ok(value.endsWith('dy'),value);katex.renderToString(value,{throwOnError:true});
 await page.keyboard.press('Tab');await page.keyboard.type(' then continue.');assert.ok((await page.locator('.ProseMirror').innerText()).includes('then continue.'));
 await page.locator('#symbol-search-open').click();await page.locator('#symbol-query').fill('Centroid');assert.equal(await page.locator('[data-symbol-name]').count(),0);await page.locator('#symbol-dialog [data-close]').click();
 await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');
 console.log('PASS: scalar closed-curve integral with editable C/integrand/differential; removed centroid preset; prose continuation and local saving.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
