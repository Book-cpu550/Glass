const fs=require('node:fs'),path=require('node:path');
// MathLive treats accents as one mouse-selection target by default. Let its
// existing hit-testing reach the editable body, just as it does in fractions.
const source=fs.readFileSync(path.join(__dirname,'node_modules/mathlive/mathlive.min.js'),'utf8');
const accent=/type:"accent",body:[\s\S]{0,300}?this\.captureSelection=!0/g;
const matches=[...source.matchAll(accent)];
if(matches.length!==1)throw Error('MathLive accent constructor changed. Review the editable-accent patch before building.');
const patched=source.replace(accent,match=>match.replace('this.captureSelection=!0','this.captureSelection=!1').replace('this.skipBoundary=!0','this.skipBoundary=!1'));
fs.mkdirSync(path.join(__dirname,'vendor'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'vendor/mathlive.min.js'),'/* Mathdesk: allow mouse editing inside accent bodies. See build-mathlive.cjs. */\n'+patched);
