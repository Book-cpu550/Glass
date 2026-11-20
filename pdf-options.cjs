function options(input={}){const pageSize=['A4','Letter','Legal'].includes(input.pageSize)?input.pageSize:'A4',margin=Number(input.margin??18);if(!Number.isFinite(margin)||margin<8||margin>40)throw Error('Choose margins between 8 and 40 mm.');return {pageSize,margin,landscape:!!input.landscape,pageNumbers:input.pageNumbers!==false};}
module.exports={options};
