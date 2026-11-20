(()=>{
 // A focused, closed native select can swallow the wheel, even when it has no
 // options. Route that gesture to its dialog without changing the chosen value.
 document.addEventListener('wheel',event=>{if(event.ctrlKey||event.defaultPrevented||!event.deltaY)return;const target=event.target.closest?.('select,input[type="number"]'),dialog=target?.closest('dialog[open]');if(!dialog)return;if(target.tagName==='SELECT'&&target.matches(':open'))return;if(dialog.scrollHeight<=dialog.clientHeight+1)return;event.preventDefault();dialog.scrollBy({top:event.deltaY*(event.deltaMode===1?18:event.deltaMode===2?dialog.clientHeight:1),behavior:'instant'});},{passive:false});
 document.addEventListener('keydown',event=>{const dialog=event.target.closest?.('dialog[open]');if(!dialog||!['PageDown','PageUp'].includes(event.key)||event.target.matches('textarea,[contenteditable="true"]'))return;event.preventDefault();dialog.scrollBy({top:(event.key==='PageDown'?1:-1)*dialog.clientHeight*.8,behavior:'instant'});});
})();
