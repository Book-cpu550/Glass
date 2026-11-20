(function(root){
 'use strict';
 const functions={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,ln:Math.log,log:Math.log10,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,floor:Math.floor,ceil:Math.ceil,cbrt:Math.cbrt,sign:Math.sign,log2:Math.log2,log10:Math.log10,sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x),min:Math.min,max:Math.max,pow:Math.pow,atan2:Math.atan2};
 function compile(source,variables){
  if(typeof source!=='string'||source.length>500)throw Error('Keep each equation under 500 characters.');
  source=source.trim().replace(/π/g,'pi').replace(/θ/g,'theta').replace(/[−–]/g,'-').replace(/×/g,'*').replace(/÷/g,'/');
  if(source.includes('=')){const parts=source.split('=');if(parts.length!==2||!['y','r','z'].includes(parts[0].trim()))throw Error('Use y = f(x), r = f(theta), or z = f(x,y).');const expected=variables.includes('y')?'z':variables.includes('theta')?'r':'y';if(parts[0].trim()!==expected)throw Error('Use '+expected+' = … in this graph mode.');source=parts[1];}
  const tokens=[];let i=0;while(i<source.length){const s=source.slice(i);if(/^\s/.test(s)){i++;continue;}const n=/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(s),name=/^[a-zA-Z][a-zA-Z0-9]*/.exec(s);if(n){tokens.push({type:'number',value:Number(n[0])});i+=n[0].length;}else if(name){tokens.push({type:'name',value:name[0].toLowerCase()});i+=name[0].length;}else if('+-*/^(),'.includes(s[0])){tokens.push({type:s[0]});i++;}else throw Error('Unsupported character. Use plain equations, e.g. sin(x) or x^2.');if(tokens.length>200)throw Error('This expression is too complex.');}
  if(!tokens.length)throw Error('Enter an equation.');let pos=0;
  const take=type=>tokens[pos]?.type===type?(pos++,true):false;
  function primary(){const t=tokens[pos++];if(!t)throw Error('Complete the equation.');if(t.type==='number')return ()=>t.value;if(t.type==='('){const v=sum();if(!take(')'))throw Error('Close every parenthesis.');return v;}if(t.type==='name'){
    if(Object.hasOwn(functions,t.value)){if(!take('('))throw Error('Use parentheses after '+t.value+'.');const args=[sum()];while(take(',')){if(args.length>=2)throw Error('Use at most two function arguments.');args.push(sum());}if(!take(')'))throw Error('Close every parenthesis.');const count=['min','max','pow','atan2'].includes(t.value)?2:1;if(args.length!==count)throw Error(t.value+' needs '+count+' argument'+(count>1?'s':'')+'.');return scope=>functions[t.value](...args.map(arg=>arg(scope)));}
    if(t.value==='pi')return ()=>Math.PI;if(t.value==='e')return ()=>Math.E;if(variables.includes(t.value))return scope=>scope[t.value];throw Error('Unknown name “'+t.value+'”. Allowed variables: '+variables.join(', ')+'.');
   }throw Error('Expected a number, variable, or function.');}
  function power(){const a=primary();if(take('^')){const b=unary();return s=>Math.pow(a(s),b(s));}return a;}
  function unary(){if(take('+'))return unary();if(take('-')){const a=unary();return s=>-a(s);}return power();}
  function product(){let a=unary();while(pos<tokens.length){const op=tokens[pos].type;if(op==='*'||op==='/'){pos++;const b=unary(),prior=a;a=op==='*'?s=>prior(s)*b(s):s=>prior(s)/b(s);}else if(['number','name','('].includes(op)){const b=unary(),prior=a;a=s=>prior(s)*b(s);}else break;}return a;}
  function sum(){let a=product();while(tokens[pos]?.type==='+'||tokens[pos]?.type==='-'){const op=tokens[pos++].type,b=product(),prior=a;a=op==='+'?s=>prior(s)+b(s):s=>prior(s)-b(s);}return a;}
  const evaluate=sum();if(pos!==tokens.length)throw Error('Check the operators and parentheses.');return scope=>{const value=evaluate(scope);return Number.isFinite(value)&&Math.abs(value)<1e10?value:null;};
 }
 function sample({mode,equations,min,max,yMin,yMax,quality}){
  if(typeof equations!=='string'||equations.length>10000)throw Error('Enter up to eight equations.');if(min===null||max===null||min===undefined||max===undefined||String(min).trim()===''||String(max).trim()==='')throw Error('Enter both range endpoints.');min=Number(min);max=Number(max);if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max||max-min>100000)throw Error('Enter a finite increasing range (width at most 100000).');
  yMin=yMin===undefined?min:yMin;yMax=yMax===undefined?max:yMax;if(mode==='surface'&&(yMin===null||yMax===null||String(yMin).trim()===''||String(yMax).trim()===''||![Number(yMin),Number(yMax)].every(Number.isFinite)||Number(yMin)>=Number(yMax)||Number(yMax)-Number(yMin)>100000))throw Error('Enter a finite increasing Y range (width at most 100000).');yMin=Number(yMin);yMax=Number(yMax);
  const expressions=equations.split('\n').map(s=>s.trim()).filter(Boolean);if(!expressions.length||expressions.length>8)throw Error('Enter one to eight equations, one per line.');if(!['cartesian','polar','surface'].includes(mode))throw Error('Choose a graph mode.');
  return expressions.map((expression,index)=>{try{const f=compile(expression,mode==='surface'?['x','y']:mode==='polar'?['theta','t']:['x']);
   if(mode==='surface'){const n=quality==='high'?101:65,axis=Array.from({length:n},(_,i)=>min+(max-min)*i/(n-1)),yAxis=Array.from({length:n},(_,i)=>yMin+(yMax-yMin)*i/(n-1)),z=yAxis.map(y=>axis.map(x=>f({x,y})));if(!z.some(row=>row.some(v=>v!==null)))throw Error('No real values in this range.');return {type:'surface',x:axis,y:yAxis,z,name:expression,showscale:false,opacity:expressions.length>1?.8:1};}
   const n=quality==='high'?2401:1201,x=[],y=[];for(let i=0;i<n;i++){const t=min+(max-min)*i/(n-1),v=f({x:t,theta:t,t});x.push(mode==='polar'&&v!==null?v*Math.cos(t):t);y.push(mode==='polar'&&v!==null?v*Math.sin(t):v);}if(!y.some(v=>v!==null))throw Error('No real values in this range.');
   // Split steep jumps to avoid drawing across common asymptotes.
   if(mode==='cartesian')for(let i=y.length-1;i>0;i--)if(y[i]!==null&&y[i-1]!==null&&Math.abs(y[i]-y[i-1])>Math.max(30,(max-min)*8)){const midpoint=f({x:(x[i]+x[i-1])/2});if(midpoint===null||Math.abs(midpoint-(y[i]+y[i-1])/2)>Math.max(1,Math.abs(y[i]-y[i-1])*.6))y[i]=null;}
   return {type:'scatter',mode:'lines',x,y,name:expression,connectgaps:false,line:{width:3}};
  }catch(error){throw Error('Equation '+(index+1)+': '+error.message);}});
 }
 const api={compile,sample};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GraphTools=api;
})(typeof globalThis!=='undefined'?globalThis:this);
