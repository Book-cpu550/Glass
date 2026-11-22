// Translate editor-specific notation at rendering and export boundaries. Stored LaTeX
// and the user's prose are left untouched.
const aliases={doubleprime:'{\\prime\\prime}',differentialD:'\\mathrm{d}',capitalDifferentialD:'\\mathrm{D}',imaginaryI:'\\mathrm{i}',imaginaryJ:'\\mathrm{j}',exponentialE:'\\mathrm{e}'};
function latex(source){
 let result='';
 for(let i=0;i<source.length;){
  if(source[i]!=='\\'){result+=source[i++];continue;}
  const match=/^\\([A-Za-z]+|[^A-Za-z])/.exec(source.slice(i));if(!match){result+=source[i++];continue;}
  const command=match[1];
  if(command==='placeholder'){
   let end=i+match[0].length;while(/\s/.test(source[end]||'')&&end<source.length)end++;
   if(source[end]==='['){const close=source.indexOf(']',end+1);if(close>=0)end=close+1;}
   if(source[end]==='{'){let depth=1,close=end+1;for(;close<source.length&&depth;close++){if(source[close]==='\\'){close++;continue;}if(source[close]==='{')depth++;if(source[close]==='}')depth--;}
    if(!depth){const contents=source.slice(end+1,close-1);result+=contents?'\\boxed{'+latex(contents)+'}':'\\square';i=close;continue;}}
  }
  result+=aliases[command]||(command==='~'?'\\text{\\char126}':match[0]);i+=match[0].length;
 }
 return result;
}
const api={latex};if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.MathCompat=api;
