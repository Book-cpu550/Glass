(function(root){
 'use strict';
 function validate(scene){
  try{
   if(!scene||scene.version!==1||!Array.isArray(scene.traces)||!scene.traces.length||scene.traces.length>50)return null;
   let count=0;const numeric=v=>v===null||typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e100;
   const vector=v=>Array.isArray(v)&&v.length>0&&v.every(numeric);
   const traces=scene.traces.map(t=>{
    if(!t||!['surface','line','scatter'].includes(t.kind))throw Error();const out={kind:t.kind};
    if(t.kind==='surface'){
     if(!Array.isArray(t.z)||t.z.length<2||t.z.length>50000)throw Error();const cols=t.z[0]?.length;if(!Number.isInteger(cols)||cols<2)throw Error();
     for(const key of ['x','y','z']){if(!Array.isArray(t[key])||t[key].length!==t.z.length||!t[key].every(row=>vector(row)&&row.length===cols))throw Error();out[key]=t[key];}count+=t.z.length*cols;
    }else{
     const z=Array.isArray(t.z)?t.z:[t.z];for(const key of ['x','y','z']){const values=Array.isArray(t[key])?t[key]:[t[key]];if(!vector(values)||values.length!==z.length)throw Error();out[key]=values;}count+=z.length;
     out.line=t.kind==='line'&&t.line!==false;out.marker=t.kind==='scatter'||t.marker===true;
     out.color=Array.isArray(t.color)&&t.color.length===3&&t.color.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1)?t.color:[.15,.4,.7];
    }
    if(count>50000)throw Error();return out;
   });
   const result={version:1,traces};for(const key of ['title','xlabel','ylabel','zlabel'])result[key]=typeof scene[key]==='string'?scene[key].slice(0,300):'';
   result.view=Array.isArray(scene.view)&&scene.view.length===2&&scene.view.every(n=>typeof n==='number'&&Number.isFinite(n))?scene.view:[-37.5,30];
   result.grid=Array.isArray(scene.grid)&&scene.grid.length===3?scene.grid.map(v=>v===true):[true,true,true];
   result.colormap=Array.isArray(scene.colormap)&&scene.colormap.length>=2&&scene.colormap.length<=256&&scene.colormap.every(row=>Array.isArray(row)&&row.length===3&&row.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1))?scene.colormap:null;return result;
  }catch{return null;}
 }
 const rgb=c=>'rgb('+c.map(n=>Math.round(n*255)).join(',')+')';
 const safe=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 function traces(scene){return scene.traces.map(t=>t.kind==='surface'?{type:'surface',x:t.x,y:t.y,z:t.z,showscale:false,...(scene.colormap?{colorscale:scene.colormap.map((c,i)=>[i/(scene.colormap.length-1),rgb(c)])}:{})}:{type:'scatter3d',x:t.x,y:t.y,z:t.z,mode:[t.line?'lines':'',t.marker?'markers':''].filter(Boolean).join('+')||'lines',line:{color:rgb(t.color),width:3},marker:{color:rgb(t.color),size:4}});}
 function camera(scene){const az=scene.view[0]*Math.PI/180,el=scene.view[1]*Math.PI/180;return {eye:{x:3*Math.cos(el)*Math.sin(az),y:-3*Math.cos(el)*Math.cos(az),z:3*Math.sin(el)},up:{x:0,y:0,z:1},center:{x:0,y:0,z:0}};}
 const api={validate,traces,camera,safe};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GlassMatlabPlots=api;
})(typeof globalThis!=='undefined'?globalThis:this);
