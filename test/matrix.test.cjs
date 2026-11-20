const {test}=require('node:test'),assert=require('node:assert/strict'),matrix=require('../matrix-tools.js');
test('matrix dimensions use row by column notation and reject unsafe or excessive sizes',()=>{
 for(const input of ['5x4',' 5 X 4 ','5×4']){const m=matrix(input);assert.equal(m.rows,5);assert.equal(m.columns,4);assert.equal((m.latex.match(/\\placeholder/g)||[]).length,20);}
 for(const input of ['0x3','3x0','21x2','5.5x4','5x4x3','3x-1','3x3junk','100x100'])assert.throws(()=>matrix(input));
});
