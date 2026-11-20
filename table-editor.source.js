import {Node,mergeAttributes} from '@tiptap/core';
import {TextSelection,EditorState,Selection} from '@tiptap/pm/state';
import {tableEditing,columnResizing,addRowBefore,addRowAfter,deleteRow,addColumnBefore,addColumnAfter,deleteColumn,deleteTable,mergeCells,splitCell,toggleHeaderRow,toggleHeaderColumn,goToNextCell,setCellAttr,CellSelection} from '@tiptap/pm/tables';
const operations={addRowBefore,addRowAfter,deleteRow,addColumnBefore,addColumnAfter,deleteColumn,deleteTable,mergeCells,splitCell,toggleHeaderRow,toggleHeaderColumn};
const roles={table:'table',tableRow:'row',tableCell:'cell',tableHeader:'header_cell'};
// Table commands map positions from their own transaction's starting document.
// Use a fresh transaction so earlier steps in a Tiptap chain aren't mapped twice.
function applyTableCommand(command,{state,tr,dispatch}){const fresh=EditorState.create({schema:state.schema,doc:tr.doc,selection:tr.selection,storedMarks:tr.storedMarks});return command(fresh,dispatch?result=>{for(const step of result.steps)tr.step(step);tr.setSelection(Selection.fromJSON(tr.doc,result.selection.toJSON()));if(result.storedMarksSet)tr.setStoredMarks(result.storedMarks);if(result.scrolledIntoView)tr.scrollIntoView();}:undefined);}
const Table=Node.create({name:'table',group:'block',content:'tableRow+',isolating:true,
 extendNodeSchema(extension){return roles[extension.name]?{tableRole:roles[extension.name]}:{};},
 parseHTML(){return [{tag:'table'}];},renderHTML({HTMLAttributes}){return ['table',mergeAttributes(HTMLAttributes,{'class':'glass-table'}),['tbody',0]];},
 addCommands(){return {
  insertTable:({rows=3,cols=3,withHeaderRow=true,values}={})=>({state,dispatch})=>{if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>30||cols>20)return false;const nodes=state.schema.nodes,content=[];for(let r=0;r<rows;r++){const cells=[];for(let c=0;c<cols;c++){const value=values?.[r]?.[c],p=nodes.paragraph.create(null,value!==undefined&&value!==null&&value!==''?state.schema.text(String(value)):null);cells.push((r===0&&withHeaderRow?nodes.tableHeader:nodes.tableCell).create(null,p));}content.push(nodes.tableRow.create(null,cells));}if(dispatch){const tr=state.tr.replaceSelectionWith(nodes.table.create(null,content)).scrollIntoView();tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(tr.selection.from+1,tr.doc.content.size))));dispatch(tr);}return true;},
  ...Object.fromEntries(Object.entries(operations).map(([name,fn])=>[name,()=>props=>applyTableCommand(fn,props)])),
  setCellBackground:color=>props=>applyTableCommand(setCellAttr('backgroundColor',color||null),props),
  setCellSelection:({anchorCell,headCell})=>({state,dispatch})=>{try{if(dispatch)dispatch(state.tr.setSelection(CellSelection.create(state.doc,anchorCell,headCell)));return true;}catch{return false;}},
  goToNextCell:()=>props=>applyTableCommand(goToNextCell(1),props)
 };},
 addProseMirrorPlugins(){return [columnResizing({cellMinWidth:40}),tableEditing()];},
 addKeyboardShortcuts(){return {Tab:()=>{if(this.editor.commands.goToNextCell())return true;if(this.editor.commands.addRowAfter())return this.editor.commands.goToNextCell();return false;},'Shift-Tab':()=>goToNextCell(-1)(this.editor.state,this.editor.view.dispatch)};}
});
const TableRow=Node.create({name:'tableRow',content:'(tableCell | tableHeader)+',parseHTML(){return [{tag:'tr'}];},renderHTML(){return ['tr',0];}});
function validSpan(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=1000?n:1;}
function cell(name,tag){return Node.create({name,content:'block+',isolating:true,
 addAttributes(){return {colspan:{default:1,parseHTML:e=>validSpan(e.getAttribute('colspan'))},rowspan:{default:1,parseHTML:e=>validSpan(e.getAttribute('rowspan'))},colwidth:{default:null,parseHTML:e=>{const a=e.getAttribute('data-colwidth'),widths=a?a.split(',').map(Number):null;return widths&&widths.length===validSpan(e.getAttribute('colspan'))&&widths.every(n=>Number.isInteger(n)&&n>=0&&n<=10000)?widths:null;},renderHTML:a=>a.colwidth?{'data-colwidth':a.colwidth.join(',')}:{}},backgroundColor:{default:null,parseHTML:e=>e.style.backgroundColor||null,renderHTML:a=>a.backgroundColor?{style:'background-color:'+a.backgroundColor}:{}}};},
 parseHTML(){return [{tag}];},renderHTML({HTMLAttributes}){return [tag,mergeAttributes(HTMLAttributes),0];}
});}
export const TableExtensions=[Table,TableRow,cell('tableCell','td'),cell('tableHeader','th')];
