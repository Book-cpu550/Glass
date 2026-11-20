(function(root){
 const templates=[{id:'blank',name:'Blank note',title:'Untitled note',sections:[]},
 {id:'lab',name:'Lab notes page',title:'Lab notes',sections:['Date','Objective','Materials','Procedure','Observations','Data','Results','Conclusion']},
 {id:'math',name:'Math notes page',title:'Math notes',sections:['Topic','Definitions','Theorems','Worked examples','Proofs','Practice','Questions']},
 {id:'chemistry',name:'Chemistry notes page',title:'Chemistry notes',sections:['Topic','Substances','Reactions','Conditions','Measurements','Calculations','Observations','Conclusion']},
 {id:'experiment',name:'Scientific experiment',title:'Scientific experiment',sections:['Question','Hypothesis','Independent variable','Dependent variable','Controlled variables','Control group','Materials','Method','Data','Analysis','Conclusion','Limitations']}];
 function document(id){const template=templates.find(t=>t.id===id);if(!template)throw Error('Unknown note template');const content=template.sections.flatMap(title=>[{type:'heading',attrs:{level:2},content:[{type:'text',text:title}]},...(title==='Data'||title==='Measurements'?[{type:'table',content:Array.from({length:4},(_,r)=>({type:'tableRow',content:Array.from({length:3},()=>({type:r===0?'tableHeader':'tableCell',attrs:{colspan:1,rowspan:1,colwidth:null},content:[{type:'paragraph'}]}))}))}]:[{type:'paragraph'},{type:'paragraph'}])]);return {type:'doc',content:content.length?content:[{type:'paragraph'}]};}
 const api={templates,document};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NoteTemplates=api;
})(typeof globalThis!=='undefined'?globalThis:this);
