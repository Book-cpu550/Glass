const {test}=require('node:test'),assert=require('node:assert/strict'),{parse,catalog}=require('../chem-input.cjs'),{build,conformer}=require('../chem-worker.cjs');
test('equations preserve coefficients, ions and reaction SMILES',async()=>{
 assert.equal((await build({input:'2H2 + O2 -> 2H2O',mode:'equation'})).balanced,true);
 assert.equal((await build({input:'H2 + O2 -> H2O',mode:'equation'})).balanced,false);
 assert.equal((await build({input:'H+ + OH- -> H2O',mode:'equation'})).balanced,true);
 assert.equal(parse('CCO>>CC=O','reaction-smiles').species.length,2);
 assert.throws(()=>parse('H2 + -> O2','equation'));assert.throws(()=>parse('1/0 H2 -> H2','equation'));
 const r=await build({input:'C2H6O',mode:'compound'});assert.equal(r.status,'choose');assert.equal(r.species[0].options.length,2);
 const chosen=await build({input:'C2H6O',mode:'compound',choices:{0:r.species[0].options[1].id}});assert.equal(chosen.species[0].title,'dimethyl ether');
});
test('bundled structures validate and generated conformers have finite bonded coordinates',async()=>{
 for(const entry of catalog){const r=await build({input:entry.title,mode:'compound'});assert.equal(r.status,'ready',entry.title);assert.ok(r.species[0].svg.includes('<svg'));}
 const m=await conformer({smiles:'CCO'});assert.equal(m.formula,'C2H6O');assert.equal(m.atoms.length,9);assert.equal(m.bonds.length,8);assert.ok(m.atoms.every(a=>[a.x,a.y,a.z].every(Number.isFinite)));
 await assert.rejects(build({input:'not a real compound',mode:'compound'}),/No local structure/);
 for(const input of ['constructor','toString','__proto__'])await assert.rejects(build({input,mode:'compound'}),/No local structure/);
});
