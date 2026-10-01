export function inspectResourceTiming(entry,{sameOrigin=false,serviceWorker=false}={}){
 const exposed=sameOrigin||(entry.requestStart>0&&entry.responseStart>0);
 const sizes=exposed&&entry.decodedBodySize>0;
 const transfer=sizes&&Number.isFinite(entry.transferSize)?entry.transferSize:null;
 return {
  networkMs:exposed&&entry.requestStart>0&&entry.responseEnd>=entry.requestStart ? entry.responseEnd-entry.requestStart : null,
  transferBytes:transfer,encodedBytes:sizes&&entry.encodedBodySize>0?entry.encodedBodySize:null,
  decodedBytes:sizes?entry.decodedBodySize:null,
  cache:serviceWorker?'unavailable (service worker)':transfer===0?'local cache':transfer>0?'network / revalidated; edge cache unavailable':'unavailable',
  deliveryType:entry.deliveryType||null,workerStart:entry.workerStart||null,
 };
}
export class LoadingProfiler {
 constructor({performanceApi=globalThis.performance,observerClass=globalThis.PerformanceObserver,origin=globalThis.location?.origin,serviceWorker=!!globalThis.navigator?.serviceWorker?.controller}={}){
  this.performanceApi=performanceApi;this.origin=origin;this.serviceWorker=serviceWorker;this.events={};this.resource=null;this.frames=0;this.frameMs=0;this.qualities=new Set();
  if(observerClass){try{this.observer=new observerClass(list=>{for(const entry of list.getEntries())this.acceptResource(entry);});this.observer.observe({type:'resource',buffered:true});}catch{/* Unsupported resource observer: explicit refresh fallback. */}}
 }
 record({phase,at,...details}){
  if(this.events[phase]===undefined)this.events[phase]=at;
  if(phase==='request')this.url=details.url;
  if(details.bytes!==undefined)this.streamBytes=details.bytes;
  if(phase==='visibility-unavailable')this.visibilityReason=details.reason;
  if(phase==='hidden'){this.hiddenDuringLoad=!this.events.ready;if(this.events.ready&&!this.fpsComplete)this.fpsInterrupted=true;}
 }
 acceptResource(entry){
  if(entry.name!==this.url||this.events.request===undefined||entry.startTime<this.events.request-2||entry.responseEnd<=0)return;
  this.resource=inspectResourceTiming(entry,{sameOrigin:new URL(entry.name,this.origin).origin===this.origin,serviceWorker:this.serviceWorker});
 }
 refreshResource(){for(const entry of this.performanceApi?.getEntriesByName?.(this.url||'')||[])this.acceptResource(entry);}
 recordFrame(interval,quality){
  if(this.events.ready===undefined||this.fpsComplete||this.fpsInterrupted||!(interval>0&&interval<=1000))return;
  this.frames++;this.frameMs+=interval;this.qualities.add(quality);
  if(this.frameMs>=10000)this.fpsComplete=true;
 }
 snapshot(){
  const e=this.events,between=(a,b)=>e[a]===undefined||e[b]===undefined?null:e[b]-e[a];
  return {pageInitMs:e['page-initialized']??null,viewerOpenMs:e['viewer-open']??null,requestStartMs:e.request??null,
   networkMs:this.resource?.networkMs??null,transferBytes:this.resource?.transferBytes??null,
   encodedBytes:this.resource?.encodedBytes??null,decodedBytes:this.resource?.decodedBytes??null,
   streamBytes:this.streamBytes??null,cache:this.resource?.cache??'unavailable',deliveryType:this.resource?.deliveryType??null,
   streamConsumptionMs:between('headers','download-complete'),sparkLoadMs:between('spark-start','decoded'),
   sparkTailMs:between('download-complete','decoded'),sceneInitMs:between('scene-init-start','scene-init-end'),rendererInitMs:between('renderer-init-start','renderer-init-end'),
   viewerModuleMs:between('viewer-open','viewer-module-ready'),debugModuleMs:between('debug-module-start','debug-module-ready'),
   decompressionMs:null,parseMs:null,gpuInitializationMs:null,
   firstRenderMs:e['first-render']??null,firstSplatRenderMs:e.rendered??null,firstVisibleSplatMs:e.visible??null,
   readyMs:e.ready??null,openToVisibleMs:between('viewer-open','visible'),openToReadyMs:between('viewer-open','ready'),
   visibilityReason:this.visibilityReason??null,hiddenDuringLoad:!!this.hiddenDuringLoad,
   fpsStatus:this.fpsInterrupted?'interrupted':this.fpsComplete?'complete':'collecting',
   averageFps:this.fpsComplete&&!this.fpsInterrupted?1000*this.frames/this.frameMs:null,
   fpsSampleMs:this.frameMs,fpsSamples:this.frames,fpsQualities:[...this.qualities],
  };
 }
 dispose(){this.observer?.disconnect();}
}
const seconds=value=>value===null?'unavailable':`${(value/1000).toFixed(3)} s`;
const bytes=value=>value===null?'unavailable':`${(value/1e6).toFixed(2)} MB (${value} bytes)`;
export function benchmarkReport({profile,stats,model,mode,userAgent,platform,navigationType='unavailable'}){
 return [
  'Spatial Scan Benchmark · V0.4',`Date: ${new Date().toISOString()}`,`Device (browser-reported platform): ${platform||'unavailable'}`,`Device memory hint: ${stats?.deviceMemory??'unavailable'} GiB`,`User agent: ${userAgent||'unavailable'}`,
  `Browser: ${stats?.browser||'unavailable'}`,`GPU: ${stats?.gpu||'unavailable'}`,
  `Viewport: ${stats?.viewportWidth} × ${stats?.viewportHeight}`,`DPR: ${stats?.dpr}`,`Renderer ratio: ${stats?.pixelRatio}`,
  `Quality: ${mode} → ${stats?.quality}`,`Navigation type: ${navigationType}`,
  `Project / Scan: ${model.projectTitle} / ${model.title}`,`Model: ${model.id}`,`Model format: ${model.format}`,`Gaussian count: ${stats?.splats??'unavailable'}`,
  '',`Page initialization (navigation → catalog/UI): ${seconds(profile.pageInitMs)}`,`Viewer opened at: ${seconds(profile.viewerOpenMs)}`,
  `Viewer JavaScript module load / evaluation: ${seconds(profile.viewerModuleMs??null)}`,`Debug JavaScript module load / evaluation: ${seconds(profile.debugModuleMs??null)}`,
  `Model request start: ${seconds(profile.requestStartMs)}`,`Network (browser requestStart → responseEnd): ${seconds(profile.networkMs)}`,
  `Transfer incl. headers: ${bytes(profile.transferBytes)}`,`Encoded body: ${bytes(profile.encodedBytes)}`,`Decoded body: ${bytes(profile.decodedBytes)}`,
  `Stream consumed bytes: ${bytes(profile.streamBytes)}`,`Cache: ${profile.cache}`,`Delivery type: ${profile.deliveryType||'unavailable'}`,
  `Decompression: unavailable`, `PLY / format parse alone: unavailable`,
  `Spark model load (overlaps network; includes initialization): ${seconds(profile.sparkLoadMs)}`,
  `Spark post-stream tail (not pure parse): ${seconds(profile.sparkTailMs)}`,
  `Renderer construction (CPU): ${seconds(profile.rendererInitMs)}`,`Scene attachment / camera setup (CPU): ${seconds(profile.sceneInitMs)}`,`GPU initialization: unavailable`,
  `First Render (may be background): ${seconds(profile.firstRenderMs)}`,`First Splat render submission: ${seconds(profile.firstSplatRenderMs)}`,
  `First visible splat (sampled framebuffer evidence): ${seconds(profile.firstVisibleSplatMs)}`,`Visibility limitation: ${profile.visibilityReason||'sampled pixels; not compositor timing'}`,
  `Ready from navigation (includes gallery dwell): ${seconds(profile.readyMs)}`,`Viewer open → first visible splat: ${seconds(profile.openToVisibleMs)}`,`Viewer open → Ready: ${seconds(profile.openToReadyMs)}`,
  `Hidden during load: ${profile.hiddenDuringLoad}`,`Average FPS after load: ${profile.averageFps===null?'unavailable':profile.averageFps.toFixed(2)}`,
  `FPS window: first 10 seconds of valid visible frame intervals; ${profile.fpsStatus}; ${(profile.fpsSampleMs/1000).toFixed(2)} s / ${profile.fpsSamples} samples`,
  `FPS qualities sampled: ${profile.fpsQualities.join(', ')||'unavailable'}`, 'No separate decompression/parse/GPU/compositor timing is inferred.',
 ].join('\n');
}
