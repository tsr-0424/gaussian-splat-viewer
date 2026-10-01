import {projectLink,viewerLink} from '../routing.js';
const element=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
const link=(text,href,className)=>{const node=element('a',text,className);node.href=href;return node;};
function image(thumbnail,title){
 const frame=element('div',null,'scan-thumbnail');
 if(thumbnail){const img=element('img');img.src=thumbnail;img.alt=title;img.loading='lazy';img.onerror=()=>{img.remove();frame.append(element('span','SPATIAL SCAN'));};frame.append(img);}
 else frame.append(element('span','SPATIAL SCAN'));
 return frame;
}
export function gallery(container,projects){
 container.replaceChildren();container.className='project-page';
 const intro=element('header',null,'page-intro');intro.append(element('p','SPATIAL ARCHIVE','eyebrow'),element('h1','空間記錄'),element('p','用掃描留下一個地方，從任何角度重新走近它。','muted'));container.append(intro);
 const list=element('div',null,'project-list');
 for(const project of projects){const row=link('',projectLink(project.id),'project-row');row.append(image(project.thumbnail,project.title));const title=element('div',null,'project-row-title');title.append(element('h2',project.title));if(project.date)title.append(element('p',project.date,'muted'));row.append(title,element('span','查看 →','row-action'));list.append(row);}
 container.append(list,element('footer','Spatial Scan Platform · 個人空間紀錄','page-footer'));
}
export function projectPage(container,project){
 container.replaceChildren();container.className='project-page';container.append(link('← 所有專案','#/','back-link'));
 const header=element('header',null,'page-intro');header.append(element('p','PROJECT','eyebrow'),element('h1',project.title));if(project.description)header.append(element('p',project.description,'muted'));if(project.date||project.location)header.append(element('p',[project.date,project.location].filter(Boolean).join(' · '),'muted'));container.append(header);
 const list=element('div',null,'project-list');for(const scan of project.scans){const row=link('',viewerLink(project.id,scan.id),'project-row');row.append(image(scan.thumbnail||project.thumbnail,scan.title));const title=element('div',null,'project-row-title');title.append(element('h2',scan.title),element('p',`${scan.format.toUpperCase()} · Gaussian Splat`,'muted'));row.append(title,element('span','進入空間 →','row-action'));list.append(row);}container.append(list);
}
export function missingPage(container){container.replaceChildren();container.className='project-page';container.append(element('h1','找不到這個空間'),link('返回所有專案','#/','back-link'));}
