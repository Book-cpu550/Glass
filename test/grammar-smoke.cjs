const {_electron:electron}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-grammar-'));
(async()=>{const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});try{
 const page=await app.firstWindow();await page.waitForSelector('#notes button');
 await page.evaluate(()=>doc().editor.commands.setContent({type:'doc',content:[
  {type:'paragraph',content:[{type:'text',text:'This are a example. '},{type:'inlineMath',attrs:{latex:'\\int_2^7x\\,dx'}},{type:'text',text:' The result are clear.'},{type:'text',text:' We has a proof.',marks:[{type:'bold'}]},{type:'text',text:'x is are code',marks:[{type:'code'}]}]},
  {type:'codeBlock',content:[{type:'text',text:'do_not_correct = "This are code"'}]},
  {type:'displayMath',attrs:{latex:'f_n\\to f'}}
 ]}));
 const original=await page.evaluate(()=>active().doc);
 const segments=await page.evaluate(()=>doc().grammarSegments());assert.equal(segments.length,3);
 assert.ok(!JSON.stringify(segments).includes('do_not_correct'));assert.ok(!JSON.stringify(segments).includes('x is are code'));assert.ok(!JSON.stringify(segments).includes('\\int'));
 await app.evaluate(({app})=>{
  const req=process.getBuiltinModule('module').createRequire(process.getBuiltinModule('path').join(app.getAppPath(),'main.cjs'));
  req('./ai.cjs').runAI=async({prompt})=>{globalThis.grammarTestPrompt=prompt;return {summary:'Review corrections.',suggestions:[
   {segmentId:0,original:'This are a example.',replacement:'This is an example.',explanation:'Correct agreement and the article.'},
   {segmentId:1,original:'The result are clear.',replacement:'The result is clear.',explanation:'Use a singular verb.'},
   {segmentId:2,original:'We has a proof.',replacement:'We have a proof.',explanation:'Use the correct verb form.'},
   {segmentId:99,original:'\\int_2^7x',replacement:'changed math',explanation:'This invalid suggestion must be rejected.'}
  ]};};
 });
 await page.getByRole('button',{name:'Grammar',exact:true}).click();await page.locator('#grammar-mode').selectOption('ai');await page.getByRole('button',{name:'Check grammar',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.grammar-card').length===3);
 assert.deepEqual(await page.evaluate(()=>active().doc),original);
 await page.getByRole('button',{name:'Apply',exact:true}).first().click();
 await page.waitForFunction(()=>document.querySelectorAll('.grammar-card.applied').length===1);
 await page.getByRole('button',{name:'Ignore',exact:true}).first().click();
 await page.getByRole('button',{name:'Apply all',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.grammar-card.applied').length===2);
 const corrected=await page.evaluate(()=>active().doc),paragraph=corrected.content[0].content;
 assert.ok(paragraph.some(n=>n.text?.includes('This is an example.')));
 assert.ok(paragraph.some(n=>n.text?.includes('The result are clear.')));
 assert.ok(paragraph.some(n=>n.text?.includes('We have a proof.')&&n.marks?.some(m=>m.type==='bold')));
 assert.deepEqual(paragraph.find(n=>n.type==='inlineMath'),original.content[0].content.find(n=>n.type==='inlineMath'));
 assert.deepEqual(corrected.content[1],original.content[1]);assert.deepEqual(corrected.content[2],original.content[2]);
 await page.getByRole('button',{name:'Close grammar checker',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();
 assert.ok((await page.evaluate(()=>active().doc.content[0].content)).some(n=>n.text?.includes('We has a proof.')));
 await page.getByRole('button',{name:'Grammar',exact:true}).click();await page.locator('#grammar-mode').selectOption('ai');await page.getByRole('button',{name:'Check grammar',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.grammar-card').length>0);
 await page.evaluate(()=>doc().editor.commands.insertContentAt(doc().editor.state.doc.content.size-1,'Changed since checking.'));
 const beforeStale=await page.evaluate(()=>active().doc);await page.getByRole('button',{name:'Apply',exact:true}).first().click();
 await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('document changed'));
 assert.deepEqual(await page.evaluate(()=>active().doc),beforeStale);
 console.log('PASS: suggestion review, apply/ignore/apply-all, safe position mapping, preserved math/code/formatting, undo, and stale-result protection.');
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
