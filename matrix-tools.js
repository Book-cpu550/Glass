(function(root){
 function matrix(input){const match=/^\s*(\d{1,2})\s*[x×]\s*(\d{1,2})\s*$/i.exec(input);if(!match)throw Error('Enter rows × columns, such as 5x4 or 3x3.');const rows=Number(match[1]),columns=Number(match[2]);if(rows<1||rows>20||columns<1||columns>20)throw Error('Choose between 1 and 20 rows and columns.');return {rows,columns,latex:'\\begin{pmatrix}'+Array.from({length:rows},()=>Array(columns).fill('\\placeholder{}').join(' & ')).join(' \\\\ ')+'\\end{pmatrix}'};}
 if(typeof module!=='undefined'&&module.exports)module.exports=matrix;else root.matrixTemplate=matrix;
})(typeof globalThis!=='undefined'?globalThis:this);
