(function(root){
 const groups=[
  {name:'Logic & set symbols',items:[
   ['Universal quantifier',String.raw`\forall #0,\ #?`],['Existential quantifier',String.raw`\exists #0:\ #?`],['Unique existence',String.raw`\exists! #0:\ #?`],['Empty set',String.raw`\varnothing`],['Power set',String.raw`\mathcal{P}(#0)`],['Infinite cardinal',String.raw`\aleph_{#0}`],['Proper subset',String.raw`#0\subsetneq#?`],['Disjoint union',String.raw`#0\sqcup#?`]
  ]},
  {name:'Algebra & mapping symbols',items:[
   ['Tensor product',String.raw`#0\otimes#?`],['Direct sum',String.raw`#0\oplus#?`],['Semidirect product',String.raw`#0\rtimes#?`],['Normal subgroup',String.raw`#0\trianglelefteq#?`],['Injective map',String.raw`#0\hookrightarrow#?`],['Surjective map',String.raw`#0\twoheadrightarrow#?`],['Element mapping',String.raw`#0\mapsto#?`],['Isomorphism',String.raw`#0\cong#?`]
  ]},
  {name:'Analysis & geometry symbols',items:[
   ['Norm',String.raw`\left\lVert#0\right\rVert`],['Inner product',String.raw`\left\langle#0,#?\right\rangle`],['Floor',String.raw`\left\lfloor#0\right\rfloor`],['Ceiling',String.raw`\left\lceil#0\right\rceil`],['Boundary operator',String.raw`\partial #0`],['Gradient',String.raw`\nabla #0`],['Divergence',String.raw`\nabla\cdot #0`],['Curl',String.raw`\nabla\times #0`],['Exterior product',String.raw`#0\wedge#?`],['Hodge star',String.raw`\star #0`],['Weak convergence',String.raw`#0\rightharpoonup#?`],['Absolute continuity',String.raw`#0\ll#?`]
  ]},
  {name:'Order & asymptotic symbols',items:[
   ['Strict order',String.raw`#0\prec#?`],['Non-strict order',String.raw`#0\preccurlyeq#?`],['Bound up to a constant',String.raw`#0\lesssim#?`],['Asymptotic comparability',String.raw`#0\asymp#?`]
  ]},
  {name:'Proof & special alphabets',items:[
   ['Therefore',String.raw`\therefore`],['Because',String.raw`\because`],['Defined as',String.raw`#0\coloneqq#?`],['Real numbers',String.raw`\mathbb{R}`],['Complex numbers',String.raw`\mathbb{C}`],['Calligraphic letter',String.raw`\mathcal{#0}`],['Fraktur letter',String.raw`\mathfrak{#0}`]
  ]}
 ];
 const api={groups,entries:groups.flatMap(g=>g.items.map(([label,latex])=>({label,latex,group:g.name})))};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AdvancedMathSymbols=api;
})(typeof globalThis!=='undefined'?globalThis:this);
