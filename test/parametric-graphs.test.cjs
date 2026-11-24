const {test}=require('node:test'),assert=require('node:assert/strict'),g=require('../graph-tools.js'),{validateDraft}=require('../drawing-data.cjs');
const config=(equations,extra={})=>({mode:'parametric',equations,min:-2,max:2,yMin:-3,yMax:3,...extra});
test('parametric plane from the requested example preserves exact coordinates and parameter endpoints',()=>{
 const c=config('x = u, y = v-u, z = -v'),t=g.sample(c)[0];assert.equal(t.type,'surface');assert.equal(t.x.length,65);assert.deepEqual([t.x[0][0],t.y[0][0],t.z[0][0]],[-2,-1,3]);assert.deepEqual([t.x[64][64],t.y[64][64],t.z[64][64]],[2,1,-3]);for(let j=0;j<65;j++)for(let i=0;i<65;i++){assert.ok(Math.abs(t.x[j][i]+t.y[j][i]+t.z[j][i])<1e-12);assert.equal(t.z[j][i],-t.customdata[j][i][1]);}
 assert.equal(g.sample({...c,quality:'high'})[0].x.length,101);
});
test('parametric parser accepts multiline/semicolon coordinates, repeated surfaces and commas inside functions',()=>{
 for(const equations of ['x=u\ny=v-u\nz=-v','z=-v; x=u; y=v-u','x = atan2(v,u), y=max(u,v), z=min(u,v)'])assert.equal(g.sample(config(equations)).length,1);
 assert.equal(g.sample(config('x=u,y=v,z=u+v\nx=u,y=v,z=u-v')).length,2);
 const sphere=g.sample(config('x=cos(u)*sin(v),y=sin(u)*sin(v),z=cos(v)',{min:0,max:2*Math.PI,yMin:0,yMax:Math.PI}))[0];for(let j=0;j<65;j++)for(let i=0;i<65;i++)assert.ok(Math.abs(sphere.x[j][i]**2+sphere.y[j][i]**2+sphere.z[j][i]**2-1)<1e-12);
});
test('parametric graphs retain safe parsing, validate domains, and break undefined coordinates together',()=>{
 for(const equations of ['x=u,y=v','x=u,x=v,z=0','x=u,y=v,z=process.exit()','x=u,y=v,z=x','x=(u,y=v,z=0','x=u),y=v,z=0'])assert.throws(()=>g.sample(config(equations)),undefined,equations);
 assert.throws(()=>g.sample(config('x=u,y=v,z=0',{yMin:4,yMax:2})),/V range/);assert.throws(()=>g.sample(config('x=u,y=v,z=0',{parameters:{u:{min:0,max:2,step:1,value:1}}})),/surface coordinates/);
 const holes=g.sample(config('x=u,y=v,z=sqrt(u)'))[0];assert.equal(holes.x[0][0],null);assert.equal(holes.y[0][0],null);assert.equal(holes.z[0][0],null);assert.ok(holes.x[0].some(x=>x!==null));assert.throws(()=>g.sample(config('x=u,y=v,z=sqrt(-1)')),/no real coordinates/);
 const slider=g.sample(config('x=a*u,y=v,z=-v',{parameters:{a:{min:1,max:3,step:1,value:2}}}))[0];assert.equal(slider.x[0][0],-4);
});
test('parametric input is detected from explicit and implicit graph modes without changing ordinary graphs',()=>{
 for(const mode of ['cartesian','surface','implicit2d','implicit3d'])assert.equal(g.inferMode({...config('x=u, y=v-u, z=-v'),mode}),'parametric');
 assert.equal(g.inferMode({...config('x=1\ny=2\nz=3'),mode:'implicit3d'}),'implicit3d');assert.equal(g.inferMode({...config('x^2+y^2=9'),mode:'implicit2d'}),'implicit2d');
});
test('all 3D surfaces use multicolor shading, with signed height intensity and flat-plane fallback',()=>{
 for(const c of [config('x=u,y=v-u,z=-v'),{...config('z=x+y'),mode:'surface'},{...config('x^2+y^2+z^2=4'),mode:'implicit3d'}]){const t=g.sample(c)[0];assert.ok(t.colorscale.length>=5);assert.ok(new Set(t.colorscale.map(s=>s[1])).size>=5);if(t.type==='mesh3d'){assert.equal(t.color,undefined);assert.ok(Math.min(...t.intensity)<0&&Math.max(...t.intensity)>0);}}
 const flat=g.sample({...config('z=0'),mode:'implicit3d'})[0];assert.ok(Math.max(...flat.intensity)>Math.min(...flat.intensity));
});
test('drawing drafts preserve all nine graph modes including parametric U/V bounds',()=>{
 const names=['cartesian','polar','surface','vector','vector3d','physics','implicit2d','implicit3d','parametric'],graph=config('x=u,y=v-u,z=-v');graph.modes=Object.fromEntries(names.map(mode=>[mode,{...graph,mode}]));assert.doesNotThrow(()=>validateDraft({base:'',strokes:[],workspace:{panel:'graph',graph,chemistry:{mode:'compound',input:'ethanol'}}}));
});
