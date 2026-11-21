(()=>{
 const by=id=>document.getElementById(id),canvas=by('drawing-canvas'),ctx=canvas.getContext('2d');
 const ink=document.createElement('canvas');ink.width=canvas.width;ink.height=canvas.height;const brush=ink.getContext('2d');
 let baseRequest=0,strokes=[],redo=[],stroke=null,base='',baseImage=null,graph=null,session=null,generation=0,draftTimer=null,draftQueue=Promise.resolve(),saving=false,dirty=false;
 function paint(){
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);if(baseImage){const scale=Math.min(canvas.width/baseImage.naturalWidth,canvas.height/baseImage.naturalHeight),width=baseImage.naturalWidth*scale,height=baseImage.naturalHeight*scale;ctx.drawImage(baseImage,(canvas.width-width)/2,(canvas.height-height)/2,width,height);}
  brush.clearRect(0,0,ink.width,ink.height);brush.lineCap='round';brush.lineJoin='round';
  for(const s of [...strokes,...(stroke?[stroke]:[])]){if(s.clear){brush.clearRect(0,0,ink.width,ink.height);continue;}brush.globalCompositeOperation=s.erase?'destination-out':'source-over';brush.strokeStyle=s.color;brush.fillStyle=s.color;brush.lineWidth=s.width;brush.beginPath();s.points.forEach((p,i)=>i?brush.lineTo(p.x,p.y):brush.moveTo(p.x,p.y));brush.stroke();if(s.points.length===1){const p=s.points[0];brush.beginPath();brush.arc(p.x,p.y,s.width/2,0,Math.PI*2);brush.fill();}}
  brush.globalCompositeOperation='source-over';ctx.drawImage(ink,0,0);by('drawing-undo').disabled=!strokes.length;by('drawing-redo').disabled=!redo.length;
 }
 function persist(){
  clearTimeout(draftTimer);if(!session||!dirty)return draftQueue;
  const workspace={panel:!by('bio-diagram-panel').hidden?'biology':!by('graph-panel').hidden?'graph':!by('chem-panel').hidden?'chemistry':'pen',graph:window.MathdeskGraph.draftState(),chemistry:window.GlassChemistry.draftState(),biology:window.GlassBiologyGraphics.draftState(),biologyHistory:window.GlassBiologyGraphics.draftHistory(),biologyTools:window.GlassBiologyGraphics.draftTools(),biologyView:window.GlassBiologyGraphics.draftView()};
  const payload={id:session.noteId,key:session.key,data:{strokes:structuredClone([...strokes,...(stroke?[stroke]:[])]),base,graph:structuredClone(graph),workspace:structuredClone(workspace)}};
  const owner=session;draftQueue=draftQueue.catch(()=>{}).then(()=>desk.saveDrawingDraft(payload)).then(result=>{if(session===owner)owner.draftSaved=true;return result;});return draftQueue;
 }
 function changed(){if(!session||saving)return;dirty=true;clearTimeout(draftTimer);const owner=session;draftTimer=setTimeout(()=>persist().catch(e=>{if(session===owner)by('drawing-error').textContent='Draft could not be saved: '+e.message;}),500);}
 function point(e){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height))};}
 function finish(e){if(!stroke)return;strokes.push(stroke);stroke=null;redo=[];if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);paint();changed();}
 canvas.onpointerdown=e=>{if(e.button!==0||saving||!session)return;e.preventDefault();dirty=true;canvas.setPointerCapture(e.pointerId);stroke={erase:by('drawing-tool').value==='eraser',color:by('drawing-color').value,width:Number(by('drawing-width').value)*(by('drawing-tool').value==='eraser'?4:1),points:[point(e)]};paint();};
 canvas.onpointermove=e=>{if(!stroke)return;stroke.points.push(point(e));paint();};canvas.onpointerup=finish;canvas.onpointercancel=finish;
 async function setBase(png,token=generation,accept=()=>true){const request=++baseRequest,img=png?new Image():null;if(img){img.src=png;await img.decode();}if(token!==generation||request!==baseRequest||!accept())return false;base=png||'';baseImage=img;paint();return true;}
 async function open(detail){
  if(reading){toast('Switch to Edit document to add or edit drawings.');return;}
  const token=++generation,noteId=current,handle=doc();
  const key=detail?[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(detail.attrs))))].map(b=>b.toString(16).padStart(2,'0')).join(''):'new';
  if(token!==generation||noteId!==current)return;
  const record=await desk.loadDrawingDraft({id:noteId,key});if(token!==generation||noteId!==current)return;const draft=record?.warning?null:record;
  session?.anchor.dispose();session={noteId,key,handle,anchor:handle.drawingSession(detail),done:false,draftSaved:!!draft,closing:false,presentation:detail?{width:detail.attrs.width,align:detail.attrs.align,caption:detail.attrs.caption}:{}};
  strokes=structuredClone(draft?.strokes||detail?.attrs.strokes||[]);redo=[];stroke=null;dirty=!!draft;saving=false;
  by('drawing-copy').dataset.available=detail?'true':'false';by('drawing-copy').hidden=!detail;by('drawing-save').disabled=false;by('drawing-save').textContent=detail?'Update drawing':'Insert drawing';by('drawing-error').textContent=record?.warning||record?.recoveryWarning||(draft?'Resumed your locally saved drawing draft.':'');
  by('drawing-dialog').showModal();by('graph-panel').hidden=true;by('freehand-panel').hidden=false;by('drawing-save').hidden=false;
  graph=draft?.graph||detail?.attrs.graph||null;by('chem-panel').hidden=true;by('bio-diagram-panel').hidden=true;window.MathdeskGraph.reset(draft?.workspace?.graph||(['chemistry','biology'].includes(graph?.kind)?null:graph));window.GlassChemistry.reset(draft?.workspace?.chemistry||(graph?.kind==='chemistry'?graph:null));window.GlassBiologyGraphics.reset(draft?.workspace?.biology||(graph?.kind==='biology'?graph:null),draft?.workspace?.biologyHistory,draft?.workspace?.biologyTools,draft?.workspace?.biologyView);await setBase(draft?.base??detail?.attrs.base??'',token);if(token===generation&&(draft?.workspace?.panel==='graph'||!draft?.workspace&&graph&&!['chemistry','biology'].includes(graph.kind)))by(window.MathdeskGraph.draftState().mode==='physics'?'drawing-physics-tab':'drawing-graph-tab').click();else if(token===generation&&(draft?.workspace?.panel==='chemistry'||!draft?.workspace&&graph?.kind==='chemistry'))by('drawing-chem-tab').click();else if(token===generation&&(draft?.workspace?.panel==='biology'||!draft?.workspace&&graph?.kind==='biology'))by('drawing-bio-tab').click();
 }
 by('drawing-open').onclick=safely(()=>open());window.addEventListener('mathdesk-edit-drawing',safely(e=>open(e.detail)));
 by('drawing-dialog').addEventListener('input',changed);by('drawing-dialog').addEventListener('change',changed);document.querySelector('.drawing-tabs').addEventListener('click',changed);window.addEventListener('glass-workspace-change',changed);
 async function useImage(detail){if(!session||!by('drawing-dialog').open)return false;const token=generation,origin=detail.config?.kind==='biology'?'bio-diagram-panel':detail.config?.kind==='chemistry'?'chem-panel':'graph-panel';if(await setBase(detail.png,token,()=>!by(origin).hidden)){graph=detail.config;changed();by('drawing-pen-tab').click();return true;}return false;}
 window.addEventListener('mathdesk-graph-image',safely(e=>useImage(e.detail)));
 const close=safely(async()=>{if(saving)return;await persist();if(session)session.closing=true;by('drawing-dialog').close();});by('drawing-close').onclick=close;
 by('drawing-dialog').addEventListener('cancel',e=>{e.preventDefault();if(!saving)close();});
 by('drawing-dialog').addEventListener('close',()=>{if(session&&!session.done&&!session.closing)persist().catch(e=>toast('Drawing draft could not be saved: '+e.message,true));session?.anchor.dispose();session=null;++generation;window.MathdeskGraph.cancel();window.GlassChemistry.cancel();window.GlassBiologyGraphics.cancel();});
 by('drawing-undo').onclick=()=>{if(strokes.length)redo.push(strokes.pop());paint();changed();};by('drawing-redo').onclick=()=>{if(redo.length)strokes.push(redo.pop());paint();changed();};
 by('drawing-clear').onclick=()=>{if(strokes.length){redo=[];strokes.push({clear:true});paint();changed();}};
 by('drawing-discard').onclick=safely(async()=>{if(!session||saving)return;clearTimeout(draftTimer);await draftQueue.catch(()=>{});await desk.deleteDrawingDraft({id:session.noteId,key:session.key});dirty=false;session.done=true;by('drawing-dialog').close();});
 by('drawing-copy').onclick=safely(async()=>{if(!session||saving)return;session.anchor.dispose();session.anchor=session.handle.drawingSession();by('drawing-save').click();});
 by('drawing-save').onclick=safely(async()=>{
  if(saving||!session)return;const currentSession=session;saving=true;by('drawing-save').disabled=true;
  try{
   if(current!==currentSession.noteId||doc()!==currentSession.handle)throw Error('The document changed. Your draft is kept; reopen the drawing in the current note.');
   if(!strokes.length&&!base)throw Error('Draw something or add a graph before inserting.');
   // Keep a recoverable copy before touching the document, even if saving fails.
   dirty=true;await persist();
   const attrs={...currentSession.presentation,png:canvas.toDataURL('image/png'),strokes:structuredClone(strokes),base,graph:structuredClone(graph)};
   currentSession.anchor.commit(attrs);await flush();
   await desk.deleteDrawingDraft({id:currentSession.noteId,key:currentSession.key});dirty=false;currentSession.done=true;by('drawing-dialog').close();doc().editor.view.focus();toast('Drawing saved locally with your note.');
  }catch(e){by('drawing-error').textContent=e.message+(!strokes.length&&!base?'':currentSession.draftSaved?' Your drawing is kept in this window and in local drafts.':' Your drawing remains in this window; its local draft could not be saved.');}
  finally{saving=false;by('drawing-save').disabled=false;}
 });
 function syncTabs(){for(const [id,panel]of [['drawing-pen-tab','freehand-panel'],['drawing-graph-tab','graph-panel'],['drawing-physics-tab','graph-panel'],['drawing-chem-tab','chem-panel'],['drawing-bio-tab','bio-diagram-panel']])by(id).setAttribute('aria-pressed',String(!by(panel).hidden&&(panel!=='graph-panel'||(id==='drawing-physics-tab')===(by('graph-mode').value==='physics'))));}
 document.querySelector('.drawing-tabs').addEventListener('click',syncTabs);window.addEventListener('glass-workspace-change',syncTabs);syncTabs();
 window.MathdeskDrawing={flushDraft:persist,open:()=>open(),useImage,save:()=>by('drawing-save').onclick()};
})();
