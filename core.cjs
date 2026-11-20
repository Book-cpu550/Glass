const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function filename(title) {
  let name = String(title).replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 100) || 'Untitled';
  if (/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name)) name = '_' + name;
  return name;
}
function validateNote(note) {
  if (!note || typeof note.id!=='string' || !/^[a-zA-Z0-9-]{1,80}$/.test(note.id) || typeof note.title !== 'string' || !Array.isArray(note.blocks)) throw Error('Invalid note');
  if(note.notebookId!==undefined&&(typeof note.notebookId!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(note.notebookId)))throw Error('Invalid notebook ID');
  if(note.folder!==undefined&&(typeof note.folder!=='string'||note.folder.length>200||note.folder.split('/').some(p=>p==='..')))throw Error('Invalid note folder');
  if(note.tags!==undefined&&(!Array.isArray(note.tags)||note.tags.length>30||note.tags.some(t=>typeof t!=='string'||t.length>50)))throw Error('Invalid note tags');
  if(note.pinned!==undefined&&typeof note.pinned!=='boolean')throw Error('Invalid pin');
  if(note.citations!==undefined&&(!Array.isArray(note.citations)||note.citations.length>500||note.citations.some(c=>!c||typeof c.id!=='string'||typeof c.title!=='string'||!['book','website','journal','chapter'].includes(c.type)||Object.values(c).some(v=>typeof v!=='string'&&typeof v!=='boolean')||JSON.stringify(c).length>20000)))throw Error('Invalid saved citations');
  if(note._summary)throw Error('Load the full note before saving.');
  if (note.blocks.some(b => !b || !['text','math','drawing'].includes(b.type) || typeof b.value !== 'string'||b.type==='drawing'&&!/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/=]*$/.test(b.value))) throw Error('Invalid block');
  if(note.title.length>5000)throw Error('Document names must be under 5,000 characters.');
  if (JSON.stringify(note).length > 30e6) throw Error('Note is too large (30 MB limit).');
  return note;
}
function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const temp = file + '.' + crypto.randomUUID() + '.tmp';
  try{fs.writeFileSync(temp, content, 'utf8');fs.renameSync(temp, file);}
  finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
module.exports={filename,validateNote,atomicWrite};
