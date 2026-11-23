const {test}=require('node:test'),assert=require('node:assert/strict'),g=require('../graph-tools.js'),{validateDraft}=require('../drawing-data.cjs');
const config=(mode,equations,extra={})=>({mode,equations,min:-5,max:5,yMin:-5,yMax:5,zMin:-5,zMax:5,...extra});
const plot=(mode,eq,extra)=>g.sample(config(mode,eq,extra))[0];
function residual(trace,fn){for(let i=0;i<trace.x.length;i++)if(trace.x[i]!==null)assert.ok(Math.abs(fn(trace.x[i],trace.y[i],trace.z?.[i]))<1e-5,`residual at ${i}`);}
test('2D implicit circles, sideways parabolas and hyperbolas preserve both branches',()=>{
 for(const [eq,fn] of [['x^2+y^2=9',(x,y)=>x*x+y*y-9],['y^2=x',(x,y)=>y*y-x],['x*y=1',(x,y)=>x*y-1]]){const t=plot('implicit2d',eq);assert.equal(t.type,'scatter');assert.ok(t.y.some(y=>y>1)&&t.y.some(y=>y<-1));residual(t,fn);assert.ok(t.x.includes(null));}
 const vertical=plot('implicit2d','x=1.234');residual(vertical,x=>x-1.234);
 const fine=plot('implicit2d','x^2+y^2=9',{quality:'high'});assert.ok(fine.meta.samples>plot('implicit2d','x^2+y^2=9').meta.samples);
});
test('3D implicit cone includes negative and positive Y and Z, and sphere mesh vertices satisfy equation',()=>{
 const cone=plot('implicit3d','y^2=x^2+z^2');assert.equal(cone.type,'mesh3d');for(const a of [cone.y,cone.z])assert.ok(Math.min(...a)<-4&&Math.max(...a)>4);residual(cone,(x,y,z)=>y*y-x*x-z*z);
 for(const eq of ['x^2+y^2+z^2=9','9=x^2+y^2+z^2']){const s=plot('implicit3d',eq);assert.ok(s.i.length>5000);residual(s,(x,y,z)=>x*x+y*y+z*z-9);for(let i=0;i<s.i.length;i++)assert.equal(new Set([s.i[i],s.j[i],s.k[i]]).size,3);}
 const negative=plot('implicit3d','x^2+y^2+z^2=9',{zMin:-4,zMax:-1});assert.ok(negative.z.every(z=>z>=-4&&z<=-1));
 const cylinder=plot('implicit3d','x^2+y^2=4');residual(cylinder,(x,y)=>x*x+y*y-4);assert.ok(Math.min(...cylinder.z)<0);
});
test('implicit sampling rejects poles, invalid equations, empty sets and invalid bounds',()=>{
 for(const mode of ['implicit2d','implicit3d']){
  for(const eq of ['1/(x-0.123)=0','x^2+y^2+1=0','0=0','x=y=1','x=','alert(x)=0'])assert.throws(()=>plot(mode,eq),/Equation 1:/,eq);
  for(const extra of [{yMin:''},{yMax:-5},{yMax:Infinity}])assert.throws(()=>plot(mode,'x=y',extra),/Y range/);
 }
 assert.throws(()=>plot('implicit3d','x=y',{zMin:2,zMax:1}),/Z range/);
 assert.throws(()=>plot('implicit2d','x=z'),/Unknown name/);
 const multiple=g.sample(config('implicit2d','x=y\nx=-y'));assert.equal(multiple.length,2);
});
test('mode inference retains explicit branches and recognizes implicit equations',()=>{
 for(const [mode,eq,want] of [['cartesian','y^2=x^2+z^2','implicit3d'],['cartesian','x^2+y^2=9','implicit2d'],['cartesian','y=sin(x)','cartesian'],['cartesian','x=3','implicit2d'],['surface','z=sqrt(25-x^2-y^2)','surface'],['surface','z^2=25-x^2-y^2','implicit3d'],['polar','r=2','polar']])assert.equal(g.inferMode(config(mode,eq)),want);
 assert.equal(g.inferMode({...config('cartesian','x^2+y^2=a'),parameters:{a:{min:1,max:12,step:1,value:9}}}),'implicit2d');
});
test('saved drawing drafts retain all eight graph modes',()=>{
 const names=['cartesian','polar','surface','vector','vector3d','physics','implicit2d','implicit3d'];const graph=config('implicit3d','y^2=x^2+z^2');graph.modes=Object.fromEntries(names.map(mode=>[mode,config(mode,'x=y')]));assert.doesNotThrow(()=>validateDraft({base:'',strokes:[],workspace:{panel:'graph',graph,chemistry:{mode:'compound',input:'ethanol'}}}));
});
