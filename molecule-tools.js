(()=>{
 function traces(model,showH=true){
  const colors={H:'#e6e8ed',C:'#4c5363',N:'#3769e8',O:'#e94848',S:'#e6c729',P:'#ed923c',F:'#62ba68',Cl:'#46b65c',Br:'#a24737',I:'#8557b8',Na:'#9e6ed3',Ca:'#649f66'},radii={H:.22,C:.36,N:.34,O:.33,S:.43,P:.43};
  const traces=[],visible=i=>showH||model.atoms[i].element!=='H';
  for(const [atomIndex,atom]of model.atoms.entries()){if(!showH&&atom.element==='H')continue;const x=[],y=[],z=[],i=[],j=[],k=[],radius=radii[atom.element]||.4,n=10,m=14;
   for(let u=0;u<=n;u++)for(let v=0;v<=m;v++){const a=Math.PI*u/n,b=2*Math.PI*v/m;x.push(atom.x+radius*Math.sin(a)*Math.cos(b));y.push(atom.y+radius*Math.sin(a)*Math.sin(b));z.push(atom.z+radius*Math.cos(a));}
   for(let u=0;u<n;u++)for(let v=0;v<m;v++){const a=u*(m+1)+v,b=a+m+1;i.push(a,a+1);j.push(b,b);k.push(a+1,b+1);}
   traces.push({type:'mesh3d',meta:{atom:atomIndex},x,y,z,i,j,k,color:colors[atom.element]||'#ba85af',flatshading:false,hoverinfo:'text',text:atom.element+(atom.charge?' (charge '+atom.charge+')':''),lighting:{ambient:.6,diffuse:.8,specular:.3},showscale:false});
  }
  const x=[],y=[],z=[];for(const bond of model.bonds){if(!visible(bond.a)||!visible(bond.b))continue;const a=model.atoms[bond.a],b=model.atoms[bond.b];
   const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy)||1;const offset={x:-dy/l*.085,y:dx/l*.085,z:0};const orders=Math.min(3,Math.max(1,bond.order));for(let q=0;q<orders;q++){const shift=q-(orders-1)/2;x.push(a.x+offset.x*shift,b.x+offset.x*shift,null);y.push(a.y+offset.y*shift,b.y+offset.y*shift,null);z.push(a.z+offset.z*shift,b.z+offset.z*shift,null);}}
  traces.unshift({type:'scatter3d',mode:'lines',x,y,z,line:{color:'#7b8496',width:9},hoverinfo:'skip'});return traces;
 }
window.MoleculeTools={traces};})();
