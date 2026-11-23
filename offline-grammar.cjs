const fs=require('node:fs');
const {atomicWrite}=require('./core.cjs');
const common={teh:'the',recieve:'receive',recieved:'received',seperate:'separate',definately:'definitely',occured:'occurred',grammer:'grammar',equivelent:'equivalent',continous:'continuous',differntiable:'differentiable',therefor:'therefore',becuase:'because',woudl:'would',shoudl:'should',adress:'address',accomodate:'accommodate',acheive:'achieve',beleive:'believe',caluclation:'calculation',experiement:'experiment',hypothisis:'hypothesis',mesurement:'measurement',neccessary:'necessary',occurence:'occurrence',relevent:'relevant',thier:'their',wich:'which',wierd:'weird',writting:'writing'};
const rules=[
 [/\b(These|Those) (results|examples|equations|observations|experiments) is\b/gi,m=>m[1]+' '+m[2]+' are','Agreement','Use a plural verb with this plural subject.'],
 [/\b([A-Za-z]{2,}),([A-Za-z]{2,})\b/g,m=>m[1]+', '+m[2],'Punctuation','Add a space after this comma.'],
 [/\b(dont|doesnt|isnt|wasnt|werent|couldnt|shouldnt|wouldnt)\b/gi,m=>m[0].slice(0,-1)+"'"+m[0].slice(-1),'Apostrophe','Use an apostrophe in this contraction.'],

 [/\b([A-Za-z]+)(\s+)\1\b/gi,m=>m[1],'Repeated word','Remove the repeated word.'],
 [/\b(This|That|It|He|She) are\b/gi,m=>m[1]+' is','Agreement','Use a singular verb with this subject.'],
 [/\b(These|Those|We|They|You) is\b/gi,m=>m[1]+' are','Agreement','Use a plural verb with this subject.'],
 [/\b(We|They|You|I) has\b/gi,m=>m[1]+' have','Agreement','Use “have” with this subject.'],
 [/\b(He|She|It) have\b/gi,m=>m[1]+' has','Agreement','Use “has” with this subject.'],
 [/\b([Aa]) (example|equation|integral|assumption|error|inequality|identity|argument|expression|integer|observation|experiment)\b/g,m=>(m[1]==='A'?'An':'an')+' '+m[2],'Article','Use “an” before this vowel sound.'],
 [/\b([Aa]n) (university|unit|unique|user|one)\b/g,m=>(m[1]==='An'?'A':'a')+' '+m[2],'Article','Use “a” before this consonant sound.'],
 [/\bi\b/g,()=> 'I','Capitalization','Capitalize the personal pronoun “I”.'],
 [/[ \t]+([,;:!?])/g,m=>m[1],'Punctuation','Remove the space before this punctuation mark.'],
 [/\b(could|should|would|must) of\b/gi,m=>m[1]+' have','Word choice','Use “have” after this modal verb.']
];
const styleRules=[
 [/\bin order to\b/gi,()=> 'to','Clarity','Consider “to” for a more concise sentence.'],
 [/\bdue to the fact that\b/gi,()=> 'because','Clarity','Consider “because” to make the reason easier to read.'],
 [/\bat this point in time\b/gi,()=> 'now','Clarity','Consider “now” unless the longer phrase adds needed emphasis.'],
 [/\b(very unique|absolutely essential|completely unanimous)\b/gi,m=>m[1].split(' ').slice(1).join(' '),'Clarity','This modifier may be redundant. Keep it if the emphasis is intentional.'],
 [/\b(obviously|clearly),?\s+([a-z]+\b)?/gi,m=>{const word=m[2]||'';return word&&(/^\s*$|[.!?]\s*$/.test(m.input.slice(0,m.index)))?word[0].toUpperCase()+word.slice(1):word;},'Tone','Consider removing this assumption about what the reader already understands.']
];
const science='Glass MathLive LaTeX Codex Cartesian Laplacian Lagrangian Hamiltonian Jacobian Hessian eigenvalue eigenvalues eigenvector eigenvectors eigenbasis eigenspace bijection bijective surjective injective homeomorphism homomorphism diffeomorphism Lebesgue Riemann Stokes Gauss Green Cauchy Schwarz Fourier Laplace Hilbert Banach Noether Euler Fubini Tonelli Bolzano Weierstrass deoxyribonucleic ribonucleic mRNA tRNA rRNA ATP DNA RNA GC SMILES PubChem mitochondrion mitochondria chloroplast chloroplasts cytosol cytoskeleton endoplasmic ribosome ribosomes nucleolus nucleoli lysosome lysosomes peroxisome peroxisomes glycolysis gluconeogenesis stereoisomer stereoisomers enantiomer enantiomers conformer conformers nucleophile electrophile stoichiometry molarity molality electronegativity thermodynamics enthalpy entropy redox oxidation reduction genotype genotypes phenotype phenotypes Punnett Mendelian phylogeny phylogenetic pedigree pedigrees'.split(' ');
class OfflineGrammar{
 constructor(spell,file){this.spell=spell;this.file=file;this.words=[];this.cache=new Map();for(const word of science)spell.add(word);try{const words=JSON.parse(fs.readFileSync(file));if(Array.isArray(words))for(const word of words)if(this.valid(word)){this.words.push(word);spell.add(word);}}catch{}}
 static async create(file){const dictionary=(await import('dictionary-en')).default;return new OfflineGrammar(require('nspell')(dictionary),file);}
 valid(word){return typeof word==='string'&&/^[A-Za-z][A-Za-z'-]{1,49}$/.test(word);}
 add(word){if(!this.valid(word))throw Error('Use a word with 2–50 letters.');if(!this.words.includes(word)){if(this.words.length>=5000)throw Error('Personal dictionary is full.');this.words.push(word);atomicWrite(this.file,JSON.stringify(this.words));this.spell.add(word);this.cache.clear();}return this.words;}
 check(segments){if(!Array.isArray(segments)||segments.length>10000||JSON.stringify(segments).length>1500000)throw Error('Check a smaller selection.');const suggestions=[];let guesses=0;
  for(const segment of segments){if(typeof segment.text!=='string'||!Number.isInteger(segment.id))continue;const text=segment.text;const taken=[];const add=(offset,original,replacement,explanation,kind,alternatives=[],category=kind)=>{if(taken.some(([a,b])=>offset<b&&offset+original.length>a))return;taken.push([offset,offset+original.length]);suggestions.push({segmentId:segment.id,offset,original,replacement,explanation,kind,alternatives,category});};
   for(const [rule,replace,title,why]of rules){rule.lastIndex=0;for(const match of text.matchAll(rule))add(match.index,match[0],replace(match),title+': '+why,'grammar');}
   for(const [rule,replace,title,why] of styleRules){rule.lastIndex=0;for(const match of text.matchAll(rule)){let replacement=replace(match);if(/^[A-Z]/.test(match[0])&&replacement)replacement=replacement[0].toUpperCase()+replacement.slice(1);add(match.index,match[0],replacement,title+': '+why,'style',[],title.toLowerCase());}}
   for(const match of text.matchAll(/\b[A-Za-z][A-Za-z'’]*\b/g)){const word=match[0],lower=word.toLowerCase();if(word.length<3||word.length>40||/^[A-Z]+$/.test(word)||/[\d_\\/@]/.test(text[match.index-1]||'')||/[\d_/@]/.test(text[match.index+word.length]||'')||/https?:\/\/\S*$/.test(text.slice(Math.max(0,match.index-100),match.index))||this.spell.correct(word.replaceAll('’',"'")))continue;let choices=this.cache.get(lower);if(!choices){if(guesses>=35)continue;guesses++;choices=[...new Set([common[lower],...this.spell.suggest(lower)].filter(Boolean))].slice(0,5);this.cache.set(lower,choices);if(this.cache.size>1500)this.cache.delete(this.cache.keys().next().value);}if(!choices.length)continue;const alternatives=choices.map(value=>/^[A-Z]/.test(word)?value[0].toUpperCase()+value.slice(1):value);add(match.index,word,alternatives[0],'Spelling: possible misspelling. Choose a correction or add the word to your dictionary.','spelling',alternatives);if(suggestions.length>=150)break;}
   if(suggestions.length>=150)break;
  }return {summary:'Offline English spelling and grammar',suggestions:suggestions.slice(0,150)};
 }
}
module.exports={OfflineGrammar};
