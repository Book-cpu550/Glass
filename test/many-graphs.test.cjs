const {test}=require('node:test'),assert=require('node:assert/strict'),g=require('../graph-tools.js'),{validateDraft}=require('../drawing-data.cjs');
test('graphing has no equation-count cap for 2D, 3D or parametric inputs',()=>{
 const equations=Array.from({length:40},(_,i)=>'y=x+'+i).join('\n'),traces=g.sample({mode:'auto',equations,min:-2,max:2});assert.equal(traces.length,40);assert.equal(traces[39].y[0],37);
 const surfaces=g.sample({mode:'auto',equations:Array.from({length:12},(_,i)=>'z=x+y+'+i).join('\n'),min:-1,max:1});assert.equal(surfaces.length,12);
 const parametric=g.sample({mode:'auto',equations:Array.from({length:12},(_,i)=>'r(u,v)=<u,v,'+i+'>').join('\n'),min:-1,max:1,yMin:-2,yMax:2});assert.equal(parametric.length,12);assert.equal(parametric[11].z[0][0],11);
 const draft={base:'',strokes:[],workspace:{panel:'graph',graph:{mode:'cartesian',equations:Array(4000).fill('y=x').join('\n')},chemistry:{mode:'compound',input:''}}};assert.doesNotThrow(()=>validateDraft(draft));
});
