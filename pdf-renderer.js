(()=>{
 const el=(name,text)=>{const node=document.createElement(name);if(text!==undefined)node.textContent=text;return node;};
 const families=new Set(['Times New Roman','Arial','Calibri','Cambria','Georgia','Verdana']);
 window.renderPDF=async note=>{
  const errors=[],body=document.getElementById('pdf-body');document.getElementById('pdf-title').textContent=note.title||'Untitled note';document.title=note.title||'Mathdesk note';body.replaceChildren();
  function math(latex,display){const node=el(display?'div':'span');node.className=display?'pdf-display-math':'pdf-inline-math';try{katex.render(MathCompat.latex(latex),node,{displayMode:display,throwOnError:true,trust:false,output:'html'});}catch(error){errors.push(error.message);node.textContent=latex;}return node;}
  function mark(node,marks=[]){for(const item of marks){let wrapper;if(['bold','italic','underline','strike','subscript','code'].includes(item.type))wrapper=el({bold:'strong',italic:'em',underline:'u',strike:'s',subscript:'sub',code:'code'}[item.type]);else if(item.type==='textStyle'){wrapper=el('span');const attrs=item.attrs||{},family=String(attrs.fontFamily||'').replace(/["']/g,'');if(families.has(family))wrapper.style.fontFamily=family;if(/^\d+(?:\.\d+)?(?:pt|px)$/.test(attrs.fontSize||''))wrapper.style.fontSize=attrs.fontSize;}else if(item.type==='link'){wrapper=el('a');if(/^(https?:|mailto:)/i.test(item.attrs?.href||''))wrapper.href=item.attrs.href;}if(wrapper){wrapper.append(node);node=wrapper;}}return node;}
  function render(source){
   if(source.type==='text')return mark(document.createTextNode(source.text),source.marks);
   if(source.type==='inlineMath')return mark(math(source.attrs.latex,false),source.marks);
   if(source.type==='displayMath')return math(source.attrs.latex,true);
   if(source.type==='hardBreak')return el('br');if(source.type==='horizontalRule')return el('hr');
   if(source.type==='drawing'){const figure=el('figure');figure.className='pdf-drawing';const image=el('img');image.src=source.attrs.png;image.alt='Drawing';figure.append(image);return figure;}
   const tag={paragraph:'p',heading:'h'+(source.attrs?.level||1),blockquote:'blockquote',bulletList:'ul',orderedList:'ol',listItem:'li',codeBlock:'pre',table:'table',tableRow:'tr',tableCell:'td',tableHeader:'th'}[source.type];if(!tag)throw Error('Unsupported document content: '+source.type);const node=el(tag);
   if(['tableCell','tableHeader'].includes(source.type)){node.colSpan=source.attrs?.colspan||1;node.rowSpan=source.attrs?.rowspan||1;if(source.attrs?.backgroundColor)node.style.backgroundColor=source.attrs.backgroundColor;}
   if(source.type==='table'){const widths=(source.content?.[0]?.content||[]).flatMap(cell=>Array.from({length:cell.attrs?.colspan||1},(_,i)=>cell.attrs?.colwidth?.[i]||100)),total=widths.reduce((a,b)=>a+b,0),group=el('colgroup');for(const width of widths){const col=el('col');col.style.width=(width/total*100)+'%';group.append(col);}node.append(group);}
   if(['left','right','center','justify'].includes(source.attrs?.textAlign))node.style.textAlign=source.attrs.textAlign;
   if(source.type==='orderedList'&&Number.isInteger(source.attrs?.start))node.start=source.attrs.start;
   if(source.type==='table'){const rows=source.content||[],header=rows[0]?.content?.every(c=>c.type==='tableHeader'&&(c.attrs?.rowspan||1)===1);if(header){const head=el('thead');head.append(render(rows[0]));node.append(head);}const body=el('tbody');for(const row of rows.slice(header?1:0))body.append(render(row));node.append(body);}else for(const child of source.content||[])node.append(render(child));return node;
  }
  if(note.doc)for(const child of note.doc.content)body.append(render(child));
  else{
   body.innerHTML=RichDocument.fromBlocks(note.blocks);
   for(const node of body.querySelectorAll('[data-type="inlineMath"],[data-type="displayMath"]'))node.replaceWith(math(node.getAttribute('data-latex')||'',node.getAttribute('data-type')==='displayMath'));
   for(const node of body.querySelectorAll('[data-type="drawing"]')){const figure=el('figure');figure.className='pdf-drawing';const image=el('img');image.src=node.getAttribute('data-png');image.alt='Drawing';figure.append(image);node.replaceWith(figure);}
  }
  await document.fonts.ready;await Promise.all([...body.querySelectorAll('img')].map(image=>image.decode()));
  // Fit wide formulas to the page without clipping their bounds or matrices.
  function availableWidth(node){const cell=node.closest('td,th');if(!cell)return body.clientWidth;const style=getComputedStyle(cell);return Math.min(body.clientWidth,cell.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));}
  for(const node of body.querySelectorAll('.pdf-display-math,.pdf-inline-math')){const formula=node.querySelector('.katex');if(!formula)continue;const width=formula.getBoundingClientRect().width,available=availableWidth(node);if(width>available)node.style.fontSize=(parseFloat(getComputedStyle(node).fontSize)*available/width*.98)+'px';}
  await document.fonts.ready;await new Promise(resolve=>setTimeout(resolve,50));const oversized=[...body.querySelectorAll('.pdf-display-math,.pdf-inline-math')].some(node=>(node.querySelector('.katex')?.getBoundingClientRect().width||0)>availableWidth(node)+2);if(oversized)errors.push('An equation is too wide for the page.');return {errors};
 };
})();
