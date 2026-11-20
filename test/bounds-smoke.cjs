const {_electron:electron}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathdesk-bounds-'));
async function launch(){const app=await electron.launch({args:[path.resolve(__dirname,'..'),'--smoke-test'],env:{...process.env,MATHDESK_TEST_DATA:root}});const page=await app.firstWindow();await page.waitForSelector('#notes button');return {app,page};}
(async()=>{let {app,page}=await launch();try{
 const field=()=>page.locator('math-field');
 async function setup(latex,display=false){
  await page.evaluate(({latex,display})=>{doc().editor.commands.setContent({type:'doc',content:display?[{type:'paragraph',content:[{type:'text',text:'Equation:'}]},{type:'displayMath',attrs:{latex}},{type:'paragraph'}]:[{type:'paragraph',content:[{type:'text',text:'The current integral format is '},{type:'inlineMath',attrs:{latex}}]}]});},{latex,display});
  await field().waitFor();await page.waitForFunction(()=>!!document.querySelector('math-field')?.shadowRoot?.querySelector('[data-atom-id]'));
 }
 async function clickAtom(text,index=0,double=false){
  await page.waitForFunction(({text,index})=>[...document.querySelector('math-field').shadowRoot.querySelectorAll('[data-atom-id]')].filter(el=>el.childElementCount===0&&el.textContent===text).length>(typeof index==='number'?index:0),{text,index});
  const box=await field().evaluate((field,{text,index})=>{
   const nodes=[...field.shadowRoot.querySelectorAll('[data-atom-id]')].filter(el=>el.childElementCount===0&&el.textContent===text);
   const ordered=nodes.map(el=>el.getBoundingClientRect()).sort((a,b)=>a.y-b.y||a.x-b.x);const rect=index==='bottom'?ordered.at(-1):ordered[index];if(!rect)throw Error('Expected editable atom '+text);
   return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};
  },{text,index});
  if(double)await page.mouse.dblclick(box.x,box.y);else await page.mouse.click(box.x,box.y);
  await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');
 }
 for(const display of [false,true]){
  await setup('\\int_{2}^{\\placeholder{}}',display);
  await clickAtom('▢');await page.keyboard.type('5');
  assert.match(await field().evaluate(f=>f.value),/\\int_2\^5/);
  await clickAtom('2',0,true);await page.keyboard.type('3');
  assert.match(await field().evaluate(f=>f.value),/\\int_3\^5/);
 }
 await page.getByRole('button',{name:/New note\b/}).click();await page.locator('[data-note-template="blank"]').click();await page.getByRole('textbox',{name:'Document editor'}).fill('An integral: ');
 await page.getByRole('combobox',{name:'Math templates'}).selectOption({label:'Integral'});
 await page.waitForFunction(()=>document.activeElement.tagName==='MATH-FIELD');
 await page.keyboard.type('2');await page.keyboard.press('Tab');await page.keyboard.type('7');await page.keyboard.press('Tab');await page.keyboard.type('x');
 assert.match(await field().evaluate(f=>f.value),/\\int_2\^7/);
 assert.ok(!(await field().evaluate(f=>f.value)).includes('placeholder'));
 await page.keyboard.press('Tab');await page.keyboard.type(' then continue the sentence.');
 assert.ok((await page.evaluate(()=>active().blocks)).some(b=>b.value.includes('then continue the sentence.')));
 await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('ProseMirror')),true);
 // Visit the denominator first, then Shift+Tab back to the still-empty numerator.
 await setup('\\frac{\\placeholder{}}{\\placeholder{}}');
 await clickAtom('▢','bottom');await page.keyboard.type('4');await page.keyboard.press('Shift+Tab');await page.keyboard.type('9');
 assert.equal(await field().evaluate(f=>f.value.replace(/[{} ]/g,'')),'\\frac94');
 await setup('\\sqrt{\\frac{\\placeholder{}}{\\placeholder{}}}');
 await clickAtom('▢');await page.keyboard.type('a');await page.keyboard.press('Tab');await page.keyboard.type('b');
 assert.equal(await field().evaluate(f=>f.value.replace(/[{} ]/g,'')),'\\sqrt\\fracab');
 await setup('\\begin{pmatrix}\\placeholder{} & \\placeholder{} \\\\ \\placeholder{} & \\placeholder{}\\end{pmatrix}',true);
 await clickAtom('▢');await page.keyboard.type('1');
 for(const number of ['2','3','4']){await page.keyboard.press('Tab');await page.keyboard.type(number);}
 const matrix=await field().evaluate(f=>f.value);assert.ok(!matrix.includes('placeholder'));for(const number of ['1','2','3','4'])assert.ok(matrix.includes(number));
 await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved locally');
 const saved=await page.evaluate(()=>active());assert.ok(saved.blocks.some(b=>b.type==='math'&&b.value===matrix));
 await page.getByRole('button',{name:'Read view',exact:true}).click();assert.equal(await field().evaluate(f=>f.readOnly),true);
 await page.getByRole('button',{name:'Edit document',exact:true}).click();assert.equal(await field().evaluate(f=>f.readOnly),false);
 await app.close();({app,page}=await launch());assert.equal(await page.locator('math-field').evaluate(f=>f.value),matrix);
 console.log('PASS: mouse editing upper/lower bounds inline and display, integral-template boxes, Tab/Shift+Tab, fractions, nested roots, matrix cells, and persistence.');
}catch(error){console.error('ACTIVE',await page.evaluate(()=>document.activeElement.tagName));throw error;}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
