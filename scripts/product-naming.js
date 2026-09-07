#!/usr/bin/env node
(function () {
'use strict';

// Deterministic classification gate. Internal product references (JH-###) are
// derived only for validation and tooling so same-name entries such as JH-027
// and JH-035 can be told apart; they are never rendered on the public site.
const STATUS = Object.freeze({
  DATABASE: 'NAMING DATABASE UNAVAILABLE: HUMAN REVIEW REQUIRED',
  SERIES: 'SERIES NOT IDENTIFIED: HUMAN REVIEW REQUIRED',
  COLOUR: 'COLOUR NOT IDENTIFIED: HUMAN REVIEW REQUIRED',
  VARIANT: 'COMBINATION NOT APPROVED: HUMAN REVIEW REQUIRED',
  REVIEW: 'HUMAN REVIEW REQUIRED',
  APPROVED: 'Approved'
});
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const isPercentage = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const isId = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const isLocalImage = value => typeof value === 'string' && /^assets\/images\/.+\.(?:jpe?g|png|webp|avif|gif)$/i.test(value) && !value.split('/').includes('..') && !/[\u0000-\u001f\u007f]/.test(value);
const isName = value => hasText(value) && value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);

function productReference(product) {
  const id = isObject(product) ? product.id : undefined;
  if (!Number.isSafeInteger(id) || id <= 0) return 'Unassigned';
  return 'JH-' + String(id).padStart(3, '0');
}

function validateRegistry(registry) {
  const errors = [];
  if (!isObject(registry)) return ['Naming registry must be an object.'];
  function checkKeys(record, allowed, label) {
    Object.keys(record).forEach(key => { if (!allowed.includes(key)) errors.push(`${label}.${key} is not a supported field.`); });
  }
  function checkTextList(value, label) {
    if (!Array.isArray(value) || value.length === 0 || !value.every(hasText)) errors.push(`${label} must be a non-empty list of reference/criteria strings.`);
  }
  function checkApproval(approval, label) {
    if (!isObject(approval)) { errors.push(`${label} must contain human approval provenance.`); return; }
    checkKeys(approval, ['approvedBy','approvedOn','reference'], label);
    for (const key of ['approvedBy','reference']) if (!hasText(approval[key])) errors.push(`${label}.${key} is required.`);
    const date = typeof approval.approvedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(approval.approvedOn) ? new Date(`${approval.approvedOn}T00:00:00.000Z`) : null;
    if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== approval.approvedOn) errors.push(`${label}.approvedOn must be a real YYYY-MM-DD date.`);
  }
  checkKeys(registry,['schemaVersion','registryVersion','confidenceThreshold','series','colours','approvedVariants','approvedProducts'],'registry');
  if (registry.schemaVersion !== 1) errors.push('Unsupported naming registry schemaVersion; expected 1.');
  if (!isName(registry.registryVersion)) errors.push('registryVersion must be a non-empty, unpadded string.');
  if (!isPercentage(registry.confidenceThreshold) || registry.confidenceThreshold === 0) errors.push('confidenceThreshold must be a number greater than 0 and at most 100.');
  const ids={series:new Set(),colours:new Set()};
  for (const [list,criteria] of [['series','designCriteria'],['colours','paletteCriteria']]) {
    if (!Array.isArray(registry[list])) { errors.push(`${list} must be an array.`); continue; }
    const names=new Set();
    registry[list].forEach((entry,index)=>{
      const label=`${list}[${index}]`;
      if(!isObject(entry)){errors.push(`${label} must be an object.`);return;}
      checkKeys(entry,['id','name',criteria,'referenceImages','approval'],label);
      if(!isId(entry.id)) errors.push(`${label}.id must be a lowercase hyphenated ID.`);
      if(ids[list].has(entry.id)) errors.push(`${label}.id duplicates ${entry.id}.`); ids[list].add(entry.id);
      if(!isName(entry.name)) errors.push(`${label}.name must be exact and single-line.`);
      if(names.has(entry.name)) errors.push(`${label}.name duplicates ${entry.name}.`); names.add(entry.name);
      if(list==='series' && (!entry.name.endsWith(' Series') || String(entry.name).slice(0,-7).endsWith(' Series'))) errors.push(`${label}.name must end in " Series" exactly once.`);
      checkTextList(entry[criteria],`${label}.${criteria}`); checkTextList(entry.referenceImages,`${label}.referenceImages`); checkApproval(entry.approval,`${label}.approval`);
    });
  }
  if(!Array.isArray(registry.approvedVariants)) errors.push('approvedVariants must be an array.');
  else {
    const pairs=new Set();
    registry.approvedVariants.forEach((variant,index)=>{
      const label=`approvedVariants[${index}]`;
      if(!isObject(variant)){errors.push(`${label} must be an object.`);return;}
      checkKeys(variant,['seriesId','colourId','approval'],label);
      if(!isId(variant.seriesId)||!ids.series.has(variant.seriesId)) errors.push(`${label}.seriesId must reference an approved series.`);
      if(!isId(variant.colourId)||!ids.colours.has(variant.colourId)) errors.push(`${label}.colourId must reference an approved colour.`);
      const pair=JSON.stringify([variant.seriesId,variant.colourId]); if(pairs.has(pair)) errors.push(`${label} duplicates an approved pairing.`); pairs.add(pair); checkApproval(variant.approval,`${label}.approval`);
    });
  }
  if(registry.approvedProducts!==undefined){
    if(!Array.isArray(registry.approvedProducts)) errors.push('approvedProducts must be an array.');
    else {
      const idsSeen=new Set();
      registry.approvedProducts.forEach((product,index)=>{
        const label=`approvedProducts[${index}]`;
        if(!isObject(product)){errors.push(`${label} must be an object.`);return;}
        checkKeys(product,['productId','seriesId','colourId','image','sourceImage','approval'],label);
        if(!Number.isSafeInteger(product.productId)||product.productId<=0||idsSeen.has(product.productId)) errors.push(`${label}.productId must be a unique positive integer.`); idsSeen.add(product.productId);
        if(!ids.series.has(product.seriesId)) errors.push(`${label}.seriesId must reference an approved series.`);
        if(!ids.colours.has(product.colourId)) errors.push(`${label}.colourId must reference an approved colour.`);
        if(!registry.approvedVariants.some(v=>isObject(v)&&v.seriesId===product.seriesId&&v.colourId===product.colourId)) errors.push(`${label} must reference an approved series/colour pairing.`);
        ['image','sourceImage'].forEach(key=>{if(!isLocalImage(product[key])) errors.push(`${label}.${key} must be a local image path under assets/images/.`);});
        checkApproval(product.approval,`${label}.approval`);
      });
    }
  }
  return errors;
}

function evaluateNaming(candidate, registry) {
  const result={registryVersion:isObject(registry)&&isName(registry.registryVersion)?registry.registryVersion:null,seriesId:null,series:null,colourId:null,colour:null,finalProductName:null,confidence:{series:null,colour:null},status:STATUS.DATABASE,humanReviewRequired:true,reasons:[]};
  const registryErrors=validateRegistry(registry); if(registryErrors.length){result.reasons=registryErrors;return result;}
  const input=isObject(candidate)?candidate:{}; const confidence=isObject(input.confidence)?input.confidence:{};
  const series=registry.series.find(entry=>entry.id===input.seriesId); if(!series){result.status=STATUS.SERIES;result.reasons.push('No approved series match.');return result;}
  result.seriesId=series.id;result.series=series.name;result.confidence.series=isPercentage(confidence.series)?confidence.series:null;
  const colour=registry.colours.find(entry=>entry.id===input.colourId); if(!colour){result.status=STATUS.COLOUR;result.reasons.push('No approved colour match.');return result;}
  result.colourId=colour.id;result.colour=colour.name;result.confidence.colour=isPercentage(confidence.colour)?confidence.colour:null;
  if(!registry.approvedVariants.some(v=>v.seriesId===series.id&&v.colourId===colour.id)){result.status=STATUS.VARIANT;result.reasons.push('The series and colour pairing is not approved.');return result;}
  if(input.registryVersion!==registry.registryVersion) result.reasons.push('Assessment must reference the current registryVersion.');
  const evidence=isObject(input.evidence)?input.evidence:{}; const method=input.reviewMethod===undefined?'confidence':input.reviewMethod;
  if(method==='human'){
    result.confidence={series:null,colour:null}; result.approvalMethod='human';
    const binding=(registry.approvedProducts||[]).find(p=>p.productId===input.productId&&p.seriesId===series.id&&p.colourId===colour.id&&p.image===input.image&&p.sourceImage===input.sourceImage);
    if(!binding) result.reasons.push('No owner-approved binding for this product and images.');
  } else if(method!=='confidence') result.reasons.push('reviewMethod must be confidence or human.');
  for(const key of ['series','colour']){
    if(method==='human'){if(confidence[key]!==undefined&&confidence[key]!==null) result.reasons.push(`${key} confidence must be omitted or null for owner-reviewed records.`);}
    else if(result.confidence[key]===null) result.reasons.push(`${key} confidence is invalid or missing.`);
    else if(result.confidence[key]<registry.confidenceThreshold) result.reasons.push(`${key} confidence is below ${registry.confidenceThreshold}%.`);
    if(!hasText(evidence[key])) result.reasons.push(`${key} match evidence is required.`);
  }
  if(input.requiresReview!==false) result.reasons.push(input.requiresReview===true?'The supplied assessment requires human review.':'Explicit review clearance is missing.');
  if(result.reasons.length){result.status=STATUS.REVIEW;return result;}
  result.finalProductName=`${series.name}, ${colour.name}`;result.status=STATUS.APPROVED;result.humanReviewRequired=false;return result;
}

function validateCatalogue(catalogue, registry) {
  const report={registryVersion:isObject(registry)&&isName(registry.registryVersion)?registry.registryVersion:null,confidenceThreshold:isObject(registry)&&isPercentage(registry.confidenceThreshold)?registry.confidenceThreshold:null,approvedCount:0,reviewCount:0,errors:validateRegistry(registry),products:[]};
  if(!isObject(catalogue)||!Array.isArray(catalogue.products)){report.errors.push('Catalogue must contain a products array.');return report;}
  if(!catalogue.products.length){report.errors.push('The published catalogue must contain at least one product.');return report;}
  const ids=new Set();
  catalogue.products.forEach((product,index)=>{
    if(!isObject(product)){report.errors.push(`products[${index}] must be an object.`);return;}
    const errors=[];
    if(!Number.isSafeInteger(product.id)||product.id<=0||ids.has(product.id)) errors.push('Product ID must be a unique positive integer.'); ids.add(product.id);
    if(!hasText(product.title)) errors.push('Product title is required.');
    if(Object.prototype.hasOwnProperty.call(product,'gallery')){
      if(!Array.isArray(product.gallery)) errors.push('Gallery must be an array of local image paths.');
      else product.gallery.forEach((entry,gi)=>{if(!isLocalImage(entry)) errors.push(`gallery[${gi}] must be a local image path under assets/images/.`)});
    }
    const hasNaming=Object.prototype.hasOwnProperty.call(product,'naming');
    const assessment=isObject(product.naming)?{...product.naming,productId:product.id,image:product.image,sourceImage:product.sourceImage}:product.naming;
    const result=evaluateNaming(assessment,registry);
    if(hasNaming&&result.status!==STATUS.APPROVED) errors.push(`Naming metadata is unresolved: ${result.status}.`);
    if(!hasNaming&&typeof product.title==='string'&&/\bseries\b/i.test(product.title)) errors.push('A series-style product title requires approved naming metadata.');
    if(result.status===STATUS.APPROVED&&product.title!==result.finalProductName) errors.push(`Title must exactly equal ${JSON.stringify(result.finalProductName)}.`);
    if(errors.length){report.errors.push(...errors.map(error=>`products[${index}] (internal ID ${product.id}): ${error}`));result.reasons.push(...errors);if(result.status===STATUS.APPROVED) result.status=STATUS.REVIEW;result.humanReviewRequired=true;result.finalProductName=null;}
    if(result.humanReviewRequired) report.reviewCount++; else report.approvedCount++;
    report.products.push({productId:product.id,currentTitle:product.title,...result});
  });
  return report;
}

function run(args){
  const fs=require('node:fs'),path=require('node:path'); const allowed=['--strict','--json','--help']; if(args.some(arg=>!allowed.includes(arg))){console.error('Usage: node scripts/product-naming.js [--strict] [--json]');process.exitCode=2;return;}
  if(args.includes('--help')){console.log('Usage: node scripts/product-naming.js [--strict] [--json]');return;}
  let report; try{const root=path.resolve(__dirname,'..');const registry=JSON.parse(fs.readFileSync(path.join(root,'content/product-naming.json'),'utf8'));const catalogue=JSON.parse(fs.readFileSync(path.join(root,'content/products.json'),'utf8'));report=validateCatalogue(catalogue,registry);}catch(error){report={registryVersion:null,confidenceThreshold:null,approvedCount:0,reviewCount:0,errors:[error.message],products:[]};}
  const failed=report.errors.length>0||(args.includes('--strict')&&report.reviewCount>0);
  if(args.includes('--json')) console.log(JSON.stringify(report,null,2)); else {for(const error of report.errors) console.error(`FAIL: ${error}`);console.log(`NAMING CHECK ${failed?'FAIL':'PASS'}: ${report.approvedCount} approved; ${report.reviewCount} require human review.`);if(!args.includes('--strict')&&report.reviewCount>0) console.log(`Pending records are incomplete naming migrations, not naming approval: each needs owner review before it can be published.`);}
  process.exitCode=failed?1:0;
}
const api=Object.freeze({STATUS,validateRegistry,evaluateNaming,validateCatalogue,productReference});
if(typeof module!=='undefined'&&module.exports){module.exports=api;if(require.main===module)run(process.argv.slice(2));}else globalThis.JHALARNaming=api;
})();

/* build: 20260907.18 */
