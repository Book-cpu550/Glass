(function(root){
 'use strict';
 function workerSource(code){
  return '('+function(){
   const send=self.postMessage.bind(self);
   function format(value){if(typeof value==='string')return value;if(typeof value==='bigint')return value+'n';if(typeof value==='symbol')return String(value);if(typeof value==='number'&&(!Number.isFinite(value)||Object.is(value,-0)))return Object.is(value,-0)?'-0':String(value);if(value instanceof Error)return value.name+': '+value.message;if(typeof value==='undefined')return 'undefined';if(typeof value==='function')return String(value);try{const seen=new WeakSet();return JSON.stringify(value,(_key,v)=>{if(typeof v==='bigint')return v+'n';if(v&&typeof v==='object'){if(seen.has(v))return '[Circular]';seen.add(v);}return v;},2)??String(value);}catch{return String(value);}}
   for(const level of ['log','info','warn','error','debug'])console[level]=(...args)=>send({type:'output',level,text:args.map(format).join(' ').slice(0,8000)});
   self.addEventListener('unhandledrejection',event=>{event.preventDefault();self.__glassFailure(event.reason);});
   const schedule=self.setTimeout.bind(self);self.__glassComplete=value=>schedule(()=>send({type:'complete',text:value===undefined?'':format(value)}),50);
   self.__glassFailure=error=>{const match=String(error?.stack||'').match(/blob:[^\s)]+?:(\d+):(\d+)/),line=match?Number(match[1])-self.__glassCodeStart+1:0;send({type:'failure',text:format(error)+(line>0?'\nGlass code line '+line:'')});};
  }.toString()+')();\n(async()=>{\n'+code+'\n})().then(self.__glassComplete,self.__glassFailure);';
 }
 function createRunner({onOutput=()=>{},onState=()=>{},timeoutMs=5000}={}){
  let worker=null,timer=null,epoch=0,count=0;
  function finish(state){clearTimeout(timer);timer=null;worker?.terminate();worker=null;epoch++;onState(state);}
  function stop(){if(worker)finish('Stopped');}
  function run(code){
   stop();count=0;const source=workerSource(code),prefix=source.slice(0,source.indexOf('\n(async()=>{\n')+'\n(async()=>{\n'.length),firstLine=prefix.split('\n').length;const request=++epoch,url=URL.createObjectURL(new Blob([source+'\nself.__glassCodeStart='+firstLine+';'],{type:'text/javascript'}));
   try{worker=new Worker(url);}catch(error){onOutput('error',error.message);onState('Error');return;}finally{URL.revokeObjectURL(url);}
   onState('Running');timer=setTimeout(()=>{if(request!==epoch)return;onOutput('error','Execution stopped after '+timeoutMs/1000+' seconds.');finish('Timed out');},timeoutMs);
   worker.onmessage=event=>{if(request!==epoch)return;const message=event.data;if(!message||typeof message.type!=='string')return;
    if(message.type==='output'){if(++count>200){onOutput('warn','Output limit reached (200 lines).');finish('Output limit reached');return;}onOutput(['log','info','warn','error','debug'].includes(message.level)?message.level:'log',String(message.text||'').slice(0,8000));}
    else if(message.type==='complete'){if(message.text)onOutput('result',String(message.text).slice(0,8000));finish('Completed');}
    else if(message.type==='failure'){onOutput('error',String(message.text||'Execution failed').slice(0,8000));finish('Error');}
   };
   worker.onerror=event=>{if(request!==epoch)return;event.preventDefault();onOutput('error',(event.message||'JavaScript syntax or execution error.')+(event.lineno>=firstLine?'\nGlass code line '+(event.lineno-firstLine+1):''));finish('Error');};
  }
  return {run,stop,destroy:()=>{clearTimeout(timer);worker?.terminate();worker=null;epoch++;}};
 }
 function indentEdit(text,from,to,unindent=false){
  if(from===to&&!unindent)return {from,to,text:'  ',selectionFrom:from+2,selectionTo:from+2};
  const start=from?text.lastIndexOf('\n',from-1)+1:0,lastLine=to>from&&text[to-1]==='\n'?to-1:to,next=text.indexOf('\n',lastLine),end=next<0?text.length:next,original=text.slice(start,end),lines=original.split('\n'),changed=lines.map(line=>unindent?line.replace(/^ {1,2}|^\t/,''):'  '+line),replacement=changed.join('\n');
  const caret=start+Math.max(0,from-start-(lines[0].length-changed[0].length));return {from:start,to:end,text:replacement,selectionFrom:from===to?caret:start,selectionTo:from===to?caret:start+replacement.length};
 }
 const api={createRunner,workerSource,indentEdit};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GlassJavaScript=api;
})(typeof globalThis!=='undefined'?globalThis:this);
