import { asViewerError } from './viewer/errors.js';
export async function loadProjects(signal){
 try{
  const embedded=document.querySelector('#project-catalog');
  if(embedded)return JSON.parse(embedded.textContent);
  const response=await fetch(`${import.meta.env.BASE_URL}projects.json`,{cache:'no-cache',signal});
  if(!response.ok)throw new Error(`Projects HTTP ${response.status}`);
  const catalog=await response.json();
  if(catalog.version!==1||!Array.isArray(catalog.projects))throw new Error('Unsupported projects catalog');
  for(const project of catalog.projects){if(!project.id||!project.title||!Array.isArray(project.scans))throw new Error('Invalid project');for(const scan of project.scans){if(!scan.id||!scan.title||!scan.modelUrl)throw new Error('Invalid scan');const url=new URL(scan.modelUrl,location.href);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('Invalid scan URL');}}
  return catalog;
 }catch(error){throw asViewerError(error,'MODEL_CONFIG');}
}
export async function loadModelConfig(signal) {
  try {
    const response=await fetch(`${import.meta.env.BASE_URL}models.json`,{cache:'no-cache',signal});
    if(!response.ok)throw new Error(`Manifest HTTP ${response.status}`);
    const manifest=await response.json();
    const id=new URLSearchParams(location.search).get('model')||manifest.defaultModelId;
    const model=manifest.models?.find(entry=>entry.id===id);
    if(!model||!model.modelUrl)throw new Error('Missing model configuration');
    const url=new URL(model.modelUrl,location.href);
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('Invalid model URL');
    return {...model,url:url.href,rotation:model.rotation??[0,0,0]};
  } catch(error) {throw asViewerError(error,'MODEL_CONFIG');}
}
