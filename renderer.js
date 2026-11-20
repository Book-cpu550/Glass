 'use strict';
MathfieldElement.fontsDirectory='node_modules/mathlive/fonts';
MathfieldElement.soundsDirectory=null;
MathfieldElement.restoreFocusWhenDocumentFocused=false;
const $=id=>document.getElementById(id),uid=()=>crypto.randomUUID();
let notes=[],current=null,reading=false,lastMath=null,timer,queue=Promise.resolve(),closing=false;
let collection={notebooks:[{id:'personal',name:'Personal notebook'}],activeId:'personal'},notebookBusy=false,notebookAction='create';
const notebookNotes=()=>notes.filter(note=>(note.notebookId||'personal')===collection.activeId);
function notebookControls(){for(const id of ['notebook-select','note-move']){const select=$(id);select.replaceChildren();for(const entry of collection.notebooks){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.name;select.append(option);}select.value=collection.activeId;}$('notebook-crumb').textContent=collection.notebooks.find(n=>n.id===collection.activeId)?.name||'Notebook';}
async function switchNotebook(id,preferred){if(notebookBusy)return;notebookBusy=true;$('notebook-select').disabled=true;try{await window.MathdeskDrawing?.flushDraft();await flush();collection=await desk.updateNotebooks({action:'select',id});notebookControls();$('search').value='';current=notebookNotes().find(n=>n.id===(preferred||collection.notebooks.find(b=>b.id===collection.activeId)?.lastNoteId))?.id||[...notebookNotes()].sort((a,b)=>b.updated.localeCompare(a.updated))[0]?.id;if(current)render();else await newNote();document.body.classList.remove('library-mode');}finally{notebookBusy=false;$('notebook-select').disabled=false;$('notebook-select').value=collection.activeId;}}
const documents=new Map();
const dirtyNotes=new Set(),saveErrors=new Map();
const templates=[['Square root','\\sqrt{#0}'],['Integral','\\int_{#?}^{#?} #0 \\, dx'],['Line integral','\\int_{#?} #0 \\, ds'],['Line integral (vector)','\\int_{#?} #0 \\cdot d\\mathbf{r}'],['Closed line integral','\\oint_{#?} #0 \\cdot d\\mathbf{r}'],['Closed curve integral (scalar)','\\oint_{#?} #0 \\, d#?'],['Centroid x (closed curve)','\\bar{x}=\\frac{1}{2A}\\oint_C x^2\\,dy'],['Surface integral','\\iint_{#?} #0 \\, dS'],['Surface flux','\\iint_{#?} #0 \\cdot \\mathbf{n} \\, dS'],['Closed surface flux','\\oiint_{#?} #0 \\cdot \\mathbf{n} \\, dS'],['Evaluation brackets','\\left[#0\\right]_{#?}^{#?}'],['Fraction','\\frac{#0}{#?}'],['Subscript','{#0}_{#?}'],['Summation','\\sum_{n=1}^{\\infty} #0'],['Limit','\\lim_{x\\to 0} #0'],['Derivative','\\frac{\\partial #0}{\\partial x}'],['Matrix','\\begin{pmatrix}#0 & #? \\\\ #? & #?\\end{pmatrix}'],['Overbar','\\bar{#0}'],['Overline','\\overline{#0}'],['Barred coordinates','(\\bar{#0},\\bar{#?})'],['Vector arrow','\\vec{#0}'],['Hat','\\hat{#0}'],['Greek letters','\\alpha + \\beta'],['QED square','\\blacksquare']];
function active(){return notes.find(note=>note.id===current);}
function toast(message,error=false){$('toast').textContent=message;$('toast').className=error?'error':'';$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,error?12000:4500);}
function safely(fn){return async(...args)=>{try{await fn(...args);}catch(error){toast(error.message,true);}};}
function list(){
 const query=$('search').value.toLowerCase();$('notes').replaceChildren();$('count').textContent=notebookNotes().length;
 for(const note of [...notebookNotes()].sort((a,b)=>b.updated.localeCompare(a.updated))){
  if(!GlassNoteSearch.matches(note,query))continue;
  const button=document.createElement('button');button.className='note-link'+(note.id===current?' active':'');
  const symbol=document.createElement('span');symbol.className='note-symbol';symbol.textContent='ƒ';const body=document.createElement('div'),title=document.createElement('strong'),date=document.createElement('small');
  title.textContent=note.title||'Untitled note';date.textContent=new Date(note.updated).toLocaleDateString(undefined,{month:'short',day:'numeric'});body.append(title,date);button.append(symbol,body);
  button.onclick=safely(async()=>{await flush();current=note.id;render();});$('notes').append(button);
 }
}
function doc(){
 const note=active();if(documents.has(note.id))return documents.get(note.id);
 const host=document.createElement('div');host.className='document-host';
 const handle=RichDocument.mount(host,{doc:note.doc,blocks:note.blocks,onChange:(json,blocks)=>{note.doc=json;note.blocks=blocks;changed(note);},onSelection:()=>updateToolbar()});
 handle.host=host;documents.set(note.id,handle);note.doc=handle.editor.getJSON();note.blocks=handle.toBlocks();
 host.addEventListener('mousedown',event=>{if(!event.target.closest('math-field'))lastMath=null;});
 return handle;
}
function updateToolbar(){
 const handle=documents.get(current);if(!handle)return;const editor=handle.editor,attrs=editor.getAttributes('textStyle');
 if(document.activeElement!==$('font-family'))$('font-family').value=(attrs.fontFamily||'Times New Roman').replaceAll('"','').replaceAll("'",'');
 if(document.activeElement!==$('font-size'))$('font-size').value=Math.round(parseFloat(attrs.fontSize||'12'));
 $('paragraph-style').value=editor.isActive('heading')?String(editor.getAttributes('heading').level):'0';$('text-align').value=editor.getAttributes(editor.isActive('heading')?'heading':'paragraph').textAlign||'left';
 for(const [id,mark]of [['bold','bold'],['italic','italic'],['underline','underline'],['subscript','subscript'],['bullet-list','bulletList'],['numbered-list','orderedList']]){$(id).classList.toggle('selected',editor.isActive(mark));$(id).setAttribute('aria-pressed',String(editor.isActive(mark)));}
 $('undo').disabled=!editor.can().undo();$('redo').disabled=!editor.can().redo();
}
function header(){const note=active();$('crumb').textContent=note.title||'Untitled';const words=documents.get(current)?.editor.getText().trim().split(/\s+/).filter(Boolean).length||0;let equations=0;documents.get(current)?.editor.state.doc.descendants(node=>{if(node.type.name==='inlineMath'||node.type.name==='displayMath')equations++;});$('word-count').textContent=`${words} words · ${equations} equations`;}
function changed(note=active()){if(!note)return;note.updated=new Date().toISOString();dirtyNotes.add(note.id);if(note.id===current){saveErrors.delete(note.id);$('save-state').textContent='Saving…';header();}clearTimeout(timer);timer=setTimeout(()=>flush().catch(e=>toast(e.message,true)),450);}
async function flush(){
 clearTimeout(timer);const ids=new Set([...dirtyNotes,...(active()?[current]:[])]),snapshots=notes.filter(note=>ids.has(note.id)).map(note=>structuredClone(note)),selection=active()?{action:'select-note',id:collection.activeId,noteId:current}:null;
 queue=queue.catch(()=>{}).then(async()=>{const errors=[];for(const snapshot of snapshots){try{await window.desk.save(snapshot);const note=notes.find(n=>n.id===snapshot.id);saveErrors.delete(snapshot.id);if(note&&JSON.stringify(note)===JSON.stringify(snapshot)){dirtyNotes.delete(note.id);if(note.id===current){$('save-state').textContent='Saved locally';$('save-state').title='';}}}catch(error){dirtyNotes.add(snapshot.id);saveErrors.set(snapshot.id,error.message);if(snapshot.id===current){$('save-state').textContent='Not saved · Ctrl+S to retry';$('save-state').title=error.message;}errors.push(error.message);}}if(selection){await desk.updateNotebooks(selection);const entry=collection.notebooks.find(n=>n.id===selection.id);if(entry)entry.lastNoteId=selection.noteId;}if(errors.length)throw Error(errors.join('\n'));});await queue;list();
}
function render(){list();reading=false;lastMath=null;$('preview').textContent='Read view';$('title').readOnly=false;$('title').value=active().title;const handle=doc();handle.setReadOnly(false);$('editor').replaceChildren(handle.host);document.querySelector('.document-toolbar').inert=false;header();list();updateToolbar();$('save-state').textContent=saveErrors.has(current)?'Not saved · Ctrl+S to retry':dirtyNotes.has(current)?'Saving…':'Saved locally';$('save-state').title=saveErrors.get(current)||'';$('export-state').textContent='Local notebook · PDF export';}
async function newNote(templateId='blank'){await flush();const template=NoteTemplates.templates.find(t=>t.id===templateId)||NoteTemplates.templates[0],now=new Date().toISOString(),note={id:uid(),notebookId:collection.activeId,title:template.title,created:now,updated:now,blocks:[],doc:NoteTemplates.document(template.id)};notes.push(note);current=note.id;render();await flush();$('title').focus();$('title').select();}
function toggleRead(){reading=!reading;doc().setReadOnly(reading);$('title').readOnly=reading;document.querySelector('.document-toolbar').inert=reading;$('preview').textContent=reading?'Edit document':'Read view';}
let exportBusy=false;
async function exportPDF(){
 if(exportBusy)return;exportBusy=true;$('pdf-export').disabled=true;$('pdf-export').textContent='Exporting…';$('export-state').textContent='Preparing PDF…';
 try{await flush();const file=await window.desk.exportPDF(structuredClone(active()));if(!file){$('export-state').textContent='Local notebook · PDF export';toast('PDF export cancelled.');return;}$('export-state').textContent='PDF exported · '+new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});$('export-state').title=file;toast('PDF exported.');}
 catch(error){$('export-state').textContent='PDF export failed';throw error;}
 finally{exportBusy=false;$('pdf-export').disabled=false;$('pdf-export').textContent='Export PDF';}
}
function forgetNote(id){documents.get(id)?.destroy();documents.delete(id);conversations.delete(id);dirtyNotes.delete(id);saveErrors.delete(id);notes=notes.filter(note=>note.id!==id);current=[...notebookNotes()].sort((a,b)=>b.updated.localeCompare(a.updated))[0]?.id;}
async function chooseNewNote(){await flush();$('new-note-dialog').showModal();}
$('new').onclick=safely(chooseNewNote);
for(const template of NoteTemplates.templates){const button=document.createElement('button');button.textContent=template.name;button.dataset.noteTemplate=template.id;button.onclick=safely(async()=>{for(const b of $('new-note-choices').children)b.disabled=true;try{await newNote(template.id);$('new-note-dialog').close();}finally{for(const b of $('new-note-choices').children)b.disabled=false;}});$('new-note-choices').append(button);}
$('new-note-close').onclick=()=>$('new-note-dialog').close();$('search').oninput=list;$('title').oninput=()=>{active().title=$('title').value;changed();list();};$('preview').onclick=toggleRead;$('pdf-export').onclick=safely(exportPDF);
$('settings').onclick=()=>$('settings-dialog').showModal();
$('notebook-select').onchange=safely(()=>switchNotebook($('notebook-select').value));
for(const action of ['create','rename'])$('notebook-'+action).onclick=()=>{notebookAction=action;$('notebook-dialog-title').textContent=action==='create'?'New notebook':'Rename notebook';$('notebook-name').value=action==='rename'?collection.notebooks.find(n=>n.id===collection.activeId).name:'';$('notebook-error').textContent='';$('notebook-dialog').showModal();$('notebook-name').focus();};
$('notebook-cancel').onclick=()=>$('notebook-dialog').close();
$('notebook-form').onsubmit=async event=>{event.preventDefault();const submit=$('notebook-form').querySelector('[type=submit]');submit.disabled=true;try{await flush();const data=await desk.updateNotebooks({action:notebookAction,id:collection.activeId,name:$('notebook-name').value});if(notebookAction==='create'){collection.notebooks=data.notebooks;await switchNotebook(data.activeId);}else{collection=data;notebookControls();}$('notebook-dialog').close();}catch(error){$('notebook-error').textContent=error.message;}finally{submit.disabled=false;}};
$('note-move-save').onclick=safely(async()=>{const target=$('note-move').value;if(target===collection.activeId)return;const note=active();const previous=note.notebookId;note.notebookId=target;try{await flush();}catch(error){note.notebookId=previous;throw error;}await switchNotebook(target,note.id);$('settings-dialog').close();toast('Document moved to the selected notebook.');});
$('rename-document').onclick=()=>{if(reading)toggleRead();$('title').focus();$('title').select();};
$('title').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();$('title').blur();doc().focus();}});
$('title').addEventListener('blur',()=>{const name=$('title').value.trim()||'Untitled note';if(active().title!==name){active().title=name;$('title').value=name;changed();list();}});
$('import').onclick=safely(async()=>{await flush();const data=await window.desk.importFile();if(!data)return;const now=new Date().toISOString(),note={id:uid(),notebookId:collection.activeId,title:data.title,created:now,updated:now,blocks:parseBlocks(data.content)};notes.push(note);current=note.id;render();await flush();toast('Imported into a new document.');});
$('delete-note').onclick=safely(async()=>{await flush();const id=current;if(!await window.desk.deleteNote(id))return;forgetNote(id);if(current)render();else await newNote();toast('Note moved to the Recycle Bin.');});
$('archive').onclick=safely(async()=>{if(!confirm('Archive this note? You can restore it from History.'))return;await flush();const id=current;await window.desk.archive(id);forgetNote(id);if(current)render();else await newNote();});
for(const button of document.querySelectorAll('.document-toolbar button'))button.onmousedown=e=>e.preventDefault();
for(const [id,command]of [['bold','toggleBold'],['italic','toggleItalic'],['underline','toggleUnderline'],['bullet-list','toggleBulletList'],['numbered-list','toggleOrderedList'],['undo','undo'],['redo','redo']])$(id).onclick=()=>doc().editor.chain().focus()[command]().run();
$('subscript').onclick=()=>doc().editor.chain().focus().toggleMark('subscript').run();
$('font-family').onchange=()=>doc().editor.chain().focus().setFontFamily($('font-family').value).run();
$('font-size').onchange=()=>{const size=Number($('font-size').value);if(!Number.isFinite(size)||size<8||size>96){toast('Choose a size between 8 and 96 points.');updateToolbar();return;}doc().editor.chain().focus().setFontSize(size+'pt').run();};
$('paragraph-style').onchange=()=>{const level=Number($('paragraph-style').value);if(level)doc().editor.chain().focus().setHeading({level}).run();else doc().editor.chain().focus().setParagraph().run();};
$('text-align').onchange=()=>doc().editor.chain().focus().setTextAlign($('text-align').value).run();
const mathTemplateGroups=[
 ['Basic notation',[11,0,12]],
 ['Calculus',[14,15,13,10]],
 ['Integrals',[1,2,3,4,5,7,8,9,6]],
 ['Matrices & vectors',[16,20]],
 ['Accents & coordinates',[17,18,19,21]],
 ['Symbols & proofs',[22,23]]
];
for(const group of AdvancedMathSymbols.groups){const indices=group.items.map(item=>templates.push(item)-1);mathTemplateGroups.push([group.name,indices]);}
for(const [label,indices]of mathTemplateGroups){const section=document.createElement('optgroup');section.label=label;for(const index of indices){const option=document.createElement('option');option.value=String(index);option.textContent=templates[index][0];section.append(option);}$('formula-select').append(section);}
for(const group of ChemistryTemplates.groups){const section=document.createElement('optgroup');section.label=group.name;for(const [id,label]of group.items){const option=document.createElement('option');option.value=id;option.textContent=label;section.append(option);}$('chemistry-template-select').append(section);}
function insertTemplate(latex){if(lastMath?.isConnected){lastMath.insert(latex);lastMath.dispatchEvent(new Event('input',{bubbles:true}));lastMath.focus();}else doc().insertMath(latex);}
$('chemistry-template-select').onchange=()=>{const entry=ChemistryTemplates.entries.find(t=>t.id===$('chemistry-template-select').value);$('chemistry-template-select').value='';if(entry)insertTemplate(entry.latex);};
let matrixSize='2x2';
$('formula-select').onchange=()=>{if($('formula-select').value==='')return;const template=templates[Number($('formula-select').value)];$('formula-select').value='';insertTemplate(template[0]==='Matrix'?matrixTemplate(matrixSize).latex:template[1]);};
$('insert-matrix').onclick=()=>insertTemplate(matrixTemplate(matrixSize).latex);
$('matrix-size-popover').addEventListener('beforetoggle',event=>{if(event.newState==='open'){$('matrix-size').value=matrixSize;$('matrix-size-error').textContent='';}});
$('matrix-size-popover').addEventListener('toggle',event=>{if(event.newState==='open'){$('matrix-size').focus();$('matrix-size').select();}});
$('matrix-size-form').onsubmit=event=>{event.preventDefault();try{const template=matrixTemplate($('matrix-size').value);matrixSize=template.rows+'x'+template.columns;$('insert-matrix').textContent='Matrix '+template.rows+'×'+template.columns;$('matrix-size-popover').hidePopover();insertTemplate(template.latex);}catch(error){$('matrix-size-error').textContent=error.message;}};
window.addEventListener('mathdesk-equation-focus',event=>lastMath=event.detail);
window.addEventListener('mathdesk-equation-leave',()=>lastMath=null);
document.addEventListener('keydown',safely(async event=>{if(document.querySelector('dialog[open]'))return;if(event.ctrlKey&&event.key.toLowerCase()==='m'){event.preventDefault();if(reading)toggleRead();doc().insertMath('\\placeholder{}',event.shiftKey);}if(event.ctrlKey&&event.key.toLowerCase()==='s'){event.preventDefault();if(event.shiftKey)await exportPDF();else await flush();}if(event.ctrlKey&&event.key.toLowerCase()==='n'){event.preventDefault();await chooseNewNote();}}));
const conversations=new Map();let aiBusy=false,photo=null,photoResult=null,photoBusy=false;
function conversation(){if(!conversations.has(current)){const saved=active().aiHistory;const history=Array.isArray(saved)?saved.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string'):[];conversations.set(current,history);active().aiHistory=history;}return conversations.get(current);}
function renderMarkdown(container,content){
 const math=[],prefix='MATHDESK'+crypto.randomUUID().replaceAll('-','')+'TOKEN';
 const masked=content.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)|\$\$([\s\S]*?)\$\$|(?<![\\$])\$(?!\$)([^\n$]*?)(?<!\\)\$(?!\$)|\\\[([\s\S]*?)\\\]|\\\(([^\n]*?)\\\)/g,(raw,code,display,inline,bracket,paren)=>{
  if(code)return code;const index=math.length;math.push({latex:display??inline??bracket??paren,display:display!==undefined||bracket!==undefined});return prefix+index+'ENDTOKEN';
 });
 container.innerHTML=DOMPurify.sanitize(marked.parse(masked),{FORBID_TAGS:['img','a','input','form','style']});
 const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){const re=new RegExp(prefix+'(\\d+)ENDTOKEN','g');let end=0,match;const fragment=document.createDocumentFragment();let found=false;
  while((match=re.exec(node.textContent))){found=true;fragment.append(document.createTextNode(node.textContent.slice(end,match.index)));const span=document.createElement('span'),item=math[Number(match[1])];katex.render(item.latex,span,{displayMode:item.display,throwOnError:false,trust:false});fragment.append(span);end=match.index+match[0].length;}
  if(found){fragment.append(document.createTextNode(node.textContent.slice(end)));node.replaceWith(fragment);}
 }
}
function insertBlocks(blocks){if(!blocks.length){toast('There is no content to insert.');return;}if(reading)toggleRead();doc().appendBlocks(blocks);toast('Added to your document. Equations remain editable.');}

function renderConversation(){const log=$('ai-chat');log.replaceChildren();for(const m of conversation()){const box=document.createElement('div');box.className='ai-message '+m.role;const label=document.createElement('div');label.className='role';label.textContent=m.role==='user'?'You':'Glass AI';const body=document.createElement('div');renderMarkdown(body,m.content);box.append(label,body);if(m.role==='assistant'&&m.blocks?.length){const insert=document.createElement('button');insert.textContent='＋ Add answer to note';insert.disabled=aiBusy;insert.onclick=()=>{insertBlocks(m.blocks);$('ai-dialog').close();};box.append(insert);}log.append(box);}if(aiBusy){const busy=document.createElement('div');busy.className='busy-text';busy.textContent='Thinking with your note…';log.append(busy);}log.scrollTop=log.scrollHeight;}
$('ai-open').onclick=safely(async()=>{await flush();$('ai-context').textContent='Using note: '+active().title;$('ai-dialog').showModal();renderConversation();const status=await window.desk.aiStatus();$('ai-connection').textContent=status.label;$('ai-ask').disabled=!status.available||aiBusy;$('ai-question').focus();});
async function askAI(){const prompt=$('ai-question').value.trim();if(!prompt||aiBusy)return;const history=conversation();const prior=history.slice(-10).map(({role,content})=>({role,content}));history.push({role:'user',content:prompt});$('ai-question').value='';aiBusy=true;$('ai-ask').disabled=true;$('ai-stop').hidden=false;renderConversation();try{await flush();const result=await window.desk.askAI({note:structuredClone(active()),prompt,history:prior});history.push({role:'assistant',content:result.answer,blocks:result.blocks});}catch(e){toast(e.message,true);history.push({role:'assistant',content:'Request failed: '+e.message});}finally{aiBusy=false;$('ai-ask').disabled=false;$('ai-stop').hidden=true;renderConversation();await flush();}}
$('ai-ask').onclick=safely(askAI);$('ai-stop').onclick=safely(()=>window.desk.cancelAI());$('photo-stop').onclick=safely(()=>window.desk.cancelAI());
function closeAI(){if(aiBusy){toast('Wait for the answer or press Stop before closing.');return;}$('ai-dialog').close();}
$('ai-close').onclick=closeAI;$('ai-dialog').addEventListener('cancel',e=>{if(aiBusy){e.preventDefault();toast('Press Stop to end the current request.');}});
$('ai-new-chat').onclick=safely(async()=>{if(aiBusy)return;active().aiHistory=[];conversations.set(current,active().aiHistory);renderConversation();await flush();});
document.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>{if(aiBusy)return;$('ai-question').value=b.dataset.question;askAI();});
$('ai-question').addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='Enter'){e.preventDefault();e.stopPropagation();askAI();}});
async function pickPhoto(source){if(photoBusy)return;const selected=await window.desk.pickPhoto(source);if(!selected)return;photo=selected;photoResult=null;$('photo-edit').textContent='Edit transcription';$('photo-preview').src=selected.preview;$('photo-name').textContent=selected.name;$('photo-result').textContent='Your transcription will appear here for review before it is added to the note.';$('photo-result').hidden=false;$('photo-transcript').hidden=true;$('photo-recognize').disabled=false;$('photo-recognize').textContent='Transcribe photo ✧';$('photo-insert').hidden=true;$('photo-edit').hidden=true;if(!$('photo-dialog').open)$('photo-dialog').showModal();}
$('photo-open').onclick=safely(()=>pickPhoto('file'));$('photo-paste').onclick=safely(()=>pickPhoto('clipboard'));$('photo-choose-another').onclick=safely(()=>pickPhoto('file'));
function blocksMarkdown(blocks){return blocks.map(b=>b.type==='math'?'$$\n'+b.value+'\n$$':b.value).join('\n\n');}
function parseBlocks(content){return DocTools.parseBlocks(content);}
$('photo-recognize').onclick=safely(async()=>{if(!photo||photoBusy)return;photoResult=null;$('photo-insert').hidden=true;$('photo-edit').hidden=true;photoBusy=true;$('photo-recognize').disabled=true;$('photo-choose-another').disabled=true;$('photo-stop').hidden=false;$('photo-result').hidden=false;$('photo-transcript').hidden=true;$('photo-result').textContent='Transcribing text, equations, and diagram labels…';try{photoResult=await window.desk.recognizePhoto(photo.id);renderMarkdown($('photo-result'),photoResult.answer+'\n\n'+blocksMarkdown(photoResult.blocks));$('photo-transcript').value=blocksMarkdown(photoResult.blocks);$('photo-insert').hidden=false;$('photo-edit').hidden=false;$('photo-recognize').textContent='Recognize again';}catch(e){$('photo-result').textContent=e.message;toast(e.message,true);}finally{photoBusy=false;$('photo-recognize').disabled=false;$('photo-choose-another').disabled=false;$('photo-stop').hidden=true;}});
$('photo-edit').onclick=()=>{const edit=$('photo-transcript').hidden;$('photo-transcript').hidden=!edit;$('photo-result').hidden=edit;$('photo-edit').textContent=edit?'Preview transcription':'Edit transcription';if(!edit)renderMarkdown($('photo-result'),$('photo-transcript').value);};
$('photo-insert').onclick=()=>{if(photoBusy||!photoResult)return;insertBlocks(parseBlocks($('photo-transcript').value));$('photo-dialog').close();};
$('photo-close').onclick=()=>{if(photoBusy){toast('Wait for recognition or press Stop before closing.');return;}$('photo-dialog').close();};$('photo-dialog').addEventListener('cancel',e=>{if(photoBusy)e.preventDefault();});
document.addEventListener('paste',safely(async e=>{if([...e.clipboardData?.items||[]].some(item=>item.type.startsWith('image/'))&&!$('ai-dialog').open&&!$('settings-dialog').open){e.preventDefault();await pickPhoto('clipboard');}}));

let grammarBusy=false,grammarItems=[],grammarSnapshot='',grammarNoteId=null;
function renderGrammar(){
 $('grammar-results').replaceChildren();
 for(const [index,item]of grammarItems.entries()){
  const card=document.createElement('section');card.className='grammar-card '+item.status;
  const before=document.createElement('div');before.className='grammar-before';before.textContent=item.original;
  const after=document.createElement('div');after.className='grammar-after';after.textContent=item.replacement||'(Remove this text)';
  const why=document.createElement('p');why.textContent=item.explanation;
  const actions=document.createElement('div');actions.className='grammar-actions';
  if(item.status==='pending'){
   const apply=document.createElement('button');apply.textContent='Apply';apply.className='primary';apply.onclick=safely(()=>applyGrammar([index]));
   const ignore=document.createElement('button');ignore.textContent='Ignore';ignore.onclick=()=>{item.status='ignored';renderGrammar();};actions.append(apply,ignore);
  }else{const status=document.createElement('span');status.className='grammar-status';status.textContent=item.status==='applied'?'Applied':'Ignored';actions.append(status);}
  card.append(before,after,why,actions);$('grammar-results').append(card);
 }
 $('grammar-all').hidden=!grammarItems.some(item=>item.status==='pending')||grammarBusy;
}
async function applyGrammar(indexes){
 if(grammarBusy)return;
 if(current!==grammarNoteId)throw Error('The document changed. Run the grammar check again.');
 const chosen=indexes.map(index=>grammarItems[index]).filter(item=>item.status==='pending');if(!chosen.length)return;
 if(reading)toggleRead();
 doc().applyGrammarEdits(chosen,grammarSnapshot);
 for(const item of grammarItems){
  if(chosen.includes(item)){item.status='applied';continue;}
  if(item.status!=='pending')continue;
  const shift=chosen.filter(edit=>edit.to<=item.from).reduce((sum,edit)=>sum+edit.replacement.length-(edit.to-edit.from),0);
  item.from+=shift;item.to+=shift;
 }
 grammarSnapshot=JSON.stringify(doc().editor.getJSON());renderGrammar();await flush();
}
$('grammar-open').onclick=safely(async()=>{
 await flush();grammarItems=[];grammarSnapshot='';grammarNoteId=current;
 $('grammar-context').textContent='Checking document: '+(active().title||'Untitled note');
 $('grammar-summary').textContent='Check the body text for grammar, spelling, and punctuation. Equations and code stay unchanged.';
 $('grammar-check').textContent='Check grammar';renderGrammar();$('grammar-dialog').showModal();
});
$('grammar-check').onclick=safely(async()=>{
 if(grammarBusy)return;
 const snapshot=JSON.stringify(doc().editor.getJSON()),noteId=current,segments=doc().grammarSegments();
 if(!segments.length){$('grammar-summary').textContent='There is no prose to check. Equations and code are skipped.';return;}
 grammarBusy=true;grammarItems=[];renderGrammar();$('grammar-check').disabled=true;$('grammar-stop').hidden=false;$('grammar-stop').hidden=$('grammar-mode').value==='quick';$('grammar-summary').textContent=$('grammar-mode').value==='quick'?'Checking common grammar and spelling locally…':'Reviewing compact prose batches with Codex…';
 try{
  const mode=$('grammar-mode').value;const result=mode==='quick'?DocGrammar.quick(segments):await window.desk.checkGrammar(DocGrammar.pack(segments));
  if(current!==noteId||JSON.stringify(doc().editor.getJSON())!==snapshot)throw Error('The document changed while checking. Please check again.');
  let skipped=0;
  const candidates=[];
  for(const suggestion of result.suggestions){
   const segment=segments.find(segment=>segment.id===suggestion.segmentId),offset=segment?.text.indexOf(suggestion.original);
   if(!segment||offset<0||segment.text.lastIndexOf(suggestion.original)!==offset||suggestion.original===suggestion.replacement||suggestion.original.includes('[equation]')||suggestion.replacement.includes('[equation]')||suggestion.replacement.length>20000){skipped++;continue;}
   candidates.push({...suggestion,from:segment.from+offset,to:segment.from+offset+suggestion.original.length,status:'pending'});
  }
  for(const item of candidates.sort((a,b)=>a.from-b.from)){if(grammarItems.length&&grammarItems.at(-1).to>item.from){skipped++;continue;}grammarItems.push(item);}
  grammarSnapshot=snapshot;grammarNoteId=noteId;
  $('grammar-summary').textContent=grammarItems.length?`${grammarItems.length} suggestion${grammarItems.length===1?'':'s'} to review.`:(skipped?'The suggestions could not be matched safely. Try checking again.':($('grammar-mode').value==='quick'?'No common issues found by the quick check. Deep review can check more complex grammar.':'No grammar or spelling corrections found.'));
  if(skipped&&grammarItems.length)$('grammar-summary').textContent+=' Uncertain or overlapping edits were skipped.';
 }catch(error){$('grammar-summary').textContent=error.message;toast(error.message,true);}
 finally{grammarBusy=false;$('grammar-check').disabled=false;$('grammar-check').textContent='Check again';$('grammar-stop').hidden=true;renderGrammar();}
});
$('grammar-all').onclick=safely(()=>applyGrammar(grammarItems.map((_,index)=>index)));
$('grammar-stop').onclick=safely(()=>window.desk.cancelAI());
$('grammar-close').onclick=()=>{if(grammarBusy){toast('Press Stop to end the grammar check first.');return;}$('grammar-dialog').close();};
$('grammar-dialog').addEventListener('cancel',event=>{if(grammarBusy){event.preventDefault();toast('Press Stop to end the grammar check first.');}});
async function showVersions(){
 $('history-list').replaceChildren();const versions=await window.desk.listVersions(current);$('history-caption').textContent='Up to 50 earlier versions, captured after substantial editing (about 250 changed characters or comparable equation, layout, or diagram changes). Small edits still autosave. Restoring keeps the current version.';
 for(const version of versions){const row=document.createElement('div');row.className='history-row';const label=document.createElement('span');label.textContent=new Date(version.date).toLocaleString();const restore=document.createElement('button');restore.textContent='Restore';restore.onclick=safely(async()=>{await flush();const restored=await window.desk.restoreVersion({id:current,name:version.name});documents.get(current)?.destroy();documents.delete(current);notes[notes.findIndex(n=>n.id===current)]=restored;render();$('history-dialog').close();toast('Earlier version restored. The previous version is in History.');});row.append(label,restore);$('history-list').append(row);}
 if(!versions.length)$('history-list').textContent='No earlier versions yet. History appears after substantial editing; all smaller edits are still saved locally.';
}
async function showArchives(){
 $('history-list').replaceChildren();$('history-caption').textContent='Restore an archived document to your notebook.';const archived=await window.desk.listArchive();
 for(const note of archived){const row=document.createElement('div');row.className='history-row';const label=document.createElement('span');label.textContent=note.title||'Untitled note';const restore=document.createElement('button');restore.textContent='Restore';restore.onclick=safely(async()=>{const restored=await window.desk.restoreArchive(note.id);restored.notebookId=collection.activeId;await desk.save(restored);notes.push(restored);current=restored.id;render();$('history-dialog').close();toast('Archived note restored.');});row.append(label,restore);$('history-list').append(row);}
 if(!archived.length)$('history-list').textContent='No archived notes.';
}
$('history-open').onclick=safely(async()=>{await flush();await showVersions();$('history-dialog').showModal();});$('history-close').onclick=()=>$('history-dialog').close();$('versions-tab').onclick=safely(showVersions);$('archive-tab').onclick=safely(showArchives);
window.addEventListener('beforeunload',event=>{if(closing)return;event.preventDefault();Promise.all([window.MathdeskDrawing?.flushDraft(),window.GlassBiologyTools?.flush()]).then(()=>flush()).then(()=>{closing=true;window.close();}).catch(error=>toast('Could not save: '+error.message,true));});
(async()=>{
 const data=await window.desk.load();notes=data.notes;collection=data.collection||collection;notebookControls();
 if(data.warnings?.length){$('load-warnings').textContent=data.warnings.join(' ');$('load-warnings').hidden=false;}
 if(!notes.length){const now=new Date().toISOString();notes=[{id:uid(),notebookId:collection.activeId,title:'A space to think',created:now,updated:now,blocks:[{type:'text',value:'Welcome to your notebook. Write freely on this page, just as you would in a document.\n\nSelect text to change its font, size, or formatting. Times New Roman is the default.'},{type:'math',value:'\\int_0^1 x^2\\,dx=\\frac{1}{3}'},{type:'text',value:'Typing the word integral in a sentence leaves it as text. Press Ctrl M only when you want an editable equation, then press Tab to keep writing.\n\nUse Export PDF to save a shareable copy with your text, equations, and drawings.'}]}];}
 const selected=collection.notebooks.find(n=>n.id===collection.activeId)?.lastNoteId;current=notebookNotes().find(n=>n.id===selected)?.id||[...notebookNotes()].sort((a,b)=>b.updated.localeCompare(a.updated))[0]?.id;if(current){render();await flush();}else await newNote();
})().catch(error=>toast('Could not load notebook: '+error.message,true));

