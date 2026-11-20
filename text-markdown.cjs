function escapeText(text){return text.replace(/[&<>\\`*_$\[\]#!~|=%^]/g,char=>char==='&'?'&amp;':char==='<'?'&lt;':char==='>'?'&gt;':'\\'+char).replace(/^([ \t]*\d+)([.)])(?=\s|$)/gm,'$1\\$2').replace(/^([ \t]*)([-+])(?=\s|$|[-+]{2})/gm,'$1\\$2');}
function codeSpan(text){const runs=text.match(/`+/g)||[],fence='`'.repeat(Math.max(0,...runs.map(run=>run.length))+1),pad=text.startsWith('`')||text.endsWith('`')||(/^ .* $/.test(text)&&text.trim())?' ':'';return fence+pad+text+pad+fence;}
function codeBlock(text,language=''){const fence='`'.repeat(Math.max(2,...(text.match(/`+/g)||[]).map(run=>run.length))+1);return fence+language+'\n'+text+'\n'+fence;}
module.exports={escapeText,codeSpan,codeBlock};
