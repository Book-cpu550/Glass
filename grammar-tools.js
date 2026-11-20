(function(root){
 'use strict';
 function pack(segments){
  const contexts=new Map();
  return {segments:segments.map(segment=>{const contextId=String(segment.contextId??segment.context??segment.id);if(segment.context&&!contexts.has(contextId))contexts.set(contextId,segment.context);return {id:segment.id,text:segment.text,contextId};}),contexts:[...contexts].map(([id,text])=>({id,text}))};
 }
 function quick(segments){
  const spelling={teh:'the',recieve:'receive',seperate:'separate',definately:'definitely',occured:'occurred',grammer:'grammar',equivelent:'equivalent',continous:'continuous',differntiable:'differentiable',therefor:'therefore'};
  const suggestions=[];
  for(const segment of segments){
   let corrected=segment.text;const reasons=new Set();
   corrected=corrected.replace(/\b([A-Za-z]+)(\s+)\1\b/gi,(match,word)=>{reasons.add('Remove a repeated word.');return word;});
   corrected=corrected.replace(/\b(teh|recieve|seperate|definately|occured|grammer|equivelent|continous|differntiable|therefor)\b/gi,word=>{reasons.add('Correct a common spelling error.');let value=spelling[word.toLowerCase()];if(word===word.toUpperCase())return value.toUpperCase();return /^[A-Z]/.test(word)?value[0].toUpperCase()+value.slice(1):value;});
   corrected=corrected.replace(/\b(This|That|It) are\b/gi,(match,subject)=>{reasons.add('Use a singular verb with this subject.');return subject+' is';});
   corrected=corrected.replace(/\b(These|Those|We|They) is\b/gi,(match,subject)=>{reasons.add('Use a plural verb with this subject.');return subject+' are';});
   corrected=corrected.replace(/\b(We|They|You) has\b/gi,(match,subject)=>{reasons.add('Use “have” with this subject.');return subject+' have';});
   corrected=corrected.replace(/\b([Aa]) (example|equation|integral|assumption|error|inequality|identity|argument|expression|integer)\b/g,(match,article,word)=>{reasons.add('Use “an” before this vowel sound.');return (article==='A'?'An':'an')+' '+word;});
   if(corrected!==segment.text)suggestions.push({segmentId:segment.id,original:segment.text,replacement:corrected,explanation:[...reasons].join(' ')});
  }
  return {summary:'Offline quick check',suggestions};
 }
 function batches(packet,limit=7500){
  const lookup=new Map(packet.contexts.map(context=>[String(context.id),context.text])),result=[];let segments=[],contexts=new Map(),size=0;
  const flush=()=>{if(segments.length)result.push({segments,contexts:[...contexts].map(([id,text])=>({id,text}))});segments=[];contexts=new Map();size=0;};
  for(const segment of packet.segments){
   for(let offset=0;offset<segment.text.length;){
    let end=Math.min(offset+3000,segment.text.length);if(end<segment.text.length){const split=segment.text.lastIndexOf(' ',end);if(split>offset+1500)end=split+1;}
    const text=segment.text.slice(offset,end),id=String(segment.contextId),context=(lookup.get(id)||'').slice(0,1500),cost=text.length+(contexts.has(id)?0:context.length)+50;
    if(size+cost>limit&&segments.length)flush();
    segments.push({...segment,text});if(context)contexts.set(id,context);size+=cost;offset=end;
   }
  }
  flush();return result;
 }
 const api={pack,quick,batches};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DocGrammar=api;
})(typeof globalThis!=='undefined'?globalThis:this);
