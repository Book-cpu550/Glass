(function(root){
 'use strict';
 const blocks=new Set(['paragraph','heading','blockquote','bulletList','orderedList','horizontalRule','codeBlock','displayMath','drawing','table']);
 const inline=new Set(['text','hardBreak','inlineMath']);
 const marks=new Set(['bold','italic','strike','code','underline','subscript','textStyle','link']);
 function validDocument(doc){
  let count=0;
  function visit(node,depth=0){
   if(!node||typeof node!=='object'||depth>64||++count>50000||typeof node.type!=='string')return false;
   const children=node.content||[];if(!Array.isArray(children)||node.marks&&!Array.isArray(node.marks))return false;
   if(children.some(child=>!child||typeof child!=='object'||typeof child.type!=='string'))return false;
   if((node.marks||[]).some(mark=>!mark||!marks.has(mark.type)))return false;
   if(node.type==='text')return typeof node.text==='string'&&node.text.length>0&&!children.length;
   if(node.type==='drawing')return typeof node.attrs?.png==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(node.attrs.png)&&Array.isArray(node.attrs.strokes)&&!children.length;
   if(['inlineMath','displayMath'].includes(node.type))return typeof node.attrs?.latex==='string'&&!children.length;
   if(['hardBreak','horizontalRule'].includes(node.type))return !children.length;
   if(node.type==='doc'){if(!children.length||children.some(child=>!blocks.has(child.type)))return false;}
   else if(['paragraph','heading'].includes(node.type)){if(children.some(child=>!inline.has(child.type)))return false;if(node.type==='heading'&&![1,2,3,4,5,6].includes(node.attrs?.level))return false;}
   else if(node.type==='codeBlock'){if(children.some(child=>child.type!=='text'||child.marks?.length))return false;}
   else if(node.type==='blockquote'){if(!children.length||children.some(child=>!blocks.has(child.type)))return false;}
   else if(['bulletList','orderedList'].includes(node.type)){if(!children.length||children.some(child=>child.type!=='listItem'))return false;}
   else if(node.type==='listItem'){if(!children.length||children[0].type!=='paragraph'||children.some(child=>!blocks.has(child.type)))return false;}
   else if(node.type==='table'){if(!children.length||children.some(child=>child.type!=='tableRow'))return false;}
   else if(node.type==='tableRow'){if(!children.length||children.some(child=>!['tableCell','tableHeader'].includes(child.type)))return false;}
   else if(['tableCell','tableHeader'].includes(node.type)){if(!children.length||children.some(child=>!blocks.has(child.type)))return false;for(const key of ['colspan','rowspan'])if(node.attrs?.[key]!==undefined&&(!Number.isInteger(node.attrs[key])||node.attrs[key]<1||node.attrs[key]>1000))return false;const widths=node.attrs?.colwidth;if(widths!=null&&(!Array.isArray(widths)||widths.length!==(node.attrs?.colspan||1)||widths.some(width=>!Number.isInteger(width)||width<0||width>10000)))return false;if(node.attrs?.backgroundColor!=null&&(typeof node.attrs.backgroundColor!=='string'||node.attrs.backgroundColor.length>100))return false;}
   else return false;
   return children.every(child=>visit(child,depth+1));
  }
  return doc?.type==='doc'&&visit(doc);
 }
 // Scan display math while treating Markdown code spans/fences as opaque text.
 function parseBlocks(content){
  const result=[];let buffer='',position=0;
  const flush=()=>{if(buffer.trim())result.push({type:'text',value:buffer.trim()});buffer='';};
  while(position<content.length){
   const tail=content.slice(position);
   if((position===0||content[position-1]==='\n')&&/^ {0,3}(?:`{3,}|~{3,})/.test(tail)){
    const opening=/^( {0,3})(`{3,}|~{3,})[^\n]*(?:\n|$)/.exec(tail),marker=opening[2][0],length=opening[2].length;
    const close=new RegExp('^ {0,3}'+(marker==='`'?'`':'~')+'{'+length+',}[ \\t]*$','m');
    const remaining=tail.slice(opening[0].length),match=close.exec(remaining);
    const end=match?opening[0].length+match.index+match[0].length:tail.length;
    buffer+=tail.slice(0,end);position+=end;continue;
   }
   if(tail[0]==='`'){
    const run=/^`+/.exec(tail)[0],end=content.indexOf(run,position+run.length);
    if(end>=0){buffer+=content.slice(position,end+run.length);position=end+run.length;continue;}
   }
   if(tail.startsWith('\\$')){buffer+=tail.slice(0,2);position+=2;continue;}
   const delimiter=tail.startsWith('$$')?'$$':tail.startsWith('\\[')?'\\[':null;
   if(delimiter){const closing=delimiter==='$$'?'$$':'\\]';const end=content.indexOf(closing,position+2);if(end>=0){flush();result.push({type:'math',value:content.slice(position+2,end).trim()});position=end+2;continue;}}
   buffer+=content[position++];
  }
  flush();return result;
 }
 const api={validDocument,parseBlocks};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DocTools=api;
})(typeof globalThis!=='undefined'?globalThis:this);
