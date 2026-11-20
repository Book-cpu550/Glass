const {_electron:electron}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-proof-'));
const blocks=[
 {type:'text',value:'**Theorem 5.37** *Let $(X,\\mathcal{M},\\mu)$ be a measure space, and let $\\{f_n\\}$ be a sequence of measurable functions such that $f_n\\to f$ [meas]. If there exists $g\\in L_1$ such that $|f_n|\\le g$ a.e. for every $n\\in\\mathbb{N}$, then $f_n\\to f$ [mean].*'},
 {type:'text',value:'**Proof.** Let $\\varepsilon>0$. Since $g\\in L_1$, we can choose $\\alpha>0$ so that'},
 {type:'math',value:'\\int_{\\{x:2g(x)\\le\\alpha\\}}2g\\,d\\mu<\\varepsilon/3.'},
 {type:'text',value:'Letting'},
 {type:'math',value:'A=\\{x:2g(x)>\\alpha\\},'},
 {type:'text',value:'we note that $\\mu(A)<\\infty$ so there is an $\\eta>0$ with $\\eta\\mu(A)<\\varepsilon/3$. From the absolute continuity of the integral there is a $\\delta>0$ so that'},
 {type:'math',value:'\\int_E2g\\,d\\mu<\\varepsilon/3'},
 {type:'text',value:'whenever $\\mu(E)<\\delta$. Finally, choose $N$ so that $\\mu(B_n)<\\delta$ for all $n\\ge N$, where'},
 {type:'math',value:'B_n=\\{x\\in A:|f_n(x)-f(x)|\\ge\\eta\\}.'},
 {type:'text',value:'Now, using the inequalities $|f_n-f|\\le2g$ a.e. and $|f_n-f|<\\eta$ on $A\\setminus B_n$, we have'},
 {type:'math',value:'\\int_X|f_n-f|\\,d\\mu\\le\\int_{X\\setminus A}2g\\,d\\mu+\\int_{B_n}2g\\,d\\mu+\\int_{A\\setminus B_n}\\eta\\,d\\mu<\\varepsilon'},
 {type:'text',value:'for all $n\\ge N$, as required to prove the theorem.'},
 {type:'text',value:'■'}
];
const now=new Date().toISOString(),note={id:'proof-example',title:'Theorem and proof',created:now,updated:now,blocks};
fs.mkdirSync(path.join(root,'notes'));fs.writeFileSync(path.join(root,'notes','proof-example.json'),JSON.stringify(note));
(async()=>{const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});try{
 const page=await app.firstWindow();await page.waitForSelector('.document-display-math');
 assert.equal(await page.locator('.document-display-math').count(),5);
 assert.ok(await page.locator('.document-inline-math').count()>=15);
 assert.ok((await page.locator('.ProseMirror strong').allTextContents()).includes('Proof.'));
 assert.ok(await page.locator('.ProseMirror em').count()>0);
 assert.equal(await page.locator('.document-display-math').first().evaluate(el=>getComputedStyle(el).justifyContent),'center');
 // Confirm a fresh displayed equation can be inserted from the document keyboard.
 await page.locator('.ProseMirror p').last().click();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');await page.keyboard.press('Control+Shift+m');
 await page.waitForFunction(()=>document.querySelectorAll('.document-display-math').length===6);
 await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');
 await page.keyboard.type('x=1');await page.keyboard.press('Tab');await page.keyboard.type('A final explanation.');
 await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');
 assert.ok((await page.evaluate(()=>active().blocks)).some(b=>b.value.includes('A final explanation.')));
 const preserved=await page.evaluate(()=>active());assert.ok(preserved.blocks.some(b=>b.type==='math'&&b.value==='x=1'));assert.ok(preserved.blocks.some(b=>b.type==='math'&&b.value.includes('\\int_{X\\setminus A}')));
 const screenshot=path.resolve(__dirname,'../../../work/proof-layout.png');await page.locator('.document-paper').screenshot({path:screenshot});
 console.log('PASS: theorem/proof styling, mixed inline math, five centered integrals/equations, display insertion and return to prose.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
