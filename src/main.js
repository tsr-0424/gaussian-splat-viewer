import './style.css';
import {loadProjects} from './config.js';
import {parseRoute,viewerLink} from './routing.js';
import {gallery,projectPage,missingPage} from './ui/ProjectPages.js';
import {ErrorOverlay} from './ui/ErrorOverlay.js';
const container=document.querySelector('#app'),abort=new AbortController(),errors=new ErrorOverlay();
let catalog,session,revision=0,pageInitializedAt;
async function route(){
 const current=++revision;session?.dispose();session=null;errors.element.hidden=true;
 const openedAt=performance.now();let selected=parseRoute(location.hash,location.search);
 if(selected.type==='legacy'){
  for(const project of catalog.projects){const scan=project.scans.find(scan=>(scan.assetId||`${project.id}--${scan.id}`)===selected.id);if(scan){selected={type:'viewer',projectId:project.id,scanId:scan.id};const url=new URL(location.href);url.searchParams.delete('model');url.hash=viewerLink(project.id,scan.id);history.replaceState(null,'',url);break;}}
 }
 document.body.classList.toggle('is-viewer',selected.type==='viewer');
 if(selected.type==='gallery'){document.title='空間記錄 · Spatial Scan';gallery(container,catalog.projects);return;}
 const project=catalog.projects.find(project=>project.id===selected.projectId);
 if(!project){missingPage(container);return;}
 if(selected.type==='project'){document.title=`${project.title} · Spatial Scan`;projectPage(container,project);return;}
 const scan=project.scans.find(scan=>scan.id===selected.scanId);
 if(selected.type!=='viewer'||!scan){missingPage(container);return;}
 container.className='viewer-page';container.replaceChildren();
 const pending=document.createElement('p');pending.className='route-loading';pending.textContent=`${project.title} · Loading Spatial Data...`;container.append(pending);
 try{const {createViewerSession}=await import('./viewer/ViewerSession.js');const moduleReadyAt=performance.now();if(current!==revision)return;session=createViewerSession(container,project,scan,{pageInitializedAt,openedAt,moduleReadyAt});}
 catch(error){if(current===revision)errors.show(error);}
}
try{catalog=await loadProjects(abort.signal);pageInitializedAt=performance.now();await route();}
catch(error){if(error.name!=='AbortError')errors.show(error);}
window.addEventListener('hashchange',route);
if(import.meta.hot)import.meta.hot.dispose(()=>{revision++;abort.abort();session?.dispose();errors.dispose();window.removeEventListener('hashchange',route);});
