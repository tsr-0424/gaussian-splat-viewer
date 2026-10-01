import {GaussianViewer} from './GaussianViewer.js';
import {detectDevice} from '../performance/DeviceCapabilities.js';
import {initialQuality} from '../performance/QualityPresets.js';
import {AdaptiveQuality} from '../performance/AdaptiveQuality.js';
import {LoadingScreen} from '../ui/LoadingScreen.js';
import {ErrorOverlay} from '../ui/ErrorOverlay.js';
import {asViewerError} from './errors.js';
import {WebActions} from '../ui/WebActions.js';
import {ViewerUI} from '../ui/ViewerUI.js';
const DEBUG=import.meta.env.DEV||import.meta.env.VITE_DEBUG_BUILD==='true';

export function createViewerSession(container,project,scan,{pageInitializedAt,openedAt}){
 const ui=new ViewerUI(container,project,scan),reset=document.querySelector('#reset'),qualitySelect=document.querySelector('#quality');
 const modelConfig={...scan,name:`${project.title} / ${scan.title}`,projectTitle:project.title,url:new URL(scan.modelUrl,location.href).href,rotation:scan.rotation??[0,0,0]};
 const loading=new LoadingScreen(project.title),errors=new ErrorOverlay(),webActions=new WebActions({normalBase:import.meta.env.VITE_DEBUG_BUILD==='true'?import.meta.env.VITE_MODEL_BASE_PATH:undefined});
 let viewer,adaptive,panel,benchmark,profiler,profilerPanel,network,networkPanel,BenchmarkType,disposed=false;
 const device=detectDevice();
 document.title=`${project.title} / ${scan.title} · Spatial Scan`;
 const emit=event=>{profiler?.record(event);network?.record(event);};
 function onError(error){
  error=asViewerError(error);if(disposed||error.name==='AbortError')return;
  if(viewer)viewer.ready=false;loading.hide();reset.disabled=true;qualitySelect.disabled=true;
  benchmark?.cancel('模型或圖形裝置錯誤，測試取消。');panel?.setReady(false);errors.show(error);
 }
 async function start(lowOnly=false){
  const quality=initialQuality(device,innerWidth,innerHeight,devicePixelRatio);
  adaptive=new AdaptiveQuality({quality,maxQuality:lowOnly?'LOW':'HIGH',onChange:q=>viewer?.setQuality(q)});
  if(lowOnly){adaptive.setMode('LOW',performance.now());qualitySelect.value='LOW';for(const option of qualitySelect.options)if(['HIGH','MEDIUM'].includes(option.value))option.disabled=true;}
  try{
   if(DEBUG){
    const [{PerformancePanel},{Benchmark},{LoadingProfiler,benchmarkReport},{LoadingProfilerPanel},{NetworkDiagnostics},{NetworkPanel}]=await Promise.all([import('../ui/PerformancePanel.js'),import('../performance/Benchmark.js'),import('../performance/LoadingProfiler.js'),import('../ui/LoadingProfilerPanel.js'),import('../performance/NetworkDiagnostics.js'),import('../ui/NetworkPanel.js')]);
    if(disposed)return;
    profiler=new LoadingProfiler();profiler.record({phase:'page-initialized',at:pageInitializedAt});profiler.record({phase:'viewer-open',at:openedAt});
    network=new NetworkDiagnostics();
    panel=new PerformancePanel(()=>{benchmark.start();reset.disabled=benchmark.running;qualitySelect.disabled=benchmark.running;},()=>benchmark.export(),()=>benchmark.cancel());panel.setReady(false);
    profilerPanel=new LoadingProfilerPanel(panel.element,()=>{profiler.refreshResource();return benchmarkReport({profile:profiler.snapshot(),stats:viewer?.getStats(),model:modelConfig,mode:adaptive.mode,userAgent:navigator.userAgent,platform:navigator.userAgentData?.platform||navigator.platform,navigationType:performance.getEntriesByType('navigation')[0]?.type});});
    networkPanel=new NetworkPanel(panel.element);
    BenchmarkType=Benchmark;
    document.querySelector('#performance-toggle').hidden=false;
   }
   emit({phase:'renderer-init-start',at:performance.now()});
   viewer=new GaussianViewer(document.querySelector('#viewer'),{
    onProgress:value=>loading.update(value),onError,onNetwork:emit,
    onResize:()=>{adaptive.reset(performance.now());if(!benchmark?.transitioning)benchmark?.cancel('視窗或解析度改變，測試取消。');},
    onPause:()=>{adaptive.reset(performance.now());benchmark?.cancel('分頁進入背景，測試取消。');if(document.hidden)profiler?.record({phase:'hidden',at:performance.now()});},
    onStats:(stats,now)=>{
     const fps=document.querySelector('#fps');if(!ui.settings.hidden)fps.textContent=stats.fps===null?'FPS —':`FPS ${Math.round(stats.fps)}`;
     const state=document.querySelector('#quality-state');if(state.textContent!==stats.quality)state.textContent=stats.quality;
     if(viewer?.ready)adaptive.update(stats,now);panel?.update(stats,adaptive.mode);
     if(profiler){profilerPanel.update(profiler.snapshot());networkPanel.update(network.snapshot());}
    },
   },device,quality);
   emit({phase:'renderer-init-end',at:performance.now()});
   if(DEBUG){benchmark=new BenchmarkType(viewer,adaptive,bench=>{panel.benchmark(bench);reset.disabled=bench.running||!viewer.ready;qualitySelect.disabled=bench.running||!viewer.ready;qualitySelect.value=adaptive.mode;});viewer.frameListeners.add(interval=>profiler.recordFrame(interval,viewer.quality));}
   await viewer.load(modelConfig);await viewer.waitForFirstFrame();if(disposed)return;
   adaptive.reset(performance.now());loading.complete();reset.disabled=false;qualitySelect.disabled=false;panel?.setReady(true);
   emit({phase:'ready',at:performance.now()});profiler?.refreshResource();
   if(!viewer.firstFrameVisible)document.querySelector('#web-status').textContent='模型已提交渲染；取樣未能確認可見畫面，可用 Reset View 調整視角。';
  }catch(error){onError(error);}
 }
 const onReset=()=>{if(!benchmark?.running)viewer?.resetView();};
 const onQuality=()=>adaptive?.setMode(qualitySelect.value,performance.now());
 const onToggle=()=>{panel?.toggle();if(viewer&&panel){panel.update(viewer.getStats(),adaptive.mode);profiler?.refreshResource();profilerPanel.update(profiler.snapshot());networkPanel.update(network.snapshot());}};
 const onKey=event=>{if(['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;if(event.code==='KeyR'&&!event.repeat&&!reset.disabled)onReset();if(DEBUG&&event.code==='KeyP'&&!event.repeat)onToggle();};
 const modeButton=document.querySelector('#navigation-mode');let explore=false;
 modeButton.onclick=()=>{explore=!explore;modeButton.textContent=explore?'Explore':'Orbit';modeButton.setAttribute('aria-pressed',String(explore));if(viewer)viewer.navigation.controls.screenSpacePanning=!explore;};
 reset.onclick=onReset;qualitySelect.onchange=onQuality;document.querySelector('#performance-toggle').onclick=onToggle;window.addEventListener('keydown',onKey);
 const copy=document.createElement('button');copy.textContent='Copy Link';copy.onclick=()=>webActions.copy();ui.settings.append(copy);
 if(!device.webgl2)onError(Object.assign(new Error('WebGL2 unavailable'),{code:'WEBGL_UNSUPPORTED'}));
 else if(device.software){loading.hide();errors.softwareWarning(()=>{loading.element.hidden=false;start(true);});}
 else start();
 return {dispose(){disposed=true;webActions.dispose();benchmark?.dispose();viewer?.dispose();profiler?.dispose();panel?.dispose();loading.dispose();errors.dispose();if(!viewer)device.context?.getExtension('WEBGL_lose_context')?.loseContext();window.removeEventListener('keydown',onKey);ui.dispose();}};
}
