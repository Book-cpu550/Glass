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
const {NoteIndex}=require('./note-index.cjs'),{Backups}=require('./backups.cjs');
let catalog,backupStore,autoBackupTimer;
function index(){return catalog||=new NoteIndex(app.getPath('userData'),book());}
function backups(){return backupStore||=new Backups(app.getPath('userData'));}
function backupDirectory(){return config().backupDirectory||dataPath('backups');}
function scheduleBackup(){if(testMode)return;clearTimeout(autoBackupTimer);autoBackupTimer=setTimeout(()=>{try{const settings=config(),now=Date.now();if(settings.autoBackup!==false&&now-(settings.lastBackup||0)>30*60*1000){backups().create(backupDirectory(),{reason:'automatic'});setConfig({...settings,lastBackup:now});const automatic=backups().list(backupDirectory()).filter(item=>item.name.startsWith('Glass-automatic-')).slice(14);for(const item of automatic)fs.unlinkSync(path.join(backupDirectory(),item.name));}}catch(error){if(win&&!win.isDestroyed())win.webContents.send('backup-error',error.message);}},15000);autoBackupTimer.unref();}

let sharingService;
function sharing(){return sharingService||=new (require('./collaboration.cjs').Sharing)(app.getPath('userData'),{emit:message=>{if(win&&!win.isDestroyed())win.webContents.send('sharing-event',message);},protect:value=>{const {safeStorage}=require('electron');if(!safeStorage.isEncryptionAvailable())throw Error('Secure local credential storage is unavailable');return safeStorage.encryptString(value).toString('base64');},unprotect:value=>require('electron').safeStorage.decryptString(Buffer.from(value,'base64'))});}
function sharingSettings(){const {safeStorage}=require('electron');return new (require('./sharing-settings.cjs').SharingSettings)(app.getPath('userData'),{protect:value=>{if(!safeStorage.isEncryptionAvailable())throw Error('Secure credential storage is unavailable.');return safeStorage.encryptString(value).toString('base64');},unprotect:value=>safeStorage.decryptString(Buffer.from(value,'base64'))});}
let accountService;function accountServer(){try{return sharingSettings().status().server||readJson(path.join(__dirname,'sharing-defaults.json'),{}).server||'';}catch{return '';}}
function accounts(){return accountService||=new (require('./accounts.cjs').Accounts)(app.getPath('userData'),{server:accountServer,fetcher:(...args)=>net.fetch(...args),protect:value=>{const {safeStorage}=require('electron');if(!safeStorage.isEncryptionAvailable())throw Error('Secure session storage is unavailable');return safeStorage.encryptString(value).toString('base64');},unprotect:value=>require('electron').safeStorage.decryptString(Buffer.from(value,'base64'))});}
handle('accountStatus',()=>accounts().status());
handle('accountLogin',input=>accounts().login(input));
handle('accountLogout',all=>accounts().logout(!!all));
handle('accountDocuments',()=>accounts().list());
handle('accountDocument',room=>accounts().document(room));
handle('accountRemember',input=>{const note=book().read(input.noteId);return accounts().remember({...input,title:note.title});});
handle('accountDelete',password=>accounts().delete(password));
handle('accountForget',room=>accounts().forget(room));
handle('shareServiceStatus',()=>sharingSettings().status());
handle('shareServiceSave',input=>sharingSettings().save(input));
handle('shareForget',id=>{if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Invalid note');const file=dataPath('sharing-credentials/'+id+'.json');if(fs.existsSync(file))fs.unlinkSync(file);return true;});
handle('shareHost',async input=>{book().read(input.noteId);if(!input.server&&!input.localOnly){const session=accounts().load(),service=session&&session.expires>Date.now()?{server:session.server,accountToken:session.token}:sharingSettings().read();if(!service)throw Error('Set up the internet sharing service first, or explicitly choose local-network-only sharing.');input={...input,...service};}return sharing().host(input);});
handle('shareJoin',input=>{book().read(input.noteId);return sharing().connect(input);});
handle('shareSend',input=>sharing().send(input));
handle('shareState',input=>sharing().saveState(input));
handle('shareSaved',id=>sharing().saved(id));
handle('shareDisconnect',id=>sharing().disconnect(id));
handle('shareRevoke',id=>sharing().revoke(id));
handle('shareCopy',text=>{require('./collaboration.cjs').decodeInvite(text);clipboard.writeText(text);return true;});
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
  try{const value=readJson(dataPath('settings.json'),{});if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid settings');const local={};for(const key of ['pdfDirectory','backupDirectory'])if(typeof value[key]==='string')local[key]=value[key];if(typeof value.autoBackup==='boolean')local.autoBackup=value.autoBackup;if(Number.isFinite(value.lastBackup))local.lastBackup=value.lastBackup;if(JSON.stringify(value)!==JSON.stringify(local))setConfig(local);return local;}
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
  const warnings=[...startupWarnings],notes=index().list(warnings);
  const collection=notebooks().read(notes);if(collection.warning)warnings.push(collection.warning);
  return {notes,settings,warnings,collection};
});
handle('updateNotebooks',input=>notebooks().update(input));
handle('backupStatus',()=>({directory:backupDirectory(),automatic:config().autoBackup!==false,backups:backups().list(backupDirectory()),version:app.getVersion()}));
handle('chooseBackupFolder',async()=>{const result=await dialog.showOpenDialog(win,{title:'Choose local backup folder',properties:['openDirectory','createDirectory']});if(result.canceled)return null;const selected=path.resolve(result.filePaths[0]);if(selected===path.resolve(app.getPath('userData'))||selected.startsWith(path.resolve(app.getPath('userData'))+path.sep))throw Error('Choose a folder outside Glass’s data folder.');setConfig({...config(),backupDirectory:selected});return selected;});
handle('setAutomaticBackups',value=>{if(typeof value!=='boolean')throw Error('Invalid backup preference');setConfig({...config(),autoBackup:value});return true;});
handle('createBackup',async notebookId=>{if(notebookId&&!notebooks().read().notebooks.some(n=>n.id===notebookId))throw Error('Unknown notebook');return backups().create(backupDirectory(),{notebookId});});
handle('exportBackup',async notebookId=>{const result=await dialog.showSaveDialog(win,{title:'Export portable notebook backup',defaultPath:'Glass-notebooks.glassbackup',filters:[{name:'Glass notebook backup',extensions:['glassbackup']}]});if(result.canceled)return null;const temporary=backups().create(backupDirectory(),{notebookId});atomicWrite(result.filePath,fs.readFileSync(temporary.file));return result.filePath;});
handle('restoreBackup',async name=>{let file;if(name){if(typeof name!=='string'||path.basename(name)!==name||!backups().list(backupDirectory()).some(b=>b.name===name))throw Error('Unknown backup');file=path.join(backupDirectory(),name);}else{const selected=await dialog.showOpenDialog(win,{title:'Restore Glass backup',properties:['openFile'],filters:[{name:'Glass backup',extensions:['glassbackup']}]});if(selected.canceled)return null;file=selected.filePaths[0];}const contents=backups().inspect(file);const result=await dialog.showMessageBox(win,{type:'question',title:'Restore backup?',message:'Restore '+contents.entries.length+' local files?',detail:'Matching saved files will be restored. Current files are backed up first so you can undo this restore. Other notes remain available.',buttons:['Cancel','Restore'],defaultId:0,cancelId:0});if(result.response!==1)return null;const restored=backups().restore(file,backupDirectory());catalog=null;collections=null;localLibrary=null;return restored;});
handle('openBackupFolder',()=>shell.openPath(backupDirectory()));
handle('checkUpdates',async()=>require('./updates.cjs').check(app.getVersion(),(...args)=>net.fetch(...args)));
handle('downloadUpdate',async()=>require('./updates.cjs').download(app.getVersion(),dataPath('updates'),(...args)=>net.fetch(...args)));
handle('runUpdate',async()=>{const file=require('./updates.cjs').ready();if(!file)throw Error('Download and verify an update first.');backups().create(backupDirectory(),{reason:'before-update'});const result=await dialog.showMessageBox(win,{type:'question',title:'Install Glass update?',message:'Close Glass and launch the verified installer?',detail:'A local backup has been created. Your notebooks are kept separately from the application.',buttons:['Cancel','Install update'],defaultId:0,cancelId:0});if(result.response!==1)return false;await shell.openPath(file);return true;});

handle('getNote',id=>book().read(id));
handle('save',note=>{if(!notebooks().read().notebooks.some(n=>n.id===(note.notebookId||'personal')))throw Error('Unknown notebook');const saved=book().save(note);index().update(saved);scheduleBackup();return true;});
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
handle('exportPDF',async (note,printOptions={})=>{
 validateNote(note);if(exportingPDF)throw Error('A PDF export is already running.');exportingPDF=true;
 try{const settings=config(),name=filename(note.title.replace(/\.pdf$/i,''))+'.pdf';const result=await dialog.showSaveDialog(win,{title:'Export document as PDF',defaultPath:settings.pdfDirectory?path.join(settings.pdfDirectory,name):name,filters:[{name:'PDF document',extensions:['pdf']}]});if(result.canceled)return null;
  const file=/\.pdf$/i.test(result.filePath)?result.filePath:result.filePath+'.pdf';const bytes=await require('./pdf-export.cjs').createPDF(note,printOptions);await require('./pdf-export.cjs').writePDF(file,bytes);setConfig({...settings,pdfDirectory:path.dirname(file)});return file;
 }finally{exportingPDF=false;}
});
handle('previewPDF',async(note,printOptions={})=>{validateNote(note);const bytes=await require('./pdf-export.cjs').createPDF(note,printOptions),file=path.join(app.getPath('temp'),'Glass-preview-'+crypto.randomUUID()+'.pdf');atomicWrite(file,bytes);const preview=new BrowserWindow({parent:win,width:1000,height:800,title:'Glass print preview',webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,plugins:true}});preview.webContents.setWindowOpenHandler(()=>({action:'deny'}));preview.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('file:'))event.preventDefault();});preview.on('closed',()=>{fs.promises.unlink(file).catch(()=>{});});await preview.loadFile(file);return true;});
async function importPDF(file){const worker=new BrowserWindow({show:false,webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,backgroundThrottling:false}});let timer;worker.webContents.on('console-message',(_event,level,message)=>console.log('PDF importer:',message));worker.webContents.on('render-process-gone',(_event,details)=>console.error('PDF importer stopped',details.reason));try{await worker.loadFile(path.join(__dirname,'pdf-import.html'));return await Promise.race([(async()=>{for(let i=0;i<100;i++){if(await worker.webContents.executeJavaScript('typeof window.extractPDF==="function"'))break;await new Promise(r=>setTimeout(r,50));}return await worker.webContents.executeJavaScript('window.extractPDF('+JSON.stringify(fs.readFileSync(file).toString('base64'))+')');})(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('PDF import timed out. Try a smaller file.')),120000))]);}finally{clearTimeout(timer);worker.destroy();}}
handle('importFile',async()=>{const result=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'PDF, Markdown or LaTeX',extensions:['pdf','md','tex','txt']}]});if(result.canceled)return null;const file=result.filePaths[0];if(fs.statSync(file).size>40e6)throw Error('Choose a file smaller than 40 MB.');const title=path.basename(file,path.extname(file));if(path.extname(file).toLowerCase()==='.pdf')return {title,kind:'pdf',...await importPDF(file)};if(fs.statSync(file).size>5e6)throw Error('Text import is limited to 5 MB.');return {title,content:fs.readFileSync(file,'utf8')};});
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
const mathReference=require('./theorem-data.js'),chemReference=require('./chemistry-data.js'),bioReference=require('./biology-data.js'),physicsReference=require('./physics-data.js'),reference={entries:[...mathReference.entries,...chemReference.entries,...bioReference.entries,...physicsReference.entries],sources:{...mathReference.sources,...chemReference.sources,...bioReference.sources,...physicsReference.sources}},libraryAI=require('./library-ai.cjs');
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
 const query=input.query.trim(),subject=input.subject==='physics'?'physics':input.subject==='biology'?'biology':input.subject==='chemistry'?'chemistry':'math';let page=null;
 if(/^https?:/i.test(query))page=await libraryAI.fetchPage(query,(...args)=>net.fetch(...args));
 const result=await ai.runAI({workspace:dataPath('ai-work'),prompt:libraryAI.prompt(query,page,subject),responseSchema:libraryAI.schema,validateResult:result=>libraryAI.validate(result,subject)});
 if(!result.entries.length)throw Error(result.summary||'The source did not contain a usable mathematical entry. Try a specific name.');
 return {summary:result.summary,entries:result.entries.map(entry=>({...entry,subject,origin:'AI-assisted',sourceUrl:page?.url||'',sourceTitle:page?'User-provided source page':'AI draft by name — add a source if available'}))};
});
async function lookupCitationData(input){const doi=String(input||'').trim().replace(/^https?:\/\/(?:dx\.)?doi.org\//i,'');if(!/^10\.\d{4,9}\/[^\s]{1,300}$/i.test(doi))throw Error('Enter a DOI beginning with 10.');const response=await net.fetch('https://api.crossref.org/works/'+encodeURIComponent(doi),{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Crossref did not find this DOI. Enter the source details manually.');const text=await response.text();if(text.length>2e6)throw Error('Citation metadata is too large.');const data=JSON.parse(text).message||{},plain=value=>String(value||'').replace(/<[^>]*>/g,'').slice(0,2000),date=data.published?.['date-parts']?.[0]||data.issued?.['date-parts']?.[0]||[];return {type:data.type==='book'?'book':data.type==='book-chapter'?'chapter':'journal',title:plain(data.title?.[0]),authors:(data.author||[]).slice(0,20).map(a=>plain(a.family)+(a.given?', '+plain(a.given):'')).join('; '),container:plain(data['container-title']?.[0]),volume:plain(data.volume),issue:plain(data.issue),pages:plain(data.page),publisher:plain(data.publisher),date:date.length===3?date[2]+' '+['Jan.','Feb.','Mar.','Apr.','May','June','July','Aug.','Sept.','Oct.','Nov.','Dec.'][date[1]-1]+' '+date[0]:String(date[0]||''),doi:plain(data.DOI||doi),url:''};}
handle('lookupCitation',lookupCitationData);
function citationDraftPath(id){if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Invalid note');return dataPath('citation-drafts/'+id+'.json');}
handle('getCitationDraft',id=>{try{return readJson(citationDraftPath(id),null);}catch{return null;}});
handle('saveCitationDraft',input=>{if(!input||!input.entry||JSON.stringify(input).length>100000)throw Error('Citation draft is too large.');atomicWrite(citationDraftPath(input.noteId),JSON.stringify(input));return true;});
handle('lookupCitationURL',async input=>{const result=await require('./citation-metadata.cjs').fromURL(input,(...args)=>net.fetch(...args));if(result.entry.doi){try{const extra=await lookupCitationData(result.entry.doi);for(const [key,value]of Object.entries(extra))if(value&&key!=='url')result.entry[key]=value;}catch{result.warnings.push('DOI enrichment was unavailable; page metadata is shown.');}}result.missing=['authors','title','date'].filter(key=>!result.entry[key]);return result;});
handle('aiStatus',()=>ai.status());
handle('askAI',async({note,prompt,history})=>{validateNote(note);if(typeof prompt!=='string'||prompt.length>20000||!prompt.trim())throw Error('Enter a question (up to 20,000 characters).');if(!Array.isArray(history)||JSON.stringify(history).length>100000)throw Error('Conversation is too long. Start a new conversation.');return ai.runAI({workspace:dataPath('ai-work'),prompt:ai.chatPrompt(note,prompt,history)});});
handle('cancelAI',()=>{ai.cancel();return true;});
let grammarWorker,grammarId=0;const grammarRequests=new Map();
function offlineGrammar(action,payload={}){if(!grammarWorker){grammarWorker=require('electron').utilityProcess.fork(path.join(__dirname,'grammar-worker.cjs'),[dataPath('personal-dictionary.json')],{stdio:'ignore',serviceName:'Glass offline spelling'});grammarWorker.on('message',message=>{const request=grammarRequests.get(message.id);if(!request)return;clearTimeout(request.timer);grammarRequests.delete(message.id);message.error?request.reject(Error(message.error)):request.resolve(message.result);});grammarWorker.on('exit',()=>{grammarWorker=null;for(const request of grammarRequests.values()){clearTimeout(request.timer);request.reject(Error('Offline spelling stopped. Try again.'));}grammarRequests.clear();});}return new Promise((resolve,reject)=>{const id=++grammarId,timer=setTimeout(()=>{grammarRequests.delete(id);reject(Error('The offline review took too long. Check a smaller selection.'));},30000);grammarRequests.set(id,{resolve,reject,timer});grammarWorker.postMessage({id,action,...payload});});}
handle('offlineReview',segments=>offlineGrammar('check',{segments}));
handle('personalDictionary',word=>offlineGrammar(word?'add':'words',{word}));
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
  win=new BrowserWindow({width:1320,height:900,minWidth:930,minHeight:640,title:'Glass',icon:path.join(__dirname,'assets/glass.png'),backgroundColor:'#f7f6f2',webPreferences:{preload:path.join(__dirname,'preload.cjs'),spellcheck:false,nodeIntegration:false,contextIsolation:true,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  win.loadFile(path.join(__dirname,'index.html')).catch(()=>{if(!win.isDestroyed())dialog.showErrorBox('Glass could not open','The notebook window could not load. Close and reopen Glass. Your saved notes remain on this computer.');});
});
app.on('window-all-closed',()=>{sharingService?.close();grammarWorker?.kill();ai.cancel();chemistry.cancel();for(const file of photos.values()){try{fs.unlinkSync(file);}catch{}}app.quit();});
