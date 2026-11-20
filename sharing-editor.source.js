import * as Y from 'yjs';
import {Awareness,encodeAwarenessUpdate,applyAwarenessUpdate,removeAwarenessStates} from 'y-protocols/awareness';
import {prosemirrorJSONToYDoc,yDocToProsemirrorJSON,yCursorPlugin,ySyncPluginKey} from '@tiptap/y-tiptap';
import {Extension} from '@tiptap/core';
import {Plugin} from '@tiptap/pm/state';
function encode(bytes){let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text);}
const decode=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
export const Shared={create:(schema,json)=>json?prosemirrorJSONToYDoc(schema,json,'default'):new Y.Doc(),encodeUpdate:encode,encode:doc=>encode(Y.encodeStateAsUpdate(doc)),apply:(doc,data,origin)=>Y.applyUpdate(doc,decode(data),origin),json:doc=>yDocToProsemirrorJSON(doc,'default'),Awareness,awarenessEncode:(a,ids)=>encode(encodeAwarenessUpdate(a,ids)),awarenessApply:(a,data,origin)=>applyAwarenessUpdate(a,decode(data),origin),removeAwareness:(a,ids,origin)=>removeAwarenessStates(a,ids,origin)};
const cursorColor=user=>/^#[a-f0-9]{6}$/i.test(user?.color||'')?user.color:'#4a82b1';
export function cursorExtension(record){return Extension.create({name:'sharedCursors',addProseMirrorPlugins(){const plugins=[yCursorPlugin(record.awareness,{selectionBuilder(user){return {class:'ProseMirror-yjs-selection',style:'background-color: '+cursorColor(user)+'33'};},cursorBuilder(user){const cursor=document.createElement('span');cursor.className='ProseMirror-yjs-cursor';const color=cursorColor(user);cursor.style.borderColor=color;const label=document.createElement('span');label.textContent=String(user?.name||'Collaborator').slice(0,32);label.style.background=color;cursor.append(label);return cursor;}})];if(record.role==='view')plugins.push(new Plugin({filterTransaction:transaction=>!transaction.docChanged||!!transaction.getMeta(ySyncPluginKey)}));return plugins;}});}
