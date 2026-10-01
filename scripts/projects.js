import {generateManifest} from './manifest.js';
const idPattern=/^[a-z0-9][a-z0-9-]*$/;
export function projectAssets(catalog){
 const ids=new Set(),assets=new Set();
 if(catalog.version!==1||!Array.isArray(catalog.projects)||!catalog.projects.length)throw new Error('Invalid projects catalog');
 return catalog.projects.flatMap(project=>{
  if(!idPattern.test(project.id)||ids.has(project.id)||!project.title||!project.scans?.length)throw new Error('Invalid or duplicate project');ids.add(project.id);
  const scanIds=new Set();
  return project.scans.map(scan=>{
   if(!idPattern.test(scan.id)||scanIds.has(scan.id)||!scan.title)throw new Error('Invalid or duplicate scan');scanIds.add(scan.id);
   const assetId=scan.assetId||`${project.id}--${scan.id}`;
   if(!idPattern.test(assetId)||assets.has(assetId)||!['ply','spz','sog','zip','splat','ksplat','rad'].includes(scan.format))throw new Error('Invalid or duplicate asset');assets.add(assetId);
   if(!/^[a-f0-9]{64}$/.test(scan.metadata?.sha256)||!Number.isSafeInteger(scan.metadata?.sizeBytes)||scan.metadata.sizeBytes<=0)throw new Error('Invalid model integrity metadata');
   if(scan.defaultCamera&&!['position','target'].every(key=>Array.isArray(scan.defaultCamera[key])&&scan.defaultCamera[key].length===3&&scan.defaultCamera[key].every(Number.isFinite)))throw new Error('Invalid camera');
   return {...scan,...scan.metadata,id:assetId,name:`${project.title} / ${scan.title}`,projectId:project.id,scanId:scan.id};
  });
 });
}
export function generateProjects(catalog,options={}){
 const assets=projectAssets(catalog);
 const generated=generateManifest({version:1,defaultModelId:assets[0].id,models:assets},options);
 const byId=new Map(generated.models.map(model=>[model.id,model]));
 const thumbnail=value=>{if(!value)return null;if(!/^thumbnails\/[\w/-]+\.(svg|png|jpg|jpeg|webp)$/i.test(value)||value.includes('..'))throw new Error('Thumbnail must be a local thumbnails/ file');return `${options.siteBase||'/'}${value}`;};
 return {version:1,projects:catalog.projects.map(project=>({...project,thumbnail:thumbnail(project.thumbnail),scans:project.scans.map(scan=>{
  const asset=byId.get(scan.assetId||`${project.id}--${scan.id}`);
  const {developmentUrl,...publicScan}=scan;
  return {...publicScan,modelUrl:asset.modelUrl,thumbnail:thumbnail(scan.thumbnail)};
 })}))};
}
