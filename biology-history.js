(function(root){
 const graphics=typeof module!=='undefined'&&module.exports?require('./biology-graphics.js'):root.BiologyGraphics;
 const clone=x=>structuredClone(x);
 class History{
  constructor(state,saved){this.current=clone(state);this.past=[];this.future=[];this.key=null;this.time=0;if(saved){try{const decoded=History.decode(saved,state);this.past=decoded.past;this.future=decoded.future;}catch{}}}
  record(state,key=null,now=Date.now()){if(JSON.stringify(state)===JSON.stringify(this.current))return false;if(!key||key!==this.key||now-this.time>700)this.past.push(this.current);this.past=this.past.slice(-60);this.current=clone(state);this.future=[];this.key=key;this.time=now;return true;}
  undo(){if(!this.past.length)return null;this.future.push(this.current);this.current=this.past.pop();this.key=null;return clone(this.current);}
  redo(){if(!this.future.length)return null;this.past.push(this.current);this.current=this.future.pop();this.key=null;return clone(this.current);}
  export(){let past=this.past.slice(),future=this.future.slice();for(;;){const images=[],states=list=>list.map(state=>{const copy={...state};if(copy.image){if(copy.image.data===this.current.image?.data)copy.image={ref:-1};else{let i=images.findIndex(x=>x.data===copy.image.data);if(i<0)i=images.push(copy.image)-1;copy.image={ref:i};}}return copy;});const result={past:states(past),future:states(future),images};if(JSON.stringify(result).length<=6e6)return result;if(past.length)past.shift();else if(future.length)future.shift();else return {past:[],future:[],images:[]};}}
  static decode(saved,current){if(!saved||!Array.isArray(saved.past)||!Array.isArray(saved.future)||saved.past.length+saved.future.length>120||!Array.isArray(saved.images)||saved.images.length>120||JSON.stringify(saved).length>6e6)throw Error('Invalid biology undo history.');const decode=list=>list.map(state=>{const copy=clone(state);if(copy.image){const ref=copy.image.ref;if(!Number.isInteger(ref)||ref < -1||ref>=saved.images.length)throw Error('Invalid biology history image.');copy.image=clone(ref===-1?current.image:saved.images[ref]);if(!copy.image)throw Error('Missing biology history image.');}return graphics.validate(copy);});return {past:decode(saved.past),future:decode(saved.future)};}
 }
 if(typeof module!=='undefined'&&module.exports)module.exports=History;else root.BiologyHistory=History;
})(typeof globalThis!=='undefined'?globalThis:this);
