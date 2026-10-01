export function parseRoute(hash,search=''){
 if(!hash||hash==='#'||hash==='#/'){
  const legacy=new URLSearchParams(search).get('model');
  return legacy ? {type:'legacy',id:legacy} : {type:'gallery'};
 }
 let segments;
 try{segments=hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);}catch{return {type:'missing'};}
 if(segments[0]==='project'&&segments.length===2)return {type:'project',projectId:segments[1]};
 if(segments[0]==='viewer'&&segments.length===3)return {type:'viewer',projectId:segments[1],scanId:segments[2]};
 return {type:'missing'};
}
export const projectLink=id=>`#/project/${encodeURIComponent(id)}`;
export const viewerLink=(projectId,scanId)=>`#/viewer/${encodeURIComponent(projectId)}/${encodeURIComponent(scanId)}`;
