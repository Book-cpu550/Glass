const {test}=require('node:test'),assert=require('node:assert/strict'),g=require('../graph-tools.js');
test('LaTeX graphs evaluate fractions, powers, roots, trig, grouping, constants and absolute values accurately',()=>{
 for(const [source,x,want] of [[String.raw`y=\frac{x^{2}}{3}`,3,3],[String.raw`y=\frac{\sqrt{x^{2}+1}}{x+2}`,2,Math.sqrt(5)/4],[String.raw`y=\sin^{2}\left(x\right)`,Math.PI/2,1],[String.raw`y=\cos x`,0,1],[String.raw`y=\left|x\right|`,-3,3],[String.raw`y=\sqrt[3]{x}`,-8,-2],[String.raw`y=\ln\left(e\right)+\frac12`,0,1.5],[String.raw`y=\operatorname{max}(0,x)`,-2,0],[String.raw`$$y=\dfrac{x+1}{2}$$`,3,2]])assert.ok(Math.abs(g.compile(source,['x'])({x})-want)<1e-10,source);
});
test('LaTeX follows automatic graph detection, supports parametric aligned input and retains safe slider substitution',()=>{
 const source=String.raw`\begin{aligned}x&=u\\ y&=v-u\\ z&=-v\end{aligned}`;assert.equal(g.detectMode({equations:source}),'parametric');const t=g.sample({mode:'auto',equations:source,min:-2,max:2,yMin:-3,yMax:3})[0];assert.deepEqual([t.x[0][0],t.y[0][0],t.z[0][0]],[-2,-1,3]);
 for(const [equations,mode,type] of [[String.raw`x^{2}+y^{2}=9`,'implicit2d','scatter'],[String.raw`y^{2}=x^{2}+z^{2}`,'implicit3d','mesh3d'],[String.raw`z=\sin(x)\cos(y)`,'surface','surface'],[String.raw`r=2\cos(3\theta)`,'polar','scatter'],[String.raw`F(x,y)=\mathbf{i}+\frac{1}{2}\mathbf{j}`,'vector','scatter']]){assert.equal(g.detectMode({equations}),mode);assert.equal(g.sample({mode:'auto',equations,min:-5,max:5})[0].type,type);}
 const slider=g.sample({mode:'auto',equations:String.raw`y=\frac{a x^{2}}{2}`,parameters:{a:{min:1,max:3,step:1,value:2}},min:-2,max:2})[0];assert.equal(slider.y[0],4);
});
test('LaTeX conversion rejects unsupported commands, incomplete groups and executable input instead of dropping content',()=>{
 for(const source of [String.raw`y=\unknown{x}`,String.raw`y=\frac{1}{`,String.raw`y=\sqrt{x`,String.raw`y=\href{evil}{x}`,String.raw`y=\text{process.exit()}`,String.raw`y=\sin 2x`,String.raw`y=|x`,String.raw`y=\sqrt[3{x}`,String.raw`y=\frac{process.exit()}{x}`])assert.throws(()=>g.sample({mode:'auto',equations:source,min:-2,max:2}),undefined,source);
 assert.throws(()=>g.normalize('{'.repeat(40)+'x'+'}'.repeat(40)),/nested/);
});
