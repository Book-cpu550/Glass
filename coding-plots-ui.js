(()=>{
 const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 function mount(host,payload){
  let dead=false,plot=null,opening=false,showing=false,dragMode='orbit';
  const image=make('img');image.src=payload.png;image.alt='Original MATLAB plot';image.className='coding-plot';
  const scene=GlassMatlabPlots.validate(payload.scene);if(!scene){host.append(image);return ()=>{};}
  host.className='coding-interactive-figure';const controls=make('div');controls.className='coding-plot-controls';
  const status=make('span','Loading interactive 3D plot…');status.setAttribute('role','status');
  const stage=make('div');stage.className='coding-3d-stage';stage.tabIndex=0;stage.hidden=true;
  stage.setAttribute('aria-label','Interactive MATLAB 3D plot. Drag to rotate, scroll to zoom. Arrow keys rotate; plus and minus zoom; Home resets.');
  function message(){status.textContent=dragMode==='orbit'?'Drag to rotate · scroll to zoom':'Drag to pan · scroll to zoom';}
  function button(label,fn){const b=make('button',label);b.type='button';b.onclick=()=>Promise.resolve().then(fn).catch(error=>{if(!dead)status.textContent=error.message;});controls.append(b);return b;}
  const rotate=button('Rotate',()=>mode('orbit')),pan=button('Pan',()=>mode('pan'));
  const reset=button('Reset view',async()=>{if(!showing)await open();if(plot&&!dead)await Plotly.relayout(plot,{'scene.camera':GlassMatlabPlots.camera(scene)});});
  const toggle=button('Image view',()=>{if(!showing)return open();showing=false;stage.hidden=true;image.hidden=false;toggle.textContent='3D view';status.textContent='Original MATLAB image';});
  rotate.setAttribute('aria-pressed','true');pan.setAttribute('aria-pressed','false');controls.append(status);host.append(controls,stage,image);
  async function mode(value){if(!showing)await open();if(dead||!plot)return;dragMode=value;await Plotly.relayout(plot,{'scene.dragmode':value});rotate.setAttribute('aria-pressed',String(value==='orbit'));pan.setAttribute('aria-pressed',String(value==='pan'));message();}
  async function open(){
   if(dead||opening)return;opening=true;
   try{
    if(plot){showing=true;stage.hidden=false;image.hidden=true;toggle.textContent='Image view';message();await Plotly.Plots.resize(plot);return;}
    await MathdeskGraph.library();if(dead)return;
    const target=make('div');stage.append(target);plot=target;stage.hidden=false;
    const axes={};for(const [index,axis,key]of [[0,'xaxis','xlabel'],[1,'yaxis','ylabel'],[2,'zaxis','zlabel']])axes[axis]={title:{text:GlassMatlabPlots.safe(scene[key])},showgrid:scene.grid[index]};
    await Plotly.newPlot(target,GlassMatlabPlots.traces(scene),{height:400,margin:{l:0,r:0,t:35,b:0},paper_bgcolor:'#fff',title:{text:GlassMatlabPlots.safe(scene.title),font:{size:15}},showlegend:false,scene:{...axes,aspectmode:'data',dragmode:dragMode,camera:payload.camera||GlassMatlabPlots.camera(scene)}},{responsive:true,displayModeBar:false,displaylogo:false,scrollZoom:true});
    if(dead){Plotly.purge(target);return;}
    target.on('plotly_relayout',()=>{const camera=window.GlassGraphCamera.read(target);if(camera)payload.camera=camera;});
    showing=true;image.hidden=true;toggle.textContent='Image view';message();
   }catch(error){if(plot)window.Plotly?.purge(plot);plot=null;showing=false;stage.replaceChildren();stage.hidden=true;image.hidden=false;toggle.textContent='Retry 3D view';if(!dead)status.textContent='Interactive view unavailable. Original image shown.';}
   finally{opening=false;}
  }
  stage.addEventListener('keydown',event=>{
   if(!plot||!showing||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;
   event.preventDefault();const camera=window.GlassGraphCamera.read(plot)||GlassMatlabPlots.camera(scene);
   if(event.key==='Home'){reset.click();return;}
   if(['+','=','-'].includes(event.key)){const factor=event.key==='-'?1.2:1/1.2;for(const axis of ['x','y','z'])camera.eye[axis]*=factor;}
   else if(['ArrowLeft','ArrowRight'].includes(event.key)){const angle=(event.key==='ArrowLeft'?1:-1)*Math.PI/12,x=camera.eye.x,y=camera.eye.y;camera.eye.x=x*Math.cos(angle)-y*Math.sin(angle);camera.eye.y=x*Math.sin(angle)+y*Math.cos(angle);}
   else camera.eye.z+=event.key==='ArrowUp'?.2:-.2;
   Plotly.relayout(plot,{'scene.camera':camera}).catch(()=>{});
  });
  const resize=new ResizeObserver(()=>{if(plot?.data&&showing)Plotly.Plots.resize(plot).catch(()=>{});});resize.observe(host);open();
  return ()=>{dead=true;resize.disconnect();if(plot)window.Plotly?.purge(plot);plot=null;};
 }
 window.GlassCodingPlots={mount};
})();
