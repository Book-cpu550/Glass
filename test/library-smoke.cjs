const {_electron:electron}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-library-'));
async function launch(){const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});const page=await app.firstWindow();await page.waitForSelector('#notes button');return {app,page};}
(async()=>{let {app,page}=await launch();try{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#library-open').click();await page.locator('#library-detail h2').waitFor();assert.ok((await page.locator('#library-count').innerText()).includes('258 built-in'));
 await page.locator('#library-search').fill('no-entry-with-this-name');assert.equal(await page.locator('#library-detail button').count(),0);
 await page.locator('#library-search').fill('Linear ODE system with constant matrix');await page.locator('.library-item').click();
 const conditions=page.locator('#library-detail h3').filter({hasText:'Conditions & hypotheses'}).locator('xpath=following-sibling::p[1]');
 assert.equal(await conditions.locator('.katex').count(),2);assert.equal(await conditions.locator('.katex-error').count(),0);assert.ok(!(await conditions.innerText()).includes('$'));
 assert.equal(await page.locator('#library-detail .library-formula .katex').count(),1);
 await page.locator('#library-search').fill('Fundamental theorem of calculus');assert.ok(await page.locator('.library-item').count()>0);
 await page.locator('.library-item').first().click();await page.getByRole('button',{name:'☆ Favorite',exact:true}).click();await page.locator('#library-scope').selectOption('favorites');assert.equal(await page.locator('.library-item').count(),1);
 await page.getByRole('button',{name:'Insert into note',exact:true}).click();assert.ok(await page.locator('math-field').count()>0);assert.ok(await page.locator('.ProseMirror').innerText());
 await page.locator('#library-open').click();await page.locator('#library-add').click();await page.locator('#entry-title').fill('Local test definition');await page.locator('#entry-statement').fill('A locally stored test definition.');await page.locator('#entry-latex').fill('x^2');await page.locator('#entry-kind').selectOption('Definition');await page.locator('#entry-save').click();await page.waitForFunction(()=>!document.getElementById('entry-dialog').open);
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'library.json'))).entries[0].title,'Local test definition');
 await app.evaluate(({app})=>{const req=process.getBuiltinModule('module').createRequire(process.getBuiltinModule('path').join(app.getAppPath(),'main.cjs'));req('./ai.cjs').runAI=async()=>({summary:'Draft ready.',entries:[{title:'AI test identity',topic:'Testing',kind:'Identity',level:'Custom',statement:'The square of x is x times x.',conditions:'Real x.',latex:'x^2=x\\cdot x',example:'2 squared is 4.',proofIdea:'Definition of squaring.',pitfall:'Do not confuse with twice x.'}]});});
 await page.locator('#library-ai-open').click();await page.locator('#library-query').fill('AI test identity');await page.locator('#library-generate').click();await page.getByRole('button',{name:'Review & save locally'}).click();assert.equal(JSON.parse(fs.readFileSync(path.join(root,'library.json'))).entries.length,1);await page.locator('#entry-save').click();await page.waitForFunction(()=>!document.getElementById('entry-dialog').open);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'library.json'))).entries.length,2);
 assert.deepEqual(errors,[]);await app.close();({app,page}=await launch());await page.locator('#library-open').click();await page.locator('#library-scope').selectOption('custom');assert.equal(await page.locator('.library-item').count(),2);await page.locator('#library-scope').selectOption('favorites');assert.equal(await page.locator('.library-item').count(),1);
 console.log('PASS: offline reference search/filter/favorite, editable formula insertion, local custom save, AI review before save, restart persistence.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
