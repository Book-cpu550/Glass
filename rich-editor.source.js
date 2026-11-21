import {Sections} from './productivity-editor.source.js';
import Collaboration from '@tiptap/extension-collaboration';
import {Shared,cursorExtension} from './sharing-editor.source.js';
import {Editor,Node,Mark,mergeAttributes,getSchema} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TextStyle,FontFamily,FontSize} from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {TextSelection} from '@tiptap/pm/state';
import {escapeText,codeSpan,codeBlock} from './text-markdown.cjs';
import {DOMSerializer} from '@tiptap/pm/model';
import {ReferenceLabel,CrossReference,PageBreak,ScienceTools,setReview} from './science-editor.source.js';
import {TableExtensions} from './table-editor.source.js';
let serializationSchema;

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Subscript=Mark.create({
 name:'subscript',parseHTML(){return [{tag:'sub'}];},renderHTML({HTMLAttributes}){return ['sub',HTMLAttributes,0];},
 addKeyboardShortcuts(){return {'Mod-=':()=>this.editor.commands.toggleMark(this.name)};}
});
function mathExtension(name,inline){return Node.create({
  name,group:inline?'inline':'block',inline,atom:true,selectable:true,
  addAttributes(){return {equationId:{default:''},latex:{default:'',parseHTML:el=>el.getAttribute('data-latex')||'',renderHTML:attrs=>({'data-latex':attrs.latex})}};},
  parseHTML(){return [{tag:`${inline?'span':'div'}[data-type="${name}"]`}];},
  renderHTML({HTMLAttributes}){return [inline?'span':'div',mergeAttributes(HTMLAttributes,{'data-type':name})];},
  addNodeView(){return ({node,editor,getPos})=>{
    let current=node;
    let leaving=false,leaveGuard;
    const dom=document.createElement(inline?'span':'div');dom.className=inline?'document-inline-math':'document-display-math';dom.contentEditable='false';
    const field=document.createElement('math-field');field.mathdeskGetPos=getPos;field.setAttribute('aria-label',inline?'Inline equation':'Display equation');field.setAttribute('math-virtual-keyboard-policy','manual');field.maxMatrixCols=20;
    // The surrounding atomic node is not selectable as document text. MathLive
    // must opt back in before mounting or it disables its own pointer hit testing.
    field.style.userSelect='text';field.style.webkitUserSelect='text';
    field.readOnly=!editor.isEditable;
    field.title='Click a bound or box to edit. Tab: next box; Shift+Tab: previous box.';
    field.value=node.attrs.latex;
    field.addEventListener('mount',()=>{field.inlineShortcuts={...field.inlineShortcuts,root:'\\sqrt{#0}',integral:'\\int #0 \\, dx',summation:'\\sum_{n=1}^{\\infty} #0'};});
    field.addEventListener('input',event=>{event.stopPropagation();const pos=getPos();if(typeof pos==='number'&&editor.state.doc.nodeAt(pos)?.type.name===name)editor.view.dispatch(editor.state.tr.setNodeMarkup(pos,undefined,{...current.attrs,latex:field.value}));});
    field.addEventListener('pointerdown',()=>{leaving=false;clearTimeout(leaveGuard);},true);
    field.addEventListener('focus',()=>{
      // MathLive finishes focus asynchronously. A queued focus from an earlier
      // box must not steal the next sentence after the user tabs out.
      if(leaving){field.blur();editor.view.focus();return;}
      window.dispatchEvent(new CustomEvent('mathdesk-equation-focus',{detail:field}));
    });
    const leave=event=>{
      event.preventDefault();event.stopPropagation();
      const pos=getPos();if(typeof pos!=='number')return;
      const backward=event.key==='ArrowLeft'||event.shiftKey||event.detail?.direction==='backward'||event.detail?.direction==='upward';
      leaving=true;clearTimeout(leaveGuard);leaveGuard=setTimeout(()=>{leaving=false;},120);
      field.blur();
      let target=backward?pos:pos+current.nodeSize;
      if(!inline){const state=editor.state,at=backward?pos:pos+current.nodeSize;const tr=state.tr;if(at===0||at===state.doc.content.size||!state.doc.resolve(at).nodeAfter?.isTextblock)tr.insert(at,editor.schema.nodes.paragraph.create());const resolved=tr.doc.resolve(Math.max(0,Math.min(at,tr.doc.content.size)));tr.setSelection(TextSelection.near(resolved,backward?-1:1));editor.view.dispatch(tr);target=editor.state.selection.from;}
      editor.commands.setTextSelection(target);editor.view.focus();
      window.dispatchEvent(new CustomEvent('mathdesk-equation-leave'));
    };
    field.addEventListener('keydown',event=>{
      if(event.key==='Escape'){leave(event);return;}if(event.key!=='Tab'||event.ctrlKey||event.altKey||event.metaKey)return;
      event.preventDefault();event.stopPropagation();
      if(!/\\placeholder(?:\[[^\]]*\])?\{|\{\s*\}|\[\s*\]/.test(field.value)){leave(event);return;}
      // Only leave the equation when MathLive reports no more editable boxes.
      field.executeCommand(event.shiftKey?'moveToPreviousPlaceholder':'moveToNextPlaceholder');
    },true);field.addEventListener('move-out',leave);
    dom.append(field);
    return {dom,stopEvent:event=>dom.contains(event.target),ignoreMutation:()=>true,destroy:()=>clearTimeout(leaveGuard),
      update(next){if(next.type!==current.type)return false;current=next;if(field.value!==next.attrs.latex)field.value=next.attrs.latex;return true;}
    };
  };
}});}
const InlineMath=mathExtension('inlineMath',true),DisplayMath=mathExtension('displayMath',false);
const Drawing=Node.create({name:'drawing',group:'block',atom:true,selectable:true,
 addAttributes(){return {width:{default:100},align:{default:'center'},caption:{default:''},png:{default:''},strokes:{default:[]},base:{default:''},graph:{default:null}};},
 parseHTML(){return [{tag:'div[data-type="drawing"]',getAttrs:node=>{const png=node.getAttribute('data-png');if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(png||''))return false;const parse=(name,fallback)=>{try{return JSON.parse(node.getAttribute(name)||'null')??fallback;}catch{return fallback;}};const strokes=parse('data-strokes',[]),graph=parse('data-graph',null),base=node.getAttribute('data-base')||'';return {png,strokes:Array.isArray(strokes)?strokes:[],base:/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(base)?base:'',graph:graph&&typeof graph==='object'&&!Array.isArray(graph)?graph:null};}}];},
 renderHTML({node}){return ['div',{'data-type':'drawing','data-png':node.attrs.png,'data-strokes':JSON.stringify(node.attrs.strokes),'data-base':node.attrs.base,'data-graph':JSON.stringify(node.attrs.graph)},['img',{src:node.attrs.png,alt:'Drawing'}]];},
 addNodeView(){return ({node,editor,getPos})=>{let current=node;const dom=document.createElement('figure');dom.className='document-drawing';dom.contentEditable='false';const caption=document.createElement('figcaption');const layout=()=>{dom.style.width=Math.max(20,Math.min(100,Number(current.attrs.width)||100))+'%';dom.style.marginLeft=current.attrs.align==='left'?'0':'auto';dom.style.marginRight=current.attrs.align==='right'?'0':'auto';caption.textContent=current.attrs.caption||'';};layout();const img=document.createElement('img');img.src=node.attrs.png;img.alt='Drawing';img.ondblclick=()=>edit.click();const edit=document.createElement('button');edit.textContent='Edit drawing';edit.type='button';edit.onclick=()=>{if(editor.isEditable)window.dispatchEvent(new CustomEvent('mathdesk-edit-drawing',{detail:{position:getPos(),attrs:current.attrs}}));};dom.append(img,caption,edit);const commitView=(attrs,expected)=>{if(editor.isDestroyed||!editor.isEditable)throw Error('Switch to Edit document to save this view.');const position=getPos();if(!Number.isInteger(position)||position<0||position>=editor.state.doc.content.size)throw Error('This figure was removed.');const live=editor.state.doc.nodeAt(position);if(live?.type.name!=='drawing'||JSON.stringify(live.attrs)!==JSON.stringify(expected))throw Error('This figure changed. Reopen its 3D view.');editor.view.dispatch(editor.state.tr.setNodeMarkup(position,undefined,attrs));};const interactive=window.GlassInlineGraphs?.mount({dom,img,attrs:()=>current.attrs,editable:()=>editor.isEditable,save:commitView});const biological=window.GlassInlineBiology?.mount({dom,img,attrs:()=>current.attrs,editable:()=>editor.isEditable,save:commitView});return {dom,ignoreMutation:()=>true,stopEvent:event=>event.target===edit||!!event.target.closest?.('.inline-graph-ui,.inline-bio-ui'),update(next){if(next.type!==current.type)return false;current=next;img.src=next.attrs.png;layout();interactive?.update();biological?.update();return true;},destroy(){interactive?.destroy();biological?.destroy();}};};}
});
function textMarkdown(node){
  if(node.type==='inlineMath')return '$'+node.attrs.latex+'$';if(node.type==='crossReference')return node.attrs.label||'Missing reference';
  if(node.type==='hardBreak')return '  \n';
  if(node.type!=='text')return (node.content||[]).map(textMarkdown).join('');
  let value=escapeText(node.text);
  for(const mark of node.marks||[]){if(mark.type==='bold')value='**'+value+'**';if(mark.type==='italic')value='*'+value+'*';if(mark.type==='strike')value='~~'+value+'~~';if(mark.type==='code')value=codeSpan(node.text);if(mark.type==='underline')value='<u>'+value+'</u>';if(mark.type==='subscript')value='<sub>'+value+'</sub>';if(mark.type==='link')value='['+value+']('+mark.attrs.href+')';}
  return value;
}
function blockMarkdown(node){
  if(node.type==='table'){const host=document.createElement('div');host.append(DOMSerializer.fromSchema(serializationSchema).serializeNode(serializationSchema.nodeFromJSON(node)));return host.innerHTML;}
  if(node.type==='displayMath')return '$$\n'+node.attrs.latex+'\n$$';
  if(node.type==='heading')return '#'.repeat(node.attrs.level)+' '+textMarkdown(node);
  if(node.type==='codeBlock')return codeBlock((node.content||[]).map(n=>n.text||'').join(''),node.attrs?.language||'');
  if(node.type==='horizontalRule')return '---';if(node.type==='pageBreak')return '<div data-page-break></div>';if(node.type==='referenceLabel')return node.attrs.label||'';
  if(node.type==='blockquote')return (node.content||[]).map(blockMarkdown).join('\n\n').split('\n').map(line=>'> '+line).join('\n');
  if(node.type==='bulletList'||node.type==='orderedList')return (node.content||[]).map((item,index)=>{const lines=(item.content||[]).map(blockMarkdown).join('\n\n').split('\n');const marker=node.type==='bulletList'?'- ':`${(node.attrs?.start||1)+index}. `;return marker+lines[0]+lines.slice(1).map(line=>'\n'+(' '.repeat(marker.length))+line).join('');}).join('\n');
  return textMarkdown(node);
}
function toBlocks(doc){return (doc.content||[]).map(node=>node.type==='drawing'?{id:crypto.randomUUID(),type:'drawing',value:node.attrs.png,strokes:node.attrs.strokes,base:node.attrs.base,graph:node.attrs.graph}:node.type==='displayMath'?{id:crypto.randomUUID(),type:'math',value:node.attrs.latex}:{id:crypto.randomUUID(),type:'text',value:blockMarkdown(node)});}
function fromBlocks(blocks){
  return blocks.map(block=>{
    if(block.type==='drawing')return `<div data-type="drawing" data-png="${escape(block.value)}" data-strokes="${escape(JSON.stringify(block.strokes||[]))}" data-base="${escape(block.base||'')}" data-graph="${escape(JSON.stringify(block.graph||null))}"></div>`;
    if(block.type==='math')return `<div data-type="displayMath" data-latex="${escape(block.value)}"></div>`;
    const math=[],prefix='MDMATH'+crypto.randomUUID().replaceAll('-','')+'TOKEN';
    const masked=block.value.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)|\$\$([\s\S]*?)\$\$|(?<![\\$])\$(?!\$)([^\n$]*?)(?<!\\)\$(?!\$)|\\\[([\s\S]*?)\\\]|\\\(([^\n]*?)\\\)/g,(raw,code,display,inline,bracket,paren)=>{
      if(code)return code;const i=math.length;math.push({latex:display??inline??bracket??paren,display:display!==undefined||bracket!==undefined});return prefix+i+'ENDTOKEN';
    });
    let html=window.DOMPurify.sanitize(window.marked.parse(masked,{breaks:true}),{FORBID_TAGS:['img','input','form','style']});
    return html.replace(new RegExp(prefix+'(\\d+)ENDTOKEN','g'),(_,i)=>{const item=math[Number(i)];return `<span data-type="inlineMath" data-latex="${escape(item.latex)}"></span>`;});
  }).join('')||'<p></p>';
}
function mount(parent,{doc,blocks,onChange,onSelection,collaboration}){
  const extensions=[
    StarterKit.configure({...(collaboration?{undoRedo:false}:{}),link:{openOnClick:false,autolink:false}}),TextStyle,FontFamily,FontSize,Subscript,TextAlign.configure({types:['heading','paragraph']}),Placeholder.configure({placeholder:'Start writing. Press Ctrl M when you want an equation.'}),InlineMath,DisplayMath,Drawing,ReferenceLabel,CrossReference,PageBreak,ScienceTools,Sections,...TableExtensions,
  ];
  if(collaboration)extensions.push(Collaboration.configure({document:collaboration.document}),cursorExtension(collaboration));
  serializationSchema=getSchema(extensions);if(doc){const parsed=serializationSchema.nodeFromJSON(doc);parsed.check();}
  const editor=new Editor({element:parent,extensions,editable:collaboration?.role!=='view',content:collaboration?undefined:doc||fromBlocks(blocks),editorProps:{handleKeyDown(view,event){if(!view.state.selection.empty||!['ArrowLeft','ArrowRight'].includes(event.key))return false;const selection=view.state.selection,backward=event.key==='ArrowLeft',node=backward?selection.$from.nodeBefore:selection.$from.nodeAfter;if(!['inlineMath','displayMath'].includes(node?.type.name))return false;const position=backward?selection.from-node.nodeSize:selection.from;const field=[...parent.querySelectorAll('math-field')].find(f=>f.mathdeskGetPos?.()===position);if(!field)return false;event.preventDefault();field.focus();field.executeCommand(backward?'moveToMathfieldEnd':'moveToMathfieldStart');return true;},attributes:{'aria-label':'Document editor',role:'textbox','aria-multiline':'true',spellcheck:'false'}},
  onUpdate:({editor})=>onChange(editor.getJSON(),toBlocks(editor.getJSON())),onSelectionUpdate:()=>onSelection?.(),onTransaction:()=>onSelection?.()});
  function insertMath(latex='\\placeholder{}',display=false){
    latex=latex.replace(/#(?:0|\?)/g,'\\placeholder{}');
    const type=display?'displayMath':'inlineMath';
    const from=editor.state.selection.from;
    editor.chain().focus().insertContent({type,attrs:{latex}}).run();
    // Node views mount before MathLive's keyboard sink is ready. Focus after layout.
    requestAnimationFrame(()=>{
      const math=[...parent.querySelectorAll('math-field')].find(field=>field.mathdeskGetPos?.()===from||field.mathdeskGetPos?.()===from+1)||[...parent.querySelectorAll('math-field')].at(-1);
      if(latex==='\\placeholder{}')math?.select();else{
        math?.focus();
        if(latex.includes('\\placeholder')){math?.executeCommand('moveToMathfieldStart');math?.executeCommand('moveToNextPlaceholder');}
      }
    });
  }
  function grammarSegments(){
    const segments=[],contexts=new Map();
    editor.state.doc.descendants((node,pos)=>{
      if(node.type.name==='codeBlock')return false;
      if(!node.isText||!node.text.trim()||node.marks.some(mark=>mark.type.name==='code'))return;
      const resolved=editor.state.doc.resolve(pos),paragraph=resolved.parent,contextId=resolved.start();let context='';
      if(!contexts.has(contextId)){paragraph.forEach(child=>{context+=child.isText?(child.marks.some(mark=>mark.type.name==='code')?' [code] ':child.text):child.type.name==='inlineMath'?' [equation] ':child.type.name==='hardBreak'?'\n':'';});contexts.set(contextId,context);}
      segments.push({id:segments.length,text:node.text,contextId,context,from:pos,to:pos+node.nodeSize});
    });return segments;
  }
  function applyGrammarEdits(edits,expected){
    if(JSON.stringify(editor.getJSON())!==expected)throw Error('The document changed. Run the grammar check again.');
    const ordered=[...edits].sort((a,b)=>a.from-b.from);
    for(let i=0;i<ordered.length;i++){
      const edit=ordered[i];
      if(!Number.isInteger(edit.from)||!Number.isInteger(edit.to)||edit.from>=edit.to||typeof edit.replacement!=='string'||edit.from<0||edit.to>editor.state.doc.content.size||(i&&ordered[i-1].to>edit.from))throw Error('These suggestions overlap or are no longer valid. Run the check again.');
      if(editor.state.doc.textBetween(edit.from,edit.to,'','\uFFFC')!==edit.original)throw Error('The original wording changed. Run the check again.');
      let protectedContent=false;
      editor.state.doc.nodesBetween(edit.from,edit.to,node=>{if((node.isLeaf&&!node.isText)||node.type.name==='codeBlock'||node.marks.some(mark=>mark.type.name==='code'))protectedContent=true;});
      if(protectedContent)throw Error('Grammar corrections cannot change equations or code.');
    }
    let transaction=editor.state.tr;
    for(const edit of ordered.reverse())transaction=transaction.insertText(edit.replacement,edit.from,edit.to);
    editor.view.dispatch(transaction);
  }
  function drawingSession(detail){
    const selection=editor.state.selection;
    let position=detail?detail.position:selection.$from.depth?selection.$from.after(1):selection.from;
    let expected=detail?JSON.stringify(detail.attrs):null,removed=false,disposed=false;
    const map=({transaction})=>{if(!transaction.docChanged)return;const mapped=transaction.mapping.mapResult(position,1);position=mapped.pos;if(expected&&mapped.deleted)removed=true;};
    editor.on('transaction',map);
    return {
      commit(attrs){
        if(disposed||editor.isDestroyed||!editor.isEditable)throw Error('Reopen the drawing in an editable document.');
        const state=editor.state;
        if(expected){
          const node=!removed&&position>=0&&position<state.doc.content.size?state.doc.nodeAt(position):null;
          if(node?.type.name!=='drawing'||JSON.stringify(node.attrs)!==expected)throw Error('This drawing changed or was removed. Your draft is kept; reopen it to continue.');
          // Do not let our own attribute update mark this target as removed.
          editor.off('transaction',map);
          try{editor.view.dispatch(state.tr.setNodeMarkup(position,undefined,attrs));expected=JSON.stringify(editor.state.doc.nodeAt(position).attrs);}finally{editor.on('transaction',map);}
        }else{
          position=Math.max(0,Math.min(position,state.doc.content.size));
          const resolved=state.doc.resolve(position);if(resolved.depth)position=resolved.after(1);
          const drawing=editor.schema.nodes.drawing.createChecked(attrs),paragraph=editor.schema.nodes.paragraph.create();
          const transaction=state.tr.insert(position,[drawing,paragraph]);
          transaction.setSelection(TextSelection.create(transaction.doc,position+drawing.nodeSize+1));
          const insertedAt=position;editor.view.dispatch(transaction);position=insertedAt;
          expected=JSON.stringify(editor.state.doc.nodeAt(position).attrs);
        }
      },
      dispose(){disposed=true;editor.off('transaction',map);}
    };
  }
  return {editor,setReview:suggestions=>setReview(editor,suggestions),insertMath,drawingSession,grammarSegments,applyGrammarEdits,toBlocks:()=>toBlocks(editor.getJSON()),focus:()=>editor.commands.focus(),destroy:()=>editor.destroy(),setReadOnly:value=>{editor.setEditable(!value&&collaboration?.role!=='view',false);for(const field of parent.querySelectorAll('math-field'))field.readOnly=value||collaboration?.role==='view';},getHTML:()=>editor.getHTML(),appendBlocks:blocks=>editor.chain().focus('end').insertContent(fromBlocks(blocks)).run()};
}
window.RichDocument={mount,toBlocks,fromBlocks,shared:{...Shared,create:json=>Shared.create(serializationSchema,json)}};
