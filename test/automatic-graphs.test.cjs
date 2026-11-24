const {test}=require('node:test'),assert=require('node:assert/strict'),g=require('../graph-tools.js'),katex=require('katex');
test('one graph tool detects all eight math graph types and re-detects after replacing input',()=>{
 for(const [equations,want] of [['y=sin(x)','cartesian'],['y=2x','cartesian'],['x=2','implicit2d'],['x^2+y^2=9','implicit2d'],['y^2=x','implicit2d'],['r=2*cos(3*theta)','polar'],['r=1+cos(θ)','polar'],['z=sin(x)*cos(y)','surface'],['z=-sqrt(9-x^2-y^2)','surface'],['y^2=x^2+z^2','implicit3d'],['y=2z','implicit3d'],['x=u,y=v-u,z=-v','parametric'],['F(x,y)=i+(1/2)j','vector'],['F(x,y,z)=-y i+x j+z k','vector3d']])for(const mode of ['cartesian','implicit3d','parametric'])assert.equal(g.detectMode({mode,equations}),want,equations);
 assert.equal(g.detectMode({mode:'physics',equations:'Physics simulation'}),'physics');
 const t=g.sample({mode:'auto',equations:'x^2+y^2=9',min:-5,max:5})[0];assert.equal(t.meta.dimension,2);
});
test('typeset graph previews render powers, fractions, radicals, vector fields and parametric coordinates',()=>{
 for(const equations of ['y=(x+1)/(x-1)','y=sqrt(x^2+1)','y^2=x^2+z^2','r=2*cos(3*theta)','F(x,y)=i+(1/2)j','x=u,y=v-u,z=-v']){const latex=g.formatEquations({equations});assert.ok(latex.length);for(const line of latex)assert.doesNotThrow(()=>katex.renderToString(line,{throwOnError:true,trust:false}));}
 assert.match(g.formatEquations({equations:'y=(x+1)/(x-1)'})[0],/\\frac/);assert.match(g.formatEquations({equations:'x=u,y=v-u,z=-v'})[0],/\\begin\{aligned\}/);
 const slider={a:{min:1,max:3,step:1,value:2}};assert.match(g.formatEquations({equations:'x=a*u,y=v,z=-v',parameters:slider})[0],/a/);
 for(const equations of ['x=','y=window.alert(1)','x=<script>','y=x=y','x=u,y=v'])assert.throws(()=>g.formatEquations({equations}));
});
