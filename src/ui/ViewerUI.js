export class ViewerUI {
 constructor(container,project,scan){
  container.replaceChildren();container.className='viewer-page';
  container.innerHTML='<main id="viewer"></main><header class="viewer-header"><div class="viewer-identity"><a class="project-back" aria-label="返回專案">←</a><div><strong id="name"></strong><span id="scan-name"></span></div></div><nav class="viewer-actions" aria-label="Viewer actions"><button id="fullscreen" hidden>Fullscreen</button><button id="share">Share</button><button id="settings-toggle" aria-expanded="false" aria-controls="viewer-settings">Settings</button></nav></header><section id="viewer-settings" class="settings-panel" aria-label="Viewer Settings" hidden><div><h2>Settings</h2><button id="settings-close" aria-label="Close settings">×</button></div><p>Resolution only. 原始 Gaussian 資料保持不變。</p><span id="fps">FPS —</span><button id="performance-toggle" hidden>Performance</button><a id="debug-link" hidden>Open debug viewer</a></section><footer class="viewer-toolbar"><button id="navigation-mode" aria-pressed="false">環視</button><button id="reset" disabled>Reset View</button><label>Quality <select id="quality" disabled><option value="AUTO">Auto</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label><span id="quality-state" class="quality-state"></span></footer><div class="share-feedback"><span id="web-status" role="status"></span><input id="copy-link" aria-label="分享網址" readonly hidden></div>';
  this.root=container;container.querySelector('.project-back').href=`#/project/${encodeURIComponent(project.id)}`;
  container.querySelector('#name').textContent=project.title;container.querySelector('#scan-name').textContent=scan.title;
  this.settings=container.querySelector('#viewer-settings');this.toggle=container.querySelector('#settings-toggle');
  this.onToggle=()=>{this.settings.hidden=!this.settings.hidden;this.toggle.setAttribute('aria-expanded',String(!this.settings.hidden));};
  this.toggle.onclick=this.onToggle;container.querySelector('#settings-close').onclick=this.onToggle;
  this.escape=event=>{if(event.key==='Escape'&&!this.settings.hidden)this.onToggle();};window.addEventListener('keydown',this.escape);
 }
 dispose(){window.removeEventListener('keydown',this.escape);this.root.replaceChildren();}
}
