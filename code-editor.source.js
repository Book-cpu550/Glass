import {Extension} from '@tiptap/core';
import {Plugin,TextSelection} from '@tiptap/pm/state';
import {Decoration,DecorationSet} from '@tiptap/pm/view';
import tools from './code-tools.js';
function decorations(doc){const entries=[];let line=1;doc.descendants((node,pos)=>{if(node.type.name!=='codeBlock')return;const text=node.textContent;for(const token of tools.tokens(text,node.attrs.language))entries.push(Decoration.inline(pos+1+token.from,pos+1+token.to,{'class':'code-token-'+token.kind}));let offset=0;for(const row of text.split('\n')){const number=line++;if(number>10000){offset+=row.length+1;continue;}entries.push(Decoration.widget(pos+1+offset,()=>{const mark=document.createElement('span');mark.className='code-line-number';mark.textContent=number;mark.contentEditable='false';mark.setAttribute('aria-hidden','true');return mark;},{side:-1,key:'line-'+number}));offset+=row.length+1;}line++;return false;});return DecorationSet.create(doc,entries);}
export const CodeEditor=Extension.create({
 name:'glassCodeEditor',priority:1100,
 addOptions(){return {language:'javascript'};},
 addKeyboardShortcuts(){return {
  'Mod-Enter':()=>true,
  ArrowUp:()=>{const s=this.editor.state.selection;return s.empty&&s.$from.parent.type.name==='codeBlock'&&s.$from.parentOffset===0&&s.$from.before()===0;},
  Enter:()=>{const editor=this.editor,s=editor.state.selection;if(s.$from.parent.type.name!=='codeBlock'||!s.$from.sameParent(s.$to))return false;const before=s.$from.parent.textContent.slice(0,s.$from.parentOffset),line=before.slice(before.lastIndexOf('\n')+1),indent=line.match(/^[ \t]*/)[0];if(s.empty&&indent&&line.trim()===''&&s.$from.parent.textContent.slice(s.$from.parentOffset).split('\n')[0].trim()===''){const shorter=indent.replace(/ {1,2}$|\t$/,'');return editor.commands.command(({tr,dispatch})=>{if(dispatch)dispatch(tr.insertText('\n'+shorter,s.from-line.length,s.to));return true;});}return editor.commands.insertContent({type:'text',text:'\n'+indent});}
 };},
 addProseMirrorPlugins(){const editor=this.editor,language=this.options.language;return [new Plugin({
  state:{init:(_,state)=>decorations(state.doc),apply:(tr,old)=>tr.docChanged?decorations(tr.doc):old},
  props:{decorations(state){return this.getState(state);},handlePaste(view,event){if(!editor.isEditable)return false;const text=event.clipboardData?.getData('text/plain');if(!text)return false;event.preventDefault();view.dispatch(view.state.tr.insertText(text.replace(/\r\n?/g,'\n')).setMeta('paste',true).setMeta('uiEvent','paste'));return true;}},
  appendTransaction(transactions,oldState,state){
   if(!editor.isEditable||!transactions.some(tr=>tr.docChanged||tr.selectionSet))return null;
   const selection=state.selection,node=selection.$from.parent;
   if(!['paragraph','heading'].includes(node.type.name)||!selection.$from.sameParent(selection.$to))return null;
   let protectedContent=false;node.forEach(child=>{if(!child.isText&&child.type.name!=='hardBreak')protectedContent=true;});if(protectedContent)return null;
   const text=node.textBetween(0,node.content.size,'\n','\n'),position=selection.$from.before(),block=state.schema.nodes.codeBlock.create({language},text?state.schema.text(text):null),tr=state.tr.replaceWith(position,position+node.nodeSize,block);
   tr.setSelection(TextSelection.create(tr.doc,position+1+Math.min(selection.$from.parentOffset,text.length),position+1+Math.min(selection.$to.parentOffset,text.length)));
   if(!transactions.some(t=>t.docChanged))tr.setMeta('addToHistory',false);return tr;
  }
 })];}
});
