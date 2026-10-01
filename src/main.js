import './style.css';
import { loadModelConfig } from './config.js';
import { GaussianViewer } from './viewer/GaussianViewer.js';
import { detectDevice } from './performance/DeviceCapabilities.js';
import { initialQuality } from './performance/QualityPresets.js';
import { AdaptiveQuality } from './performance/AdaptiveQuality.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { ErrorOverlay } from './ui/ErrorOverlay.js';
import { asViewerError } from './viewer/errors.js';
import { WebActions } from './ui/WebActions.js';

const reset=document.querySelector('#reset'), qualitySelect=document.querySelector('#quality');
const loading=new LoadingScreen('Gaussian Splat'), errors=new ErrorOverlay(), webActions=new WebActions();
const manifestAbort=new AbortController();
let viewer, adaptive, panel, benchmark, network, networkPanel, modelConfig, disposed=false;
const device=detectDevice();
function onError(error) {
  error=asViewerError(error);
  if(disposed || error.name==='AbortError')return;
  if(viewer)viewer.ready=false;
  loading.hide();reset.disabled=true;qualitySelect.disabled=true;
  benchmark?.cancel('模型或圖形裝置錯誤，測試取消。');panel?.setReady(false);errors.show(error);
}
async function start(lowOnly=false) {
  const quality=initialQuality(device,innerWidth,innerHeight,devicePixelRatio);
  adaptive=new AdaptiveQuality({quality,maxQuality:lowOnly?'LOW':'HIGH',onChange:q=>viewer?.setQuality(q)});
  if(lowOnly) {
    adaptive.setMode('LOW',performance.now());qualitySelect.value='LOW';
    for(const option of qualitySelect.options) if(option.value==='HIGH'||option.value==='MEDIUM') option.disabled=true;
  }
  try {
    viewer=new GaussianViewer(document.querySelector('#viewer'),{
      onProgress:value=>loading.update(value),onError,
      onNetwork:import.meta.env.DEV ? event=>{network?.record(event);if(networkPanel)networkPanel.update(network.snapshot());} : undefined,
      onResize:()=>{adaptive.reset(performance.now());if(!benchmark?.transitioning)benchmark?.cancel('視窗或解析度改變，測試取消。');},
      onPause:()=>{adaptive.reset(performance.now());benchmark?.cancel('分頁進入背景，測試取消。');},
      onStats:(stats,now)=>{
        document.querySelector('#fps').textContent=stats.fps===null?'FPS —':`FPS ${Math.round(stats.fps)}`;
        document.querySelector('#quality-state').textContent=stats.quality;
        if(viewer?.ready) adaptive.update(stats,now);
        panel?.update(stats,adaptive.mode);
      },
    },device,quality);
    if(import.meta.env.DEV) {
      const [{PerformancePanel},{Benchmark},{NetworkDiagnostics},{NetworkPanel}]=await Promise.all([import('./ui/PerformancePanel.js'),import('./performance/Benchmark.js'),import('./performance/NetworkDiagnostics.js'),import('./ui/NetworkPanel.js')]);
      if(disposed)return;
      panel=new PerformancePanel(()=>{benchmark.start();reset.disabled=benchmark.running;qualitySelect.disabled=benchmark.running;},()=>benchmark.export(),()=>benchmark.cancel());
      panel.setReady(false);
      network=new NetworkDiagnostics();networkPanel=new NetworkPanel(panel.element);networkPanel.update(network.snapshot());
      benchmark=new Benchmark(viewer,adaptive,bench=>{
        panel.benchmark(bench);reset.disabled=bench.running||!viewer.ready;qualitySelect.disabled=bench.running||!viewer.ready;
        qualitySelect.value=adaptive.mode;
      });
      document.querySelector('#performance-toggle').hidden=false;
    }
    await viewer.load(modelConfig);
    await viewer.waitForFirstFrame();
    if(disposed)return;
    adaptive.reset(performance.now());loading.complete();reset.disabled=false;qualitySelect.disabled=false;panel?.setReady(true);
  } catch(error) {onError(error);}
}
async function initialize(){
  if(!device.webgl2){onError(Object.assign(new Error('WebGL2 unavailable'),{code:'WEBGL_UNSUPPORTED'}));return;}
  try{
    modelConfig=await loadModelConfig(manifestAbort.signal);if(disposed)return;
    loading.setName(modelConfig.name);document.querySelector('#name').textContent=modelConfig.name;
    document.title=`${modelConfig.name} · Gaussian Viewer V0.3`;
    if(device.software){loading.hide();errors.softwareWarning(()=>{loading.element.hidden=false;start(true);});}
    else start();
  }catch(error){onError(error);}
}
initialize();
const onReset=()=>{if(!benchmark?.running)viewer?.resetView();};
const onKey=e=>{
  if(e.code==='KeyR'&&!e.repeat&&!reset.disabled)onReset();
  if(import.meta.env.DEV && e.code==='KeyP'&&!e.repeat)onToggle();
};
const onQuality=()=>adaptive?.setMode(qualitySelect.value,performance.now());
const onToggle=()=>{panel?.toggle();if(viewer&&panel)panel.update(viewer.getStats(),adaptive.mode);};
reset.addEventListener('click',onReset);window.addEventListener('keydown',onKey);
qualitySelect.addEventListener('change',onQuality);document.querySelector('#performance-toggle').addEventListener('click',onToggle);
if(import.meta.hot) import.meta.hot.dispose(()=>{
  disposed=true;manifestAbort.abort();webActions.dispose();benchmark?.dispose();viewer?.dispose();panel?.dispose();loading.dispose();errors.dispose();
  if(!viewer)device.context?.getExtension('WEBGL_lose_context')?.loseContext();
  reset.removeEventListener('click',onReset);window.removeEventListener('keydown',onKey);
  qualitySelect.removeEventListener('change',onQuality);document.querySelector('#performance-toggle').removeEventListener('click',onToggle);
});
