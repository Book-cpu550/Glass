const {test}=require('node:test'),assert=require('node:assert/strict'),katex=require('katex'),{latex}=require('../math-compat.js');
test('editor differential and literal tilde commands render without changing entered bounds',()=>{
 const source=String.raw`\bar{x}=\frac{1}{2A}\int_{\~}^{\~}(1-u^2)\differentialD u`,converted=latex(source);
 assert.equal(converted,String.raw`\bar{x}=\frac{1}{2A}\int_{\text{\char126}}^{\text{\char126}}(1-u^2)\mathrm{d} u`);katex.renderToString(converted,{throwOnError:true});assert.ok(!converted.includes('_0'));assert.equal(latex(String.raw`\\differentialD \differentialDextra`),String.raw`\\differentialD \differentialDextra`);
});

test('editor double primes render as two primes without changing source or adjacent commands',()=>{
 const source=String.raw`f^{\doubleprime}(x)=-2x\quad g^{\doubleprime}=-4`;
 const converted=latex(source);
 assert.equal(converted,String.raw`f^{{\prime\prime}}(x)=-2x\quad g^{{\prime\prime}}=-4`);
 katex.renderToString(converted,{throwOnError:true});
 katex.renderToString(latex(String.raw`\doubleprime x`),{throwOnError:true});
 assert.equal(latex(String.raw`\\doubleprime \doubleprimeextra`),String.raw`\\doubleprime \doubleprimeextra`);
 assert.ok(source.includes(String.raw`\doubleprime`));
});
