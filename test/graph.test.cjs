const {test}=require('node:test'),assert=require('node:assert/strict'),{compile,sample}=require('../graph-tools.js');
test('offline expression parser handles precedence, functions and implied products without evaluating code',()=>{
 for(const [text,expected]of [['-x^2',-4],['2x+3(x+1)',13],['2^3^2',512],['sin(pi/2)',1],['sqrt(4)+ln(e)',3]])assert.equal(compile(text,['x'])({x:2}),expected,text);
 for(const text of ['window.alert(1)','import(x)','x=3','foo(x)','x;process.exit()','2**3'])assert.throws(()=>compile(text,['x']));assert.equal(compile('sqrt(-1)',[])({}),null);
});
test('Cartesian, polar and surface samples have the expected coordinates',()=>{
 const line=sample({mode:'cartesian',equations:'y=x^2',min:-2,max:2})[0];assert.equal(line.y[0],4);
 const polar=sample({mode:'polar',equations:'r=2',min:0,max:Math.PI*2})[0];assert.equal(polar.x[0],2);assert.equal(polar.y[0],0);
 const surface=sample({mode:'surface',equations:'z=x^2+y^2',min:-2,max:2})[0];assert.equal(surface.z[0][0],8);assert.equal(surface.z[32][32],0);
 assert.throws(()=>sample({mode:'cartesian',equations:'y=x',min:2,max:1}));assert.throws(()=>sample({mode:'polar',equations:'y=x',min:0,max:1}));
});
