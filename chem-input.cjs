const rows=[
 ['water','O','H2O'],['hydrogen','[H][H]','H2'],['oxygen','O=O','O2'],['nitrogen','N#N','N2'],['carbon dioxide','O=C=O','CO2'],['carbon monoxide','[C-]#[O+]','CO'],['ammonia','N','NH3'],['methane','C','CH4'],['ethane','CC','C2H6'],['propane','CCC','C3H8'],['butane','CCCC','C4H10'],['isobutane','CC(C)C','C4H10'],['ethene','C=C','C2H4','ethylene'],['ethyne','C#C','C2H2','acetylene'],['methanol','CO','CH4O'],['ethanol','CCO','C2H6O','ethyl alcohol'],['dimethyl ether','COC','C2H6O'],['propan-1-ol','CCCO','C3H8O','1-propanol'],['propan-2-ol','CC(O)C','C3H8O','isopropyl alcohol'],['acetone','CC(=O)C','C3H6O','propanone'],['propanal','CCC=O','C3H6O'],['formaldehyde','C=O','CH2O','methanal'],['acetaldehyde','CC=O','C2H4O','ethanal'],['acetic acid','CC(=O)O','C2H4O2','ethanoic acid'],['formic acid','C(=O)O','CH2O2','methanoic acid'],['ethyl acetate','CCOC(C)=O','C4H8O2'],['benzene','c1ccccc1','C6H6'],['toluene','Cc1ccccc1','C7H8'],['phenol','Oc1ccccc1','C6H6O'],['aniline','Nc1ccccc1','C6H7N'],['cyclohexane','C1CCCCC1','C6H12'],['hydrogen peroxide','OO','H2O2'],['hydrogen chloride','Cl','HCl','hydrochloric acid'],['sodium chloride','[Na+].[Cl-]','NaCl','table salt'],['sodium hydroxide','[Na+].[OH-]','NaOH'],['potassium hydroxide','[K+].[OH-]','KOH'],['calcium carbonate','[Ca+2].[O-]C([O-])=O','CaCO3'],['sodium bicarbonate','[Na+].OC([O-])=O','NaHCO3','baking soda'],['sodium carbonate','[Na+].[Na+].[O-]C([O-])=O','Na2CO3'],['sulfuric acid','OS(=O)(=O)O','H2SO4'],['nitric acid','O[N+](=O)[O-]','HNO3'],['phosphoric acid','OP(=O)(O)O','H3PO4'],['sulfur dioxide','O=S=O','SO2'],['hydrogen sulfide','S','H2S'],['sodium ion','[Na+]','Na+'],['chloride ion','[Cl-]','Cl-'],['hydrogen ion','[H+]','H+'],['hydroxide ion','[OH-]','OH-'],['ammonium ion','[NH4+]','NH4+'],['acetate ion','CC(=O)[O-]','C2H3O2-'],['glycine','NCC(=O)O','C2H5NO2'],['alanine','CC(N)C(=O)O','C3H7NO2'],['urea','NC(=O)N','CH4N2O'],['aspirin','CC(=O)Oc1ccccc1C(=O)O','C9H8O4','acetylsalicylic acid'],['caffeine','Cn1c(=O)c2c(ncn2C)n(C)c1=O','C8H10N4O2']
];
const catalog=rows.map((r,i)=>({id:'local-'+i,title:r[0],smiles:r[1],formula:r[2],aliases:r.slice(3),source:'Bundled reference'}));
function plain(input){return input.trim().replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/[⁺⁻]/g,c=>c==='⁺'?'+':'-');}
function isFormula(input){return /^(?:[A-Z][a-z]?\d*|[()[\].+\-]|\d+)+$/.test(plain(input));}
function candidates(token,custom={}){const query=plain(token);if(/^smiles:/i.test(query))return [{id:'input',title:query.slice(7).trim(),smiles:query.slice(7).trim(),source:'Entered SMILES'}];const names=catalog.filter(c=>[c.title,...c.aliases].some(a=>a.toLowerCase()===query.toLowerCase()));const found=names.length?names:catalog.filter(c=>c.formula===query);return found.length?found:Object.hasOwn(custom,query)&&Array.isArray(custom[query])?custom[query]:[];}
function splitSpecies(side,separator='+'){
 const parts=[];let buffer='',depth=0;
 for(let i=0;i<side.length;i++){const c=side[i];if(c==='['||c==='(')depth++;if(c===']'||c===')')depth--;if(depth<0)throw Error('Check the brackets in the equation.');
  const charge=c==='+'&&!/\s/.test(side[i-1]||' ')&&(/\+\s*$/.test(side.slice(i))||/^\+\s*\+/.test(side.slice(i)));
  if(c===separator&&!depth&&!charge){if(!buffer.trim())throw Error('A compound is missing between separators.');parts.push(buffer.trim());buffer='';}else buffer+=c;
 }if(depth)throw Error('Close every bracket in the equation.');if(buffer.trim())parts.push(buffer.trim());else if(side.trim())throw Error('A compound is missing at the end.');return parts;
}
function parse(input,mode){
 if(typeof input!=='string'||!input.trim()||input.length>3000)throw Error('Enter a compound or equation (up to 3000 characters).');
 if(!['compound','smiles','equation','reaction-smiles'].includes(mode))throw Error('Choose an input type.');
 const text=plain(input);let groups=[],reaction=false,arrow='→';
 if(mode==='compound'||mode==='smiles')groups=[{side:'compound',parts:[text]}];
 else if(mode==='reaction-smiles'){
  const sides=text.split('>');if(sides.length!==3||!sides[0]||!sides[2])throw Error('Use reaction SMILES: reactants>>products or reactants>agents>products.');reaction=true;groups=[{side:'reactant',parts:splitSpecies(sides[0],'.')},{side:'agent',parts:splitSpecies(sides[1],'.')},{side:'product',parts:splitSpecies(sides[2],'.')}];
 }else{
  const match=/<=>|⇌|=>|->|→|=/.exec(text);if(!match)throw Error('Separate reactants and products with -> or =.');const left=text.slice(0,match.index),right=text.slice(match.index+match[0].length);if(!left.trim()||!right.trim())throw Error('Enter compounds on both sides of the equation.');reaction=true;arrow=['<=>','⇌'].includes(match[0])?'⇌':'→';groups=[{side:'reactant',parts:splitSpecies(left)},{side:'product',parts:splitSpecies(right)}];
 }
 const species=[];
 for(const group of groups)for(const part of group.parts){let coefficient=1,token=part;if(mode==='equation'){const match=/^(\d+(?:\/\d+|\.\d+)?)\s*(.+)$/.exec(part);if(match){token=match[2].trim();coefficient=match[1].includes('/')?Number(match[1].split('/')[0])/Number(match[1].split('/')[1]):Number(match[1]);if(!Number.isFinite(coefficient)||coefficient<=0||coefficient>1000)throw Error('Use a positive coefficient up to 1000.');}}
  species.push({token,coefficient,side:group.side,direct:mode==='smiles'||mode==='reaction-smiles'});
 }if(species.length>10)throw Error('Use at most 10 distinct species in one diagram.');return {input,mode,reaction,arrow,species};
}
module.exports={catalog,plain,isFormula,candidates,parse};
