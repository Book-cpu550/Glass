(function(root){
 'use strict';
 const functions={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,ln:Math.log,log:Math.log10,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,floor:Math.floor,ceil:Math.ceil,cbrt:Math.cbrt,sign:Math.sign,log2:Math.log2,log10:Math.log10,sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x),min:Math.min,max:Math.max,pow:Math.pow,atan2:Math.atan2};

 // Convert a bounded arithmetic subset of LaTeX to the existing safe expression grammar.
 // Unknown commands are rejected rather than silently removed or evaluated.
 function normalize(source){
  if(typeof source!=='string'||source.length>1000000)throw Error('Keep graph input under 1000000 characters.');
  source=source.trim();if(source.startsWith('$$')&&source.endsWith('$$'))source=source.slice(2,-2);else if(source.startsWith('$')&&source.endsWith('$'))source=source.slice(1,-1);
  source=source.replace(/\\\((.*?)\\\)/gs,'$1').replace(/\\\[([\s\S]*?)\\\]/g,'$1').replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|biggl|biggr|Biggl|Biggr|big|Big)\b/g,'');
  const env=/^\\begin\{(aligned|align\*?|gathered|gather\*?)\}([\s\S]*)\\end\{\1\}$/.exec(source);if(env)source=env[2].replace(/&/g,'');
  source=source.replace(/\\\\/g,'\n');let pos=0,depth=0;
  const aliases={arcsin:'asin',arccos:'acos',arctan:'atan',pi:'pi',theta:'theta',cdot:'*',times:'*',div:'/',quad:' ',qquad:' ',displaystyle:'',textstyle:'',lvert:'|',rvert:'|',vert:'|',langle:'<',rangle:'>',lt:'<',gt:'>',imath:'i',jmath:'j'};
  function skip(){while(/\s/.test(source[pos]||'')&&pos<source.length)pos++;}
  function argument(){skip();if(pos>=source.length)throw Error('Complete the LaTeX argument.');if(source[pos]==='{'){pos++;return parse('}');}if(source[pos]==='\\')return command();if('}])=,;\n'.includes(source[pos]))throw Error('Complete the LaTeX argument.');return source[pos++];}
  function command(){pos++;const match=/^[a-zA-Z]+|^[^a-zA-Z]/.exec(source.slice(pos));if(!match)throw Error('Complete the LaTeX command.');const name=match[0];pos+=name.length;
   if([',',';',':','!',' '].includes(name))return ' ';
   if(['frac','dfrac','tfrac'].includes(name)){const a=argument(),b=argument();return '(('+a+')/('+b+'))';}
   if(name==='sqrt'){skip();let degree=null;if(source[pos]==='['){pos++;const start=pos;while(pos<source.length&&source[pos]!==']')pos++;if(source[pos]!==']')throw Error('Close the root index.');degree=normalize(source.slice(start,pos++));}const body=argument();return degree===null?'sqrt('+body+')':degree.trim()==='3'?'cbrt('+body+')':'(('+body+')^(1/('+degree+')))';}
   if(['operatorname','mathrm','mathit','mathbf','boldsymbol','vec','hat'].includes(name)){const body=argument().trim();if(!/^[a-zA-Z]+$/.test(body))throw Error('Use only a function name or variable inside \\'+name+'.');return ' '+body+' ';}
   const fn=aliases[name]||name;
   if(Object.hasOwn(functions,fn)){
    skip();let power=null;if(source[pos]==='^'){pos++;power=argument();skip();}
    let body,bare=false;
    if(source[pos]==='('){pos++;body=parse(')');}
    else if(source[pos]==='{')body=argument();
    else if(source[pos]==='\\'){body=command();bare=true;}
    else if(/^[a-zA-Z]$/.test(source[pos]||'')){body=source[pos++];bare=true;}
    else{const number=/^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(pos));if(number){body=number[0];pos+=body.length;bare=true;}}
    if(body===undefined)throw Error('Put the argument of \\'+name+' in parentheses.');
    if(bare){while(/[ \t]/.test(source[pos]||'')&&pos<source.length)pos++;if(source[pos]==='^'){pos++;body+='^('+argument()+')';while(/[ \t]/.test(source[pos]||'')&&pos<source.length)pos++;}if(/[a-zA-Z0-9]/.test(source[pos]||''))throw Error('Put the argument of \\'+name+' in parentheses.');}
    return power===null?fn+'('+body+')':'('+fn+'('+body+'))^('+power+')';
   }
   if(Object.hasOwn(aliases,name))return ' '+aliases[name]+' ';
   throw Error('Unsupported graph LaTeX command: \\'+name+'.');
  }
  function parse(end){if(++depth>32)throw Error('This LaTeX expression is too deeply nested.');let text='';while(pos<source.length){const ch=source[pos];if(ch===end){pos++;depth--;return text;}if(ch==='}')throw Error('Check the LaTeX braces.');if(ch==='\\'){text+=command();continue;}if(ch==='{'){pos++;text+='('+parse('}')+')';continue;}if(ch==='('){pos++;text+='('+parse(')')+')';continue;}if(ch==='|'){pos++;text+='abs('+parse('|')+')';continue;}text+=source[pos++];}depth--;if(end)throw Error('Close the LaTeX '+(end==='}'?'braces.':'absolute value.'));return text;}
  return parse().replace(/\$([^$\n]+)\$/g,'$1');
 }

 function compile(source,variables){
  if(typeof source!=='string'||source.length>500)throw Error('Keep each equation under 500 characters.');
  source=normalize(source).trim().replace(/π/g,'pi').replace(/θ/g,'theta').replace(/[−–]/g,'-').replace(/×/g,'*').replace(/÷/g,'/');
  if(source.includes('=')){const parts=source.split('=');if(parts.length!==2||!['y','r','z'].includes(parts[0].trim()))throw Error('Use y = f(x), r = f(theta), or z = f(x,y).');const expected=variables.includes('y')?'z':variables.includes('theta')?'r':'y';if(parts[0].trim()!==expected)throw Error('Use '+expected+' = … in this graph mode.');source=parts[1];}
  const tokens=[];let i=0;while(i<source.length){const s=source.slice(i);if(/^\s/.test(s)){i++;continue;}const n=/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(s),name=/^[a-zA-Z][a-zA-Z0-9]*/.exec(s);if(n){tokens.push({type:'number',value:Number(n[0])});i+=n[0].length;}else if(name){tokens.push({type:'name',value:name[0].toLowerCase()});i+=name[0].length;}else if('+-*/^(),'.includes(s[0])){tokens.push({type:s[0]});i++;}else throw Error('Unsupported character. Use plain equations, e.g. sin(x) or x^2.');if(tokens.length>200)throw Error('This expression is too complex.');}
  if(!tokens.length)throw Error('Enter an equation.');let pos=0;
  const take=type=>tokens[pos]?.type===type?(pos++,true):false,node=(fn,latex,precedence=4)=>Object.assign(fn,{latex,precedence});
  function primary(){const t=tokens[pos++];if(!t)throw Error('Complete the equation.');if(t.type==='number')return node(()=>t.value,String(t.value).replace(/e([+-]?\d+)/,'\\times 10^{$1}'));if(t.type==='('){const v=sum();if(!take(')'))throw Error('Close every parenthesis.');return node(v,'\\left('+v.latex+'\\right)');}if(t.type==='name'){
    if(Object.hasOwn(functions,t.value)){if(!take('('))throw Error('Use parentheses after '+t.value+'.');const args=[sum()];while(take(',')){if(args.length>=2)throw Error('Use at most two function arguments.');args.push(sum());}if(!take(')'))throw Error('Close every parenthesis.');const count=['min','max','pow','atan2'].includes(t.value)?2:1;if(args.length!==count)throw Error(t.value+' needs '+count+' argument'+(count>1?'s':'')+'.');const latex=t.value==='sqrt'?'\\sqrt{'+args[0].latex+'}':t.value==='cbrt'?'\\sqrt[3]{'+args[0].latex+'}':t.value==='abs'?'\\left|'+args[0].latex+'\\right|':'\\operatorname{'+t.value+'}\\left('+args.map(a=>a.latex).join(',')+'\\right)';return node(scope=>functions[t.value](...args.map(arg=>arg(scope))),latex);}
    if(t.value==='pi')return node(()=>Math.PI,'\\pi');if(t.value==='e')return node(()=>Math.E,'e');if(variables.includes(t.value))return node(scope=>scope[t.value],t.value==='theta'?'\\theta':t.value);throw Error('Unknown name “'+t.value+'”. Allowed variables: '+variables.join(', ')+'.');
   }throw Error('Expected a number, variable, or function.');}
  function power(){const a=primary();if(take('^')){const b=unary();return node(s=>Math.pow(a(s),b(s)),'{'+a.latex+'}^{'+b.latex+'}',3);}return a;}
  function unary(){if(take('+'))return unary();if(take('-')){const a=unary();return node(s=>-a(s),'-'+a.latex,3);}return power();}
  function product(){let a=unary();while(pos<tokens.length){const op=tokens[pos].type;if(op==='*'||op==='/'){pos++;const b=unary(),prior=a;a=op==='*'?node(s=>prior(s)*b(s),prior.latex+'\\,'+b.latex,2):node(s=>prior(s)/b(s),'\\frac{'+prior.latex+'}{'+b.latex+'}',2);}else if(['number','name','('].includes(op)){const b=unary(),prior=a;a=node(s=>prior(s)*b(s),prior.latex+'\\,'+b.latex,2);}else break;}return a;}
  function sum(){let a=product();while(tokens[pos]?.type==='+'||tokens[pos]?.type==='-'){const op=tokens[pos++].type,b=product(),prior=a;a=op==='+'?node(s=>prior(s)+b(s),prior.latex+'+'+b.latex,1):node(s=>prior(s)-b(s),prior.latex+'-'+b.latex,1);}return a;}
  const evaluate=sum();if(pos!==tokens.length)throw Error('Check the operators and parentheses.');return node(scope=>{const value=evaluate(scope);return Number.isFinite(value)&&Math.abs(value)<1e10?value:null;},evaluate.latex,evaluate.precedence);
 }
 function vector(expression,dimension=2,variables=dimension===3?['x','y','z']:['x','y']){
  if(![2,3].includes(dimension)||typeof expression!=='string'||expression.length>1500)throw Error('Enter a 2D or 3D vector field.');
  let text=expression.trim().replace(/\\(?:mathbf|boldsymbol)\{([A-Za-z])\}/g,'$1').replace(/[−–]/g,'-').replace(/×/g,'*'),name='F';
  if(text.includes('=')){const sides=text.split('=');if(sides.length!==2)throw Error('Use F(x,y) = P i + Q j, or F(x,y,z) = P i + Q j + R k.');const lhs=sides[0].replace(/\s/g,''),match=/^([A-Za-z])(?:\(([^)]*)\))?$/.exec(lhs),expected=dimension===3?'x,y,z':'x,y';if(!match||match[2]&&match[2]!==expected)throw Error('Use F('+expected+') in this vector-field mode.');name=match[1];text=sides[1].trim();}
  const terms=[];let depth=0,start=0;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='(')depth++;else if(c===')'){if(--depth<0)throw Error('Close every parenthesis.');}else if((c==='+'||c==='-')&&depth===0&&i>start){const before=text.slice(start,i).trim();if(before&&!/[+\-*/^(]$/.test(before)&&!/(?:\d+(?:\.\d*)?|\.\d+)[eE]$/.test(before)){terms.push(text.slice(start,i));start=i;}}}
  if(depth!==0)throw Error('Close every parenthesis.');terms.push(text.slice(start));const parts=Array.from({length:dimension},()=>[]);
  for(const term of terms){const match=/^(.*?)\s*([ijk])\s*$/i.exec(term.trim());if(!match)throw Error('End every vector component with i, j'+(dimension===3?', or k.':'. Example: F(x,y) = i + (1/2)j.'));const axis='ijk'.indexOf(match[2].toLowerCase());if(axis>=dimension)throw Error('Choose 3D vector field to use a k component.');let coefficient=match[1].trim().replace(/\*\s*$/,'').trim();if(!coefficient||coefficient==='+')coefficient='1';if(coefficient==='-')coefficient='-1';parts[axis].push(coefficient);}
  const components=parts.map(p=>compile(p.length>1?p.map(s=>'('+s+')').join('+'):p[0]||'0',variables));
  const rendered=[];for(let i=0;i<dimension;i++){let latex=components[i].latex;if(latex==='0')continue;const negative=latex.startsWith('-');if(negative)latex=latex.slice(1);if(latex==='1')latex='';else latex=components[i].precedence<2?'\\left('+latex+'\\right)':'{'+latex+'}';rendered.push((negative?'-':rendered.length?'+':'')+latex+'\\mathbf{'+ 'ijk'[i]+'}');}
  return {name,components,latex:'\\mathbf{'+name+'}('+ (dimension===3?'x,y,z':'x,y')+')='+ (rendered.join('')||'0')};
 }
 function vectorSample(c,expression,index){const dimension=c.mode==='vector3d'?3:2,field=vector(expression,dimension),n=c.quality==='high'?(dimension===3?11:21):(dimension===3?7:13),points=[],colors=['#3478a6','#c16c40','#6c60aa','#3f8c73','#a65076','#83802f','#368b99','#965c42'];let largest=0;
  for(let iz=0;iz<(dimension===3?n:1);iz++)for(let iy=0;iy<n;iy++)for(let ix=0;ix<n;ix++){const x=c.min+(c.max-c.min)*ix/(n-1),y=c.yMin+(c.yMax-c.yMin)*iy/(n-1),z=dimension===3?c.zMin+(c.zMax-c.zMin)*iz/(n-1):0,values=field.components.map(f=>f({x,y,z}));if(values.some(v=>v===null))continue;const magnitude=Math.hypot(...values);largest=Math.max(largest,magnitude);points.push({x,y,z,values,magnitude});}
  if(!points.length)throw Error('No real vectors in this range.');const color=colors[index%colors.length],meta={kind:'vector-field',dimension,points:points.length,zeroVectors:points.filter(p=>p.magnitude===0).length};
  if(dimension===3){const nonzero=points.filter(p=>p.magnitude>0);if(!nonzero.length)return {type:'scatter3d',mode:'markers',x:points.map(p=>p.x),y:points.map(p=>p.y),z:points.map(p=>p.z),marker:{size:2,color},name:expression,meta,hovertemplate:'Zero vector<extra></extra>'};return {type:'cone',x:nonzero.map(p=>p.x),y:nonzero.map(p=>p.y),z:nonzero.map(p=>p.z),u:nonzero.map(p=>p.values[0]/(c.normalize?p.magnitude:1)),v:nonzero.map(p=>p.values[1]/(c.normalize?p.magnitude:1)),w:nonzero.map(p=>p.values[2]/(c.normalize?p.magnitude:1)),customdata:nonzero.map(p=>[...p.values,p.magnitude]),name:expression,meta,anchor:'tail',sizemode:'scaled',sizeref:.65,showscale:false,colorscale:[[0,color],[1,color]],hovertemplate:'(%{x:.3g}, %{y:.3g}, %{z:.3g})<br>F = (%{customdata[0]:.3g}, %{customdata[1]:.3g}, %{customdata[2]:.3g})<br>|F| = %{customdata[3]:.3g}<extra></extra>'};}
  const x=[],y=[],text=[],step=.8*Math.min((c.max-c.min)/(n-1),(c.yMax-c.yMin)/(n-1));for(const p of points){if(!p.magnitude)continue;const factor=step/(c.normalize?p.magnitude:largest),dx=p.values[0]*factor,dy=p.values[1]*factor,tipX=p.x+dx,tipY=p.y+dy,head=.24,side=.13,label='('+p.x.toPrecision(3)+', '+p.y.toPrecision(3)+')<br>F = ('+p.values.map(v=>v.toPrecision(3)).join(', ')+')<br>|F| = '+p.magnitude.toPrecision(3);x.push(p.x,tipX,null,tipX-head*dx+side*dy,tipX,tipX-head*dx-side*dy,null);y.push(p.y,tipY,null,tipY-head*dy-side*dx,tipY,tipY-head*dy+side*dx,null);for(let i=0;i<7;i++)text.push(label);}
  if(!x.length)return {type:'scatter',mode:'markers',x:points.map(p=>p.x),y:points.map(p=>p.y),marker:{size:3,color},name:expression,meta,hovertemplate:'Zero vector<extra></extra>'};return {type:'scatter',mode:'lines',x,y,text,hoverinfo:'text',line:{color,width:1.5},connectgaps:false,name:expression,meta};
 }

 // Sample zero sets directly, retaining every branch within the chosen bounds.
 function implicit(source,dimension){
  if(typeof source!=='string'||source.length>500)throw Error('Keep each equation under 500 characters.');
  const sides=source.split('=');if(sides.length>2||sides.some(s=>!s.trim()))throw Error('Use one equation, for example x^2 + y^2 = 9.');
  const vars=dimension===3?['x','y','z']:['x','y'],left=compile(sides[0],vars),right=compile(sides[1]||'0',vars);
  return scope=>{const a=left(scope),b=right(scope);return a===null||b===null?null:a-b;};
 }
 function implicitSample(c,expression,index){
  const dimension=c.mode==='implicit3d'?3:2,n=dimension===3?(c.quality==='high'?45:33):(c.quality==='high'?321:201),f=implicit(expression,dimension),points=[],values=[],colors=['#3478a6','#c16c40','#6c60aa','#3f8c73','#a65076','#83802f','#368b99','#965c42'];
  let finite=0,nonzero=0;
  for(let iz=0;iz<(dimension===3?n:1);iz++)for(let iy=0;iy<n;iy++)for(let ix=0;ix<n;ix++){
   const p={x:c.min+(c.max-c.min)*ix/(n-1),y:c.yMin+(c.yMax-c.yMin)*iy/(n-1),z:dimension===3?c.zMin+(c.zMax-c.zMin)*iz/(n-1):0},v=f(p);points.push(p);values.push(v);if(v!==null){finite++;if(v!==0)nonzero++;}
  }
  if(!finite)throw Error('No real values in these bounds.');if(!nonzero)throw Error('This equation is true throughout the sampled region and does not define a single curve or surface.');
  const cache=new Map(),vertices=[],seen=new Set(),faces=[],segments=[];
  function edge(a,b){
   const va=values[a],vb=values[b],key=va===0?'v'+a:vb===0?'v'+b:a<b?a+':'+b:b+':'+a;
   if(cache.has(key))return cache.get(key);let point=null;
   if(va===0)point=points[a];else if(vb===0)point=points[b];else{
    let lo=0,hi=1,vl=va,t=va/(va-vb);const pa=points[a],pb=points[b],tolerance=Math.max(Math.abs(va),Math.abs(vb))*1e-7;
    for(let k=0;k<30;k++){
     const p={x:pa.x+(pb.x-pa.x)*t,y:pa.y+(pb.y-pa.y)*t,z:pa.z+(pb.z-pa.z)*t},v=f(p);
     if(v===null)break;if(Math.abs(v)<=tolerance){point=p;break;}
     if((v>0)===(vl>0)){lo=t;vl=v;}else hi=t;t=(lo+hi)/2;
    }
   }
   const id=point?vertices.push(point)-1:null;cache.set(key,id);return id;
  }
  function primitive(ids,direction){
   if(ids.some(v=>v===null)||new Set(ids).size!==ids.length)return;
   const key=ids.slice().sort((a,b)=>a-b).join(':');if(seen.has(key))return;
   if(ids.length===3){const [a,b,c]=ids.map(i=>vertices[i]),u=[b.x-a.x,b.y-a.y,b.z-a.z],v=[c.x-a.x,c.y-a.y,c.z-a.z];if(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])===0)return;}
   if(direction&&ids.length===3){const [a,b,c]=ids.map(i=>vertices[i]),u=[b.x-a.x,b.y-a.y,b.z-a.z],v=[c.x-a.x,c.y-a.y,c.z-a.z];if((u[1]*v[2]-u[2]*v[1])*direction.x+(u[2]*v[0]-u[0]*v[2])*direction.y+(u[0]*v[1]-u[1]*v[0])*direction.z<0)ids=[ids[0],ids[2],ids[1]];}seen.add(key);(dimension===3?faces:segments).push(ids);if(seen.size>160000)throw Error('Too much detail. Reduce the bounds or choose standard sampling.');
  }
  function cell(ids){
   if(ids.some(i=>values[i]===null))return;const inside=ids.filter(i=>values[i]<=0),outside=ids.filter(i=>values[i]>0);if(!inside.length||!outside.length)return;
   const direction={};for(const axis of ['x','y','z'])direction[axis]=outside.reduce((sum,i)=>sum+points[i][axis],0)/outside.length-inside.reduce((sum,i)=>sum+points[i][axis],0)/inside.length;
   if(dimension===2){const cut=[];for(const a of inside)for(const b of outside)cut.push(edge(a,b));primitive(cut);}
   else if(inside.length===1||outside.length===1){const one=inside.length===1?inside[0]:outside[0],other=inside.length===1?outside:inside;primitive(other.map(v=>edge(one,v)),direction);}
   else{const [a,b]=inside,[d,e]=outside,ad=edge(a,d),bd=edge(b,d),be=edge(b,e),ae=edge(a,e);primitive([ad,bd,be],direction);primitive([ad,be,ae],direction);}
  }
  for(let iz=0;iz<(dimension===3?n-1:1);iz++)for(let iy=0;iy<n-1;iy++)for(let ix=0;ix<n-1;ix++){
   const a=iz*n*n+iy*n+ix,b=a+1,d=a+n,c=d+1;
   if(dimension===2){cell([a,b,c]);cell([a,c,d]);}
   else{const e=a+n*n,g=c+n*n,h=d+n*n,j=b+n*n;for(const t of [[a,b,c,g],[a,c,d,g],[a,d,h,g],[a,h,e,g],[a,e,j,g],[a,j,b,g]])cell(t);}
  }
  if(!seen.size)throw Error('No curve or surface found in these bounds. Try wider bounds or fine sampling.');
  const common={name:expression,meta:{kind:'implicit',dimension,samples:values.length},connectgaps:false};
  if(dimension===2){const x=[],y=[];for(const pair of segments){for(const id of pair){x.push(vertices[id].x);y.push(vertices[id].y);}x.push(null);y.push(null);}return {...common,type:'scatter',mode:'lines',x,y,line:{color:colors[index%colors.length],width:3}};}
  return {...common,type:'mesh3d',x:vertices.map(p=>p.x),y:vertices.map(p=>p.y),z:vertices.map(p=>p.z),i:faces.map(t=>t[0]),j:faces.map(t=>t[1]),k:faces.map(t=>t[2]),intensity:colorAxis(vertices),intensitymode:'vertex',colorscale:surfaceColors,opacity:c.multiple?.75:1,flatshading:false,showscale:false};
 }


 // Share height shading across explicit, implicit and parametric surfaces.
 const surfaceColors=[[0,'#313695'],[.15,'#4575b4'],[.3,'#74add1'],[.45,'#abd9e9'],[.5,'#ffffbf'],[.65,'#fdae61'],[.8,'#f46d43'],[.9,'#d73027'],[1,'#a50026']];
 function colorAxis(points){for(const axis of ['z','y','x']){let lo=Infinity,hi=-Infinity;for(const p of points){lo=Math.min(lo,p[axis]);hi=Math.max(hi,p[axis]);}if(hi>lo)return points.map(p=>p[axis]);}return points.map(()=>0);}
 function parametric(source,parameters=[]){
  source=normalize(source);
  if(typeof source!=='string'||source.length>1000000)throw Error('Enter parametric surfaces.');
  const entries=source.split('\n').map(s=>s.trim()).filter(Boolean);
  if(entries.some(line=>/^r\s*(?:\(\s*u\s*,\s*v\s*\))?\s*=/i.test(line)||line.startsWith('<'))){

   return entries.map((entry,index)=>{
    if(!/^r\s*(?:\(\s*u\s*,\s*v\s*\))?\s*=/i.test(entry)&&!entry.startsWith('<'))throw Error('Use one complete r(u,v) surface per line.');
    const rhs=entry.replace(/^r\s*(?:\(\s*u\s*,\s*v\s*\))?\s*=\s*/i,'');if(rhs.includes('='))throw Error('Use either the angle-bracket form or the i, j, k form for each surface.');
    let compiled;
    if(rhs.startsWith('<')&&rhs.endsWith('>')){
     const body=rhs.slice(1,-1),parts=[];let level=0,start=0;for(let i=0;i<body.length;i++){if(body[i]==='(')level++;if(body[i]===')'&&--level<0)throw Error('Close every parenthesis.');if(body[i]===','&&level===0){parts.push(body.slice(start,i));start=i+1;}}parts.push(body.slice(start));if(level!==0||parts.length!==3)throw Error('Surface '+(index+1)+': enter three coordinates inside angle brackets.');compiled=parts.map(part=>compile(part,['u','v',...parameters]));
    }else compiled=vector(rhs,3,['u','v',...parameters]).components;
    return {components:Object.fromEntries(['x','y','z'].map((a,i)=>[a,compiled[i]])),name:entry,latex:'r(u,v)=\\left\\langle '+compiled.map(f=>f.latex).join(', ')+ '\\right\\rangle'};
   });
  }
  const parts=[];let depth=0,start=0;
  for(let i=0;i<source.length;i++){const ch=source[i];if(ch==='(')depth++;if(ch===')'&&--depth<0)throw Error('Close every parenthesis.');if(depth===0&&',;\n'.includes(ch)){const part=source.slice(start,i).trim();if(part)parts.push(part);start=i+1;}}
  if(depth!==0)throw Error('Close every parenthesis.');const last=source.slice(start).trim();if(last)parts.push(last);
  if(!parts.length||parts.length%3!==0)throw Error('Enter all three coordinates: x = u, y = v-u, z = -v. Use one surface per line, or put each coordinate on its own line.');
  const surfaces=[];
  for(let i=0;i<parts.length;i+=3){const expressions={},components={};for(const part of parts.slice(i,i+3)){const match=/^([xyz])\s*=\s*(.+)$/i.exec(part);if(!match||Object.hasOwn(components,match[1].toLowerCase()))throw Error('Surface '+(i/3+1)+': enter x, y, and z exactly once.');const axis=match[1].toLowerCase();try{components[axis]=compile(match[2],['u','v',...parameters]);}catch(error){throw Error('Surface '+(i/3+1)+' coordinate '+axis+': '+error.message);}expressions[axis]=match[2];}surfaces.push({components,name:['x','y','z'].map(a=>a+' = '+expressions[a]).join(', ')});}
  return surfaces;
 }
 function parametricSample(c){
  const surfaces=parametric(c.equations),n=c.quality==='high'?101:65;
  return surfaces.map(({components,name},index)=>{
   const x=[],y=[],z=[],customdata=[];let real=0;
   for(let j=0;j<n;j++){const rx=[],ry=[],rz=[],params=[];for(let i=0;i<n;i++){const u=c.min+(c.max-c.min)*i/(n-1),v=c.yMin+(c.yMax-c.yMin)*j/(n-1),p=['x','y','z'].map(a=>components[a]({u,v}));if(p.some(a=>a===null))p.fill(null);else real++;rx.push(p[0]);ry.push(p[1]);rz.push(p[2]);params.push([u,v]);}x.push(rx);y.push(ry);z.push(rz);customdata.push(params);}
   if(!real)throw Error('Surface '+(index+1)+': no real coordinates in these U/V bounds.');
   return {type:'surface',x,y,z,customdata,name,colorscale:surfaceColors,showscale:false,connectgaps:false,opacity:surfaces.length>1?.8:1,meta:{kind:'parametric',parameters:['u','v']},hovertemplate:'u: %{customdata[0]:.4g}<br>v: %{customdata[1]:.4g}<br>x: %{x:.4g}<br>y: %{y:.4g}<br>z: %{z:.4g}<extra></extra>'};
  });
 }

 function sample(input){if(input.mode!=='physics')input={...input,equations:normalize(input.equations)};if(input.mode==='auto')return sample({...input,mode:detectMode(input)});if(input.mode==='parametric'&&(input.parameters?.u||input.parameters?.v))throw Error('U and V are surface coordinates in parametric mode. Use another letter for sliders.');const tools=typeof module!=='undefined'&&module.exports?require('./interactive-tools.js'):root.InteractiveTools;let {mode,equations,min,max,yMin,yMax,zMin,zMax,quality,normalize:normalizeVectors=false,physics}=tools.resolve(input);
  if(mode==='physics')return (typeof module!=='undefined'&&module.exports?require('./physics-graphs.js'):root.PhysicsGraphs).sample(physics);
  if(typeof equations!=='string'||equations.length>1000000)throw Error('Enter equations.');if(min===null||max===null||min===undefined||max===undefined||String(min).trim()===''||String(max).trim()==='')throw Error('Enter both range endpoints.');min=Number(min);max=Number(max);if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max||max-min>100000)throw Error('Enter a finite increasing range (width at most 100000).');
  yMin=yMin===undefined?min:yMin;yMax=yMax===undefined?max:yMax;if(['surface','vector','vector3d','implicit2d','implicit3d','parametric'].includes(mode)&&(yMin===null||yMax===null||String(yMin).trim()===''||String(yMax).trim()===''||![Number(yMin),Number(yMax)].every(Number.isFinite)||Number(yMin)>=Number(yMax)||Number(yMax)-Number(yMin)>100000))throw Error('Enter a finite increasing '+(mode==='parametric'?'V':'Y')+' range (width at most 100000).');yMin=Number(yMin);yMax=Number(yMax);
  zMin=zMin===undefined?min:zMin;zMax=zMax===undefined?max:zMax;if(['vector3d','implicit3d'].includes(mode)&&(zMin===null||zMax===null||String(zMin).trim()===''||String(zMax).trim()===''||![Number(zMin),Number(zMax)].every(Number.isFinite)||Number(zMin)>=Number(zMax)||Number(zMax)-Number(zMin)>100000))throw Error('Enter a finite increasing Z range (width at most 100000).');zMin=Number(zMin);zMax=Number(zMax);
  if(mode==='parametric')return parametricSample({equations,min,max,yMin,yMax,quality});
  const expressions=equations.split('\n').map(s=>s.trim()).filter(Boolean);if(!expressions.length)throw Error('Enter at least one equation.');if(!['cartesian','polar','surface','vector','vector3d','implicit2d','implicit3d'].includes(mode))throw Error('Choose a graph mode.');
  return expressions.map((expression,index)=>{try{if(mode==='implicit2d'||mode==='implicit3d')return implicitSample({mode,min,max,yMin,yMax,zMin,zMax,quality,multiple:expressions.length>1},expression,index);if(mode==='vector'||mode==='vector3d')return vectorSample({mode,min,max,yMin,yMax,zMin,zMax,quality,normalize:normalizeVectors},expression,index);const f=compile(expression,mode==='surface'?['x','y']:mode==='polar'?['theta','t']:['x']);
   if(mode==='surface'){const n=quality==='high'?101:65,axis=Array.from({length:n},(_,i)=>min+(max-min)*i/(n-1)),yAxis=Array.from({length:n},(_,i)=>yMin+(yMax-yMin)*i/(n-1)),z=yAxis.map(y=>axis.map(x=>f({x,y})));if(!z.some(row=>row.some(v=>v!==null)))throw Error('No real values in this range.');return {type:'surface',x:axis,y:yAxis,z,name:expression,colorscale:surfaceColors,showscale:false,opacity:expressions.length>1?.8:1};}
   const n=quality==='high'?2401:1201,x=[],y=[];for(let i=0;i<n;i++){const t=min+(max-min)*i/(n-1),v=f({x:t,theta:t,t});x.push(mode==='polar'&&v!==null?v*Math.cos(t):t);y.push(mode==='polar'&&v!==null?v*Math.sin(t):v);}if(!y.some(v=>v!==null))throw Error('No real values in this range.');
   // Split steep jumps to avoid drawing across common asymptotes.
   if(mode==='cartesian')for(let i=y.length-1;i>0;i--)if(y[i]!==null&&y[i-1]!==null&&Math.abs(y[i]-y[i-1])>Math.max(30,(max-min)*8)){const midpoint=f({x:(x[i]+x[i-1])/2});if(midpoint===null||Math.abs(midpoint-(y[i]+y[i-1])/2)>Math.max(1,Math.abs(y[i]-y[i-1])*.6))y[i]=null;}
   return {type:'scatter',mode:'lines',x,y,name:expression,connectgaps:false,line:{width:3}};
  }catch(error){throw Error('Equation '+(index+1)+': '+error.message);}});
 }

 function detectMode(input){
  if(input.mode==='physics')return 'physics';
  const tools=typeof module!=='undefined'&&module.exports?require('./interactive-tools.js'):root.InteractiveTools,text=tools.resolve({...input,equations:normalize(input.equations)}).equations,lines=text.split('\n').map(s=>s.trim()).filter(Boolean),names=new Set((text.match(/[a-zA-Z][a-zA-Z0-9]*/g)||[]).map(s=>s.toLowerCase()));
  if(/^\s*(?:r\s*\(\s*u\s*,\s*v\s*\)\s*=|r\s*=\s*<|<)/im.test(text))return 'parametric';
  if(/(?:^|[,;\n])\s*[xyz]\s*=/i.test(text)&&(names.has('u')||names.has('v')))return 'parametric';
  if(names.has('i')||names.has('j')||names.has('k'))return names.has('k')||names.has('z')?'vector3d':'vector';
  if(names.has('theta')||/θ/.test(text)||lines.some(s=>/^r\s*=/i.test(s)))return 'polar';
  if(names.has('z'))return lines.every(s=>{const parts=s.split('=');return parts.length===2&&/^z$/i.test(parts[0].trim())&&!new Set((parts[1].match(/[a-zA-Z][a-zA-Z0-9]*/g)||[]).map(x=>x.toLowerCase())).has('z');})?'surface':'implicit3d';
  return lines.some(s=>{const parts=s.split('=');return parts.length===2?!/^y$/i.test(parts[0].trim())||new Set((parts[1].match(/[a-zA-Z][a-zA-Z0-9]*/g)||[]).map(x=>x.toLowerCase())).has('y'):new Set((s.match(/[a-zA-Z][a-zA-Z0-9]*/g)||[]).map(x=>x.toLowerCase())).has('y');})?'implicit2d':'cartesian';
 }
 function formatEquations(input){
  const mode=detectMode(input),parameters=Object.keys(input.parameters||{}),source=normalize(String(input.equations||'')),variables=['x','y','z','r','u','v','theta','t',...parameters];
  if(source.length>1000000)throw Error('Enter equations.');
  if(mode==='parametric')return parametric(source,parameters).map(s=>s.latex||'\\begin{aligned}'+['x','y','z'].map(a=>a+'&='+s.components[a].latex).join('\\\\')+'\\end{aligned}');
  const lines=source.split('\n').map(s=>s.trim()).filter(Boolean);if(!lines.length)throw Error('Enter equations.');
  if(mode==='vector'||mode==='vector3d')return lines.map(s=>vector(s,mode==='vector3d'?3:2).latex);
  return lines.map(s=>{const sides=s.split('=');if(sides.length>2||sides.some(p=>!p.trim()))throw Error('Complete each equation.');return sides.map(p=>compile(p,variables).latex).join('=');});
 }

 function inferMode(input){
  if(!['cartesian','surface','implicit2d','implicit3d'].includes(input.mode))return input.mode;
  const tools=typeof module!=='undefined'&&module.exports?require('./interactive-tools.js'):root.InteractiveTools,c=tools.resolve({...input,equations:normalize(input.equations)});if(['x','y','z'].every(a=>new RegExp('(?:^|[,;\\n])\\s*'+a+'\\s*=','i').test(c.equations))&&/(?:^|[^a-z])[uv](?:[^a-z]|$)/i.test(c.equations))return 'parametric';if(!['cartesian','surface'].includes(input.mode))return input.mode;const lines=c.equations.split('\n').map(s=>s.trim()).filter(Boolean);
  if(input.mode==='cartesian'){
   if(lines.some(s=>/\bz\b/i.test(s)))return 'implicit3d';
   if(lines.some(s=>{const p=s.split('=');return p.length===2?!/^y$/i.test(p[0].trim())||/\by\b/i.test(p[1]):/\by\b/i.test(s);}))return 'implicit2d';
  }else if(lines.some(s=>{const p=s.split('=');return p.length===2?!/^z$/i.test(p[0].trim())||/\bz\b/i.test(p[1]):/\bz\b/i.test(s);}))return 'implicit3d';
  return input.mode;
 }
 const api={compile,sample,vector,implicit,parametric,inferMode,detectMode,formatEquations,normalize};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GraphTools=api;
})(typeof globalThis!=='undefined'?globalThis:this);
