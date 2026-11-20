(function(root){
 const groups=[
  {name:'Chemical species',items:[
   ['formula','Chemical formula',String.raw`\mathrm{#0}_{#?}\mathrm{#?}_{#?}`],
   ['group','Polyatomic group',String.raw`\left(\mathrm{#0}\right)_{#?}`],
   ['ion','Ion with charge',String.raw`\mathrm{#0}^{#?}`],
   ['complex','Coordination complex ion',String.raw`\left[\mathrm{#0}\right]^{#?}`],
   ['isotope','Isotope / nuclide',String.raw`\vphantom{X}^{#0}_{#?}\mathrm{#?}`],
   ['state','Species with physical state',String.raw`\mathrm{#0}\mathrm{(#?)}`],
   ['aqueous','Aqueous ion',String.raw`\mathrm{#0}^{#?}\mathrm{(aq)}`],
   ['electron','Electron',String.raw`\mathrm{e}^{-}`],
   ['radical','Radical species',String.raw`\mathrm{#0}^{\bullet}`]
  ]},
  {name:'Reactions',items:[
   ['reaction','Reaction arrow',String.raw`\mathrm{#0}\rightarrow\mathrm{#?}`],
   ['stoichiometry','Reaction with coefficients',String.raw`#0\,\mathrm{#?}+#?\,\mathrm{#?}\rightarrow#?\,\mathrm{#?}`],
   ['equilibrium','Equilibrium reaction',String.raw`\mathrm{#0}\rightleftharpoons\mathrm{#?}`],
   ['conditions','Reaction conditions above / below arrow',String.raw`\mathrm{#0}\xrightarrow[#?]{#?}\mathrm{#?}`],
   ['heat','Heat-driven reaction',String.raw`\mathrm{#0}\overset{\Delta}{\rightarrow}\mathrm{#?}`],
   ['light','Photochemical reaction',String.raw`\mathrm{#0}\overset{h\nu}{\rightarrow}\mathrm{#?}`],
   ['gas','Gas evolved',String.raw`\mathrm{#0}\uparrow`],
   ['precipitate','Precipitate formed',String.raw`\mathrm{#0}\downarrow`]
  ]},
  {name:'Bonds and electron notation',items:[
   ['single','Single bond',String.raw`\mathrm{#0}\!-\!\mathrm{#?}`],
   ['double','Double bond',String.raw`\mathrm{#0}\!=\!\mathrm{#?}`],
   ['triple','Triple bond',String.raw`\mathrm{#0}\!\equiv\!\mathrm{#?}`],
   ['polar','Polar bond (partial charges)',String.raw`\mathrm{#0}^{\delta+}\!-\!\mathrm{#?}^{\delta-}`],
   ['pair','Lewis electron pair',String.raw`\mathrm{#0}\!:`]
  ]},
  {name:'Chemical quantities and cells',items:[
   ['concentration','Species concentration',String.raw`\left[\mathrm{#0}\right]`],
   ['activity','Species activity',String.raw`a_{\mathrm{#0}}`],
   ['enthalpy','Standard reaction enthalpy',String.raw`\Delta_{\mathrm r}H^{\circ}=#0\,\mathrm{kJ\,mol^{-1}}`],
   ['gibbs','Standard reaction Gibbs energy',String.raw`\Delta_{\mathrm r}G^{\circ}=#0\,\mathrm{kJ\,mol^{-1}}`],
   ['cell','Electrochemical cell notation',String.raw`\mathrm{#0}\mid\mathrm{#?}\parallel\mathrm{#?}\mid\mathrm{#?}`]
  ]}
 ];
 const entries=groups.flatMap(group=>group.items.map(([id,label,latex])=>({id,label,latex,group:group.name})));
 const api={groups,entries};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ChemistryTemplates=api;
})(typeof globalThis!=='undefined'?globalThis:this);

