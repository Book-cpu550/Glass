const {app, BrowserWindow, ipcMain, dialog, shell, Menu, clipboard, nativeImage, net} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {fileURLToPath} = require('node:url');
const {validateNote, atomicWrite, filename} = require('./core.cjs');
const ai=require('./ai.cjs');
const crypto=require('node:crypto');
const photos=new Map();
const {Notebook}=require('./notebook.cjs');
let notebook;
const {Notebooks}=require('./notebooks.cjs');
let collections;function notebooks(){return collections||=new Notebooks(app.getPath('userData'));}
function book(){return notebook||=new Notebook(app.getPath('userData'));}
let win;
const startupWarnings=[];
const testMode = process.argv.includes('--smoke-test');
app.setName('Glass');
if(!testMode){
 const local=path.join(app.getPath('appData'),'Glass'),legacy=path.join(app.getPath('appData'),'Mathdesk');
 require('./migrate.cjs').migrate(local,legacy);
 app.setPath('userData',local);app.setAppUserModelId('com.glass.notebook');
}
if (testMode) app.setPath('userData', process.env.MATHDESK_TEST_DATA || path.join(app.getPath('temp'),'mathdesk-smoke'));
if (!testMode && !app.requestSingleInstanceLock()) app.quit();
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.show();win.focus();}});
function dataPath(name) { return path.join(app.getPath('userData'),name); }
function readJson(file, fallback) { if (!fs.existsSync(file)) return fallback; return JSON.parse(fs.readFileSync(file,'utf8')); }
function config() {
  try{const value=readJson(dataPath('settings.json'),{});if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid settings');const local=typeof value.pdfDirectory==='string'?{pdfDirectory:value.pdfDirectory}:{};if(JSON.stringify(value)!==JSON.stringify(local))setConfig(local);return local;}
  catch{
    const file=dataPath('settings.json');
    if(fs.existsSync(file))fs.copyFileSync(file,dataPath(`settings-unreadable-${Date.now()}.json`));
    atomicWrite(file,'{}');startupWarnings.push('Settings could not be read. A backup was kept; default settings were restored.');return {};
  }
}
function setConfig(value) { atomicWrite(dataPath('settings.json'), JSON.stringify(value,null,2)); }
function handle(name,fn) {ipcMain.handle(name, async(event,...args)=>{
  if (event.sender !== win.webContents || !event.senderFrame || fileURLToPath(event.senderFrame.url) !== path.join(__dirname,'index.html')) throw Error('Untrusted request');
  return fn(...args);
});}
handle('load',()=>{
  const settings=config();
  const folder=dataPath('notes');fs.mkdirSync(folder,{recursive:true});
  const notes=[],warnings=[...startupWarnings];
  for(const name of fs.readdirSync(folder).filter(f=>f.endsWith('.json'))){
    try{
      const note=book().read(path.basename(name,'.json'),warnings);
      notes.push(note);
    }catch{warnings.push(`Could not read ${name}. The file was left untouched; other notes are available.`);}
  }
  const collection=notebooks().read(notes);if(collection.warning)warnings.push(collection.warning);
  return {notes,settings,warnings,collection};
});
handle('updateNotebooks',input=>notebooks().update(input));
handle('save',note=>{if(!notebooks().read().notebooks.some(n=>n.id===(note.notebookId||'personal')))throw Error('Unknown notebook');book().save(note);return true;});
const chemistry=require('./chemistry.cjs');
handle('buildChemistry',data=>chemistry.build(data,app.getPath('userData'),(...args)=>net.fetch(...args)));
handle('makeChemistry3D',data=>chemistry.run('conformer',data));
handle('cancelChemistry',()=>{chemistry.cancel();return true;});
handle('loadBiologyToolsDraft',()=>{try{return readJson(dataPath('biology-tools-draft.json'),null);}catch{return null;}});
handle('saveBiologyToolsDraft',data=>{if(!data||typeof data!=='object'||JSON.stringify(data).length>350000)throw Error('Biology tool inputs are too large.');atomicWrite(dataPath('biology-tools-draft.json'),JSON.stringify(data));return true;});
handle('pickBiologyImage',async()=>{const result=await dialog.showOpenDialog(win,{title:'Choose a microscope image or biology figure',properties:['openFile'],filters:[{name:'Images',extensions:['png','jpg','jpeg','webp','bmp']}]});if(result.canceled)return null;const file=result.filePaths[0];if(fs.statSync(file).size>20e6)throw Error('Choose an image smaller than 20 MB.');let image=nativeImage.createFromPath(file);if(image.isEmpty())throw Error('This image could not be read.');const size=image.getSize();if(size.width>1600||size.height>1600)image=image.resize(size.width>=size.height?{width:1600}:{height:1600});return {data:'data:image/jpeg;base64,'+image.toJPEG(88).toString('base64'),...image.getSize()};});
function drawingDraftPath({id,key}){if(typeof id!=='string'||typeof key!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id)||!(/^(new|[a-f0-9]{64})$/).test(key))throw Error('Invalid drawing draft');return dataPath(`drawing-drafts/${id}-${key}.json`);}
handle('loadDrawingDraft',input=>{const file=drawingDraftPath(input);if(!fs.existsSync(file))return null;try{const recovered=require('./drawing-data.cjs').recoverDraft(JSON.parse(fs.readFileSync(file,'utf8')));if(recovered.recoveryWarning)book().preserve(file);return recovered;}catch{book().preserve(file);return {warning:'This drawing draft could not be read. Its original file was backed up; the saved drawing is available.'};}});
handle('saveDrawingDraft',input=>{const file=drawingDraftPath(input),data=require('./drawing-data.cjs').validateDraft(input.data);atomicWrite(file,JSON.stringify(data));return true;});
handle('deleteDrawingDraft',input=>{const file=drawingDraftPath(input);if(fs.existsSync(file))fs.unlinkSync(file);return true;});
handle('listVersions',id=>book().versions(id).map(name=>({name,date:new Date(Number(name.split('-')[0])).toISOString()})));
handle('restoreVersion',({id,name})=>book().restoreVersion(id,name));
handle('listArchive',()=>{const folder=dataPath('archive');if(!fs.existsSync(folder))return [];return fs.readdirSync(folder).filter(n=>n.endsWith('.json')).flatMap(name=>{try{const note=validateNote(readJson(path.join(folder,name)));return [{id:note.id,title:note.title,updated:note.updated}];}catch{return [];}});});
handle('restoreArchive',id=>{if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Invalid ID');const file=dataPath(`archive/${id}.json`),note=validateNote(readJson(file));if(fs.existsSync(book().file(id)))note.id=crypto.randomUUID();note.updated=new Date().toISOString();book().save(note);fs.unlinkSync(file);return note;});
let exportingPDF=false;
handle('exportPDF',async note=>{
 validateNote(note);if(exportingPDF)throw Error('A PDF export is already running.');exportingPDF=true;
 try{const settings=config(),name=filename(note.title.replace(/\.pdf$/i,''))+'.pdf';const result=await dialog.showSaveDialog(win,{title:'Export document as PDF',defaultPath:settings.pdfDirectory?path.join(settings.pdfDirectory,name):name,filters:[{name:'PDF document',extensions:['pdf']}]});if(result.canceled)return null;
  const file=/\.pdf$/i.test(result.filePath)?result.filePath:result.filePath+'.pdf';const bytes=await require('./pdf-export.cjs').createPDF(note);await require('./pdf-export.cjs').writePDF(file,bytes);setConfig({pdfDirectory:path.dirname(file)});return file;
 }finally{exportingPDF=false;}
});
handle('importFile',async()=>{const result=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Markdown or LaTeX',extensions:['md','tex','txt']}]});if(result.canceled)return null;const file=result.filePaths[0];if(fs.statSync(file).size>5e6)throw Error('File is too large');return {title:path.basename(file,path.extname(file)),content:fs.readFileSync(file,'utf8')};});
handle('archive',id=>{if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Invalid ID');const file=dataPath(`notes/${id}.json`);fs.mkdirSync(dataPath('archive'),{recursive:true});fs.renameSync(file,dataPath(`archive/${id}.json`));return true;});
handle('deleteNote',async id=>{
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Invalid note ID');
  const file=dataPath(`notes/${id}.json`);
  const note=validateNote(readJson(file));
  const result=await dialog.showMessageBox(win,{
    type:'warning',title:'Delete note?',
    message:`Delete “${note.title || 'Untitled note'}”?`,
    detail:'This local note will move to the Windows Recycle Bin.',
    buttons:['Cancel','Delete note'],defaultId:0,cancelId:0,noLink:true
  });
  if(result.response!==1)return false;
  await shell.trashItem(file);
  return true;
});
const {LibraryStore}=require('./library-store.cjs');
const mathReference=require('./theorem-data.js'),chemReference=require('./chemistry-data.js'),bioReference=require('./biology-data.js'),reference={entries:[...mathReference.entries,...chemReference.entries,...bioReference.entries],sources:{...mathReference.sources,...chemReference.sources,...bioReference.sources}},libraryAI=require('./library-ai.cjs');
let localLibrary;function library(){return localLibrary||=new LibraryStore(app.getPath('userData'));}
handle('getLibrary',()=>{try{return {...library().read(),storage:app.getPath('userData')};}catch(error){return {entries:[],favorites:[],storage:app.getPath('userData'),error:error.message};}});
handle('saveLibraryEntry',entry=>library().save(entry));
handle('favoriteLibraryEntry',({id,value})=>library().favorite(id,!!value));
handle('removeLibraryEntry',async id=>{const choice=await dialog.showMessageBox(win,{type:'question',title:'Remove custom entry?',message:'Remove this custom library entry?',detail:'An earlier local library version is kept in library-history.',buttons:['Cancel','Remove entry'],defaultId:0,cancelId:0,noLink:true});if(choice.response===1){library().remove(id);return true;}return false;});
handle('openLibrarySource',async id=>{const entry=[...reference.entries,...library().read().entries].find(item=>item.id===id);if(!entry)throw Error('Unknown entry');const url=entry.source?reference.sources[entry.source]?.url:entry.sourceUrl;if(!url)throw Error('No source link has been provided.');await libraryAI.publicUrl(url);await shell.openExternal(url);return true;});
handle('copyLibraryFormula',id=>{const entry=[...reference.entries,...library().read().entries].find(item=>item.id===id);if(!entry)throw Error('Unknown entry');clipboard.writeText(entry.latex);return true;});
handle('openDataFolder',()=>shell.openPath(app.getPath('userData')));
handle('draftLibraryEntries',async input=>{
 if(!input||typeof input.query!=='string'||!input.query.trim()||input.query.length>2000)throw Error('Enter a reference name or an HTTPS source link.');
 const query=input.query.trim(),subject=input.subject==='biology'?'biology':input.subject==='chemistry'?'chemistry':'math';let page=null;
 if(/^https?:/i.test(query))page=await libraryAI.fetchPage(query,(...args)=>net.fetch(...args));
 const result=await ai.runAI({workspace:dataPath('ai-work'),prompt:libraryAI.prompt(query,page,subject),responseSchema:libraryAI.schema,validateResult:result=>libraryAI.validate(result,subject)});
 if(!result.entries.length)throw Error(result.summary||'The source did not contain a usable mathematical entry. Try a specific name.');
 return {summary:result.summary,entries:result.entries.map(entry=>({...entry,subject,origin:'AI-assisted',sourceUrl:page?.url||'',sourceTitle:page?'User-provided source page':'AI draft by name — add a source if available'}))};
});
handle('aiStatus',()=>ai.status());
handle('askAI',async({note,prompt,history})=>{validateNote(note);if(typeof prompt!=='string'||prompt.length>20000||!prompt.trim())throw Error('Enter a question (up to 20,000 characters).');if(!Array.isArray(history)||JSON.stringify(history).length>100000)throw Error('Conversation is too long. Start a new conversation.');return ai.runAI({workspace:dataPath('ai-work'),prompt:ai.chatPrompt(note,prompt,history)});});
handle('cancelAI',()=>{ai.cancel();return true;});
const grammarCache=new Map();
handle('checkGrammar',async input=>{
  const packet=Array.isArray(input)?require('./grammar-tools.js').pack(input):input;
  if(!packet||!Array.isArray(packet.segments)||!Array.isArray(packet.contexts)||packet.segments.length>10000||JSON.stringify(packet).length>1500000||packet.segments.some(s=>!Number.isInteger(s.id)||typeof s.text!=='string')||packet.contexts.some(c=>typeof c.text!=='string'))throw Error('This document exceeds the grammar check limit. Check a smaller selection.');
  const key=crypto.createHash('sha256').update(JSON.stringify(packet)).digest('hex');if(grammarCache.has(key))return grammarCache.get(key);
  const suggestions=[];
  for(const batch of require('./grammar-tools.js').batches(packet)){
    const result=await ai.runAI({workspace:dataPath('ai-work'),prompt:ai.grammarPrompt(batch),responseSchema:ai.grammarSchema,validateResult:ai.validateGrammarResult});suggestions.push(...result.suggestions);if(suggestions.length>=100)break;
  }
  const result={summary:'AI grammar review',suggestions:suggestions.slice(0,100)};grammarCache.set(key,result);if(grammarCache.size>30)grammarCache.delete(grammarCache.keys().next().value);return result;
});
handle('pickPhoto',async source=>{
  let image,name;
  if(source==='clipboard'){image=clipboard.readImage();name='Pasted photo';if(image.isEmpty())throw Error('Copy an image first, then choose Paste photo.');}
  else{const result=await dialog.showOpenDialog(win,{title:'Choose a photo of notes or a science diagram',properties:['openFile'],filters:[{name:'Images',extensions:['png','jpg','jpeg','webp','bmp']}]});if(result.canceled)return null;const file=result.filePaths[0];if(fs.statSync(file).size>20e6)throw Error('Choose an image smaller than 20 MB.');image=nativeImage.createFromPath(file);name=path.basename(file);if(image.isEmpty())throw Error('This image could not be read. Try PNG or JPEG.');}
  const size=image.getSize();if(size.width>4000||size.height>4000)image=image.resize(size.width>size.height?{width:4000}:{height:4000});
  const id=crypto.randomUUID();const folder=dataPath('photo-cache');fs.mkdirSync(folder,{recursive:true});
  // Keep only the currently selected photo; recognition never scans the user's files.
  for(const old of photos.values()){try{fs.unlinkSync(old);}catch{}}photos.clear();
  const file=path.join(folder,id+'.png');fs.writeFileSync(file,image.toPNG());photos.set(id,file);
  return {id,name,preview:image.resize({width:600}).toDataURL()};
});
handle('recognizePhoto',async id=>{const file=photos.get(id);if(!file)throw Error('Select a photo first.');return ai.runAI({workspace:dataPath('ai-work'),image:file,prompt:ai.photoPrompt()});});
app.whenReady().then(()=>{
  Menu.setApplicationMenu(null);
  win=new BrowserWindow({width:1320,height:900,minWidth:930,minHeight:640,title:'Glass',icon:path.join(__dirname,'assets/glass.png'),backgroundColor:'#f7f6f2',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  win.loadFile(path.join(__dirname,'index.html')).catch(()=>{if(!win.isDestroyed())dialog.showErrorBox('Glass could not open','The notebook window could not load. Close and reopen Glass. Your saved notes remain on this computer.');});
});
app.on('window-all-closed',()=>{ai.cancel();chemistry.cancel();for(const file of photos.values()){try{fs.unlinkSync(file);}catch{}}app.quit();});
