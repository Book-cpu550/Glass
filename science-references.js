(function(root){
 const kinds={equation:'Equation',figure:'Figure',table:'Table',theorem:'Theorem'};
 function labels(doc){const counts={},targets=new Map();function walk(node){if(node.type==='referenceLabel'){const a=node.attrs||{},kind=kinds[a.kind]?a.kind:'equation';counts[kind]=(counts[kind]||0)+1;if(a.id&&!targets.has(a.id))targets.set(a.id,{id:a.id,kind,title:a.title||'',label:kinds[kind]+' '+counts[kind]});}for(const child of node.content||[])walk(child);}walk(doc);return [...targets.values()];}
 function labelFor(node,targets){const a=node.attrs||{},target=targets.find(t=>t.id===(node.type==='crossReference'?a.target:a.id));return target?(node.type==='referenceLabel'?target.label+(a.title?' — '+a.title:''):target.label):'Missing reference';}
 const api={kinds,labels,labelFor};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GlassReferences=api;
})(typeof globalThis!=='undefined'?globalThis:this);
