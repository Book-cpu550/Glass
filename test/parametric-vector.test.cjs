const {test}=require('node:test'),assert=require('node:assert/strict'),g=require('../graph-tools.js');
test('parametric surfaces accept note-style vector tuples and i j k coordinate notation',()=>{
 for(const equations of [String.raw`\mathbf{r}(u,v)=\langle u,v-u,-v\rangle`,String.raw`\vec{r}(u,v)=u\hat{\imath}+(v-u)\hat{\jmath}-v\mathbf{k}`,'r(u,v)=u i+(v-u)j-v k','r(u,v)=<u,v-u,-v>','<u,v-u,-v>']){assert.equal(g.detectMode({equations}),'parametric');const t=g.sample({mode:'auto',equations,min:-2,max:2,yMin:-3,yMax:3})[0];assert.deepEqual([t.x[0][0],t.y[0][0],t.z[0][0]],[-2,-1,3]);assert.match(g.formatEquations({equations})[0],/langle/);}
 const sphere=g.sample({mode:'auto',equations:String.raw`r(u,v)=\langle \cos(u)\sin(v),\sin(u)\sin(v),\cos(v)\rangle`,min:0,max:2*Math.PI,yMin:0,yMax:Math.PI})[0];assert.ok(Math.abs(sphere.z[0][0]-1)<1e-12);
 for(const equations of ['r(u,v)=<u,v>','r(u,v)=<u,v,-v>=u i+v j-v k','r(u,v)=x(u,v)i+y(u,v)j+z(u,v)k'])assert.throws(()=>g.sample({mode:'auto',equations,min:-2,max:2}));
 assert.equal(g.detectMode({equations:'r=2*cos(3*theta)'}),'polar');
});
