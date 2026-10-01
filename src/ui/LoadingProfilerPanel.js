import {benchmarkReport} from '../performance/LoadingProfiler.js';
export class LoadingProfilerPanel {
 constructor(parent,getReport){
  this.element=document.createElement('section');this.element.className='loading-profiler';
  this.element.innerHTML='<h3>Loading Profiler</h3><pre class="loading-metrics"></pre><p>Network 與 Spark load 可重疊。解壓縮、純 parse、GPU initialization 無法獨立量測。</p><button class="copy-benchmark">Copy Benchmark Report</button><p class="copy-status" role="status"></p><textarea class="benchmark-copy" aria-label="Benchmark Report" readonly hidden></textarea>';
  this.element.querySelector('button').onclick=async()=>{
   const data=getReport();const status=this.element.querySelector('.copy-status');
   try{await navigator.clipboard.writeText(data);status.textContent='Report copied';}catch{const field=this.element.querySelector('textarea');field.value=data;field.hidden=false;field.focus();field.select();status.textContent='請複製下方報告';}
   this.element.dataset.report=data;
  };parent.append(this.element);
 }
 update(profile){
  if(this.element.closest('[hidden]'))return;
  const s=n=>n===null?'unavailable':`${(n/1000).toFixed(3)} s`,mb=n=>n===null?'unavailable':`${(n/1e6).toFixed(2)} MB`;
  this.element.querySelector('pre').textContent=[`Page Init     ${s(profile.pageInitMs)}`,`Request Start ${s(profile.requestStartMs)}`,`Network       ${s(profile.networkMs)}`,`Transfer      ${mb(profile.transferBytes)}`,`Encoded Body  ${mb(profile.encodedBytes)}`,`Decoded Body  ${mb(profile.decodedBytes)}`,`Spark Load    ${s(profile.sparkLoadMs)} (network overlaps)`,`Spark Tail    ${s(profile.sparkTailMs)} (not pure parse)`,`Scene CPU     ${s(profile.sceneInitMs)}`,`First Render  ${s(profile.firstRenderMs)}`,`First Splat   ${s(profile.firstVisibleSplatMs)} (sampled pixels)`,`Open → Ready  ${s(profile.openToReadyMs)}`,`Nav → Ready   ${s(profile.readyMs)} (includes gallery dwell)`,`Cache         ${profile.cache}`,`Decompression unavailable`,`Parse alone   unavailable`,`GPU init      unavailable`,`Post-load FPS ${profile.averageFps?.toFixed(1)??'unavailable'} · ${profile.fpsStatus}`].join('\n');
  this.element.dataset.metrics=JSON.stringify(profile);
 }
 dispose(){this.element.remove();}
}
