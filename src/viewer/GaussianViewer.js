import * as THREE from 'three';
import { SparkRenderer } from '@sparkjsdev/spark';
import { createNavigation } from './navigation.js';
import { loadGaussian } from './loader.js';
import { pixelRatioFor } from '../performance/QualityPresets.js';
import { PerformanceMonitor } from '../performance/PerformanceMonitor.js';
import {FirstSplatVisibility} from './FirstSplatVisibility.js';
import {validCameraView} from './cameraView.js';
export class GaussianViewer {
  constructor(container, callbacks, device, quality) {
    this.callbacks = callbacks;
    this.device = device;
    this.container = container;
    this.quality = quality;
    this.monitor = new PerformanceMonitor();
    this.visibilityProbe=(import.meta.env.DEV||import.meta.env.VITE_DEBUG_BUILD==='true')&&import.meta.env.VITE_VISIBILITY_PROBE!=='false'?new FirstSplatVisibility():null;
    this.abort = new AbortController();
    this.frameListeners = new Set();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#10151c');
    this.camera = new THREE.PerspectiveCamera(60,1,.01,10000);
    this.camera.position.set(0,0,5);
    this.renderer = new THREE.WebGLRenderer({canvas:device.canvas,context:device.context,antialias:false});
    container.append(this.renderer.domElement);
    this.spark = new SparkRenderer({renderer:this.renderer});
    this.scene.add(this.spark);
    this.navigation = createNavigation(this.camera,this.renderer.domElement);
    this.speed = 1;
    this.resize = () => {
      const {width,height} = container.getBoundingClientRect();
      this.camera.aspect = width/Math.max(height,1); this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(pixelRatioFor(this.quality,devicePixelRatio,width,height));
      this.renderer.setSize(width,height);
      this.monitor.reset();
      callbacks.onResize?.();
    };
    this.observer = new ResizeObserver(this.resize); this.observer.observe(container); this.resize();
    window.addEventListener('resize',this.resize);
    this.contextLost = e => {e.preventDefault(); this.failed=true;this.ready=false; this.renderer.setAnimationLoop(null);const error=Object.assign(new Error('WebGL context lost'),{code:'CONTEXT_LOST'});this.rejectFirstFrame?.(error);callbacks.onError(error);};
    this.renderer.domElement.addEventListener('webglcontextlost',this.contextLost);
    this.visibility = () => { this.monitor.reset(); callbacks.onPause?.(); };
    document.addEventListener('visibilitychange',this.visibility);
    let last = performance.now(), publishAt = 0, previousDpr = devicePixelRatio;
    this.renderer.setAnimationLoop(now => {
      if(document.hidden) {last=now;return;}
      if(previousDpr !== devicePixelRatio) {previousDpr=devicePixelRatio;this.resize();}
      this.navigation.update(Math.min((now-last)/1000,.05),this.speed); last=now;
      if(this.bounds){const sphere=this.viewSphere;const needed=this.camera.position.distanceTo(sphere.center)+sphere.radius*2;if(needed>this.camera.far*.8){this.camera.far=Math.max(this.camera.far,needed*2);this.camera.updateProjectionMatrix();}}
      try { this.renderer.render(this.scene,this.camera); }
      catch(error) {this.failed=true;this.ready=false;this.renderer.setAnimationLoop(null);this.rejectFirstFrame?.(error);callbacks.onError(error);return;}
      if(!this.firstRenderReported){this.firstRenderReported=true;callbacks.onNetwork?.({phase:'first-render',at:performance.now()});}
      if(!this.firstFrameReady){
        const candidate=!!(this.ready&&this.spark.activeSplats>0&&this.spark.orderingTexture);
        if(candidate&&!this.splatSubmitted){this.splatSubmitted=true;callbacks.onNetwork?.({phase:'rendered',at:performance.now()});}
        const evidence=this.visibilityProbe?.check(this.renderer,candidate)??{state:'unavailable',reason:'Production: visibility probe disabled; render submission only'};
        if(candidate&&evidence.state!=='pending'){
          this.firstFrameReady=true;
          this.firstFrameVisible=this.visibilityProbe?evidence.state==='visible':null;
          callbacks.onNetwork?.({phase:this.firstFrameVisible?'visible':'visibility-unavailable',at:performance.now(),reason:evidence.reason});
          this.resolveFirstFrame?.();
        }
      }
      const interval = this.ready ? this.monitor.tick(now) : null;
      if(interval !== null) for(const listener of this.frameListeners) listener(interval,now);
      if(now-publishAt>=500) { callbacks.onStats(this.getStats(),now); publishAt=now; }
    });
  }
  async load(config) {
    this.mesh = await loadGaussian(config,this.callbacks.onProgress,this.abort.signal,this.callbacks.onNetwork);
    if(this.disposed) {this.mesh.dispose();return;}
    if(this.failed) throw Object.assign(new Error('Graphics context failed during load'),{code:'CONTEXT_LOST'});
    this.callbacks.onNetwork?.({phase:'scene-init-start',at:performance.now()});
    this.mesh.updateMatrixWorld(true);
    this.bounds=this.mesh.getBoundingBox().applyMatrix4(this.mesh.matrixWorld);
    if(this.bounds.isEmpty() || ![...this.bounds.min,...this.bounds.max].every(Number.isFinite)) throw Object.assign(new Error('Invalid bounds'),{code:'INVALID_MODEL'});
    this.viewSphere=this.bounds.getBoundingSphere(new THREE.Sphere());
    this.defaultCamera=config.defaultCamera;
    this.scene.add(this.mesh); this.resetView();this.monitor.reset();this.ready=true;
    this.callbacks.onNetwork?.({phase:'scene-init-end',at:performance.now()});
    if(import.meta.env.DEV) console.info(`Loaded ${config.name}: ${this.mesh.numSplats} Gaussian splats`);
  }
  setQuality(quality) {this.quality=quality;this.resize();}
  setNavigationMode(mode) {
    this.navigation.setMode(mode);
    if(mode==='ORBIT'&&this.viewSphere&&this.camera.position.distanceToSquared(this.viewSphere.center)>1e-12){this.navigation.controls.target.copy(this.viewSphere.center);this.navigation.controls.update();}
  }
  waitForFirstFrame() {
    if(this.failed)return Promise.reject(Object.assign(new Error('Graphics context unavailable'),{code:'CONTEXT_LOST'}));
    if(this.firstFrameReady)return Promise.resolve();
    return new Promise((resolve,reject)=>{this.resolveFirstFrame=resolve;this.rejectFirstFrame=reject;});
  }
  getStats() {
    const memory=performance.memory;
    return {...this.monitor.snapshot(),quality:this.quality,
      canvasWidth:this.renderer.domElement.width,canvasHeight:this.renderer.domElement.height,
      viewportWidth:this.container.clientWidth,viewportHeight:this.container.clientHeight,
      dpr:devicePixelRatio,pixelRatio:this.renderer.getPixelRatio(),splats:this.mesh?.numSplats ?? 0,
      gpu:this.device.gpu,browser:this.device.browser,webgl:this.device.webgl,webgl2:this.device.webgl2,
      webgpu:this.device.webgpu,renderer:'WebGL2 (active)',classification:this.device.classification,
      heapUsed:memory?.usedJSHeapSize ?? null,heapLimit:memory?.jsHeapSizeLimit ?? null,
      deviceMemory:this.device.deviceMemory,textures:this.renderer.info.memory.textures,
      geometries:this.renderer.info.memory.geometries};
  }
  resetView() {
    if(!this.bounds) return;
    const sphere=this.bounds.getBoundingSphere(new THREE.Sphere());
    const radius=Math.max(sphere.radius,.01), v=THREE.MathUtils.degToRad(this.camera.fov);
    const h=2*Math.atan(Math.tan(v/2)*this.camera.aspect);
    const distance=radius/Math.sin(Math.min(v,h)/2)*1.12;
    this.camera.position.copy(sphere.center).addScaledVector(new THREE.Vector3(.7,.4,1).normalize(),distance);
    this.camera.near=Math.min(Math.max(radius/10000,1e-6),.001); this.camera.far=Math.max(distance+radius*100,100);this.camera.updateProjectionMatrix();
    this.navigation.controls.target.copy(sphere.center);
    this.navigation.controls.minDistance=0;this.navigation.controls.maxDistance=Infinity;
    this.navigation.controls.update();this.speed=radius*.4;
    if(this.defaultCamera)this.setCameraView(this.defaultCamera);
  }
  getCameraView() {
    if(!this.ready)return null;
    return {position:this.camera.position.toArray(),target:this.navigation.controls.target.toArray()};
  }
  setCameraView(view) {
    if(!validCameraView(view))return;
    const controls=this.navigation.controls;
    const distance=Math.hypot(...view.position.map((value,index)=>value-view.target[index]));
    // Allow viewpoints inside the scan, even when the overview has a large radius.
    controls.minDistance=Math.min(controls.minDistance,distance*.01);
    controls.maxDistance=Math.max(controls.maxDistance,distance*2);
    this.camera.near=Math.min(this.camera.near,distance*.01);this.camera.updateProjectionMatrix();
    const damping=controls.enableDamping;controls.enableDamping=false;controls.update();
    this.camera.position.fromArray(view.position);controls.target.fromArray(view.target);
    controls.update();controls.enableDamping=damping;
  }
  dispose() {
    this.disposed=true;this.abort.abort();this.rejectFirstFrame?.(new DOMException('Aborted','AbortError'));this.frameListeners.clear(); this.renderer.setAnimationLoop(null);this.observer.disconnect();this.navigation.dispose();
    window.removeEventListener('resize',this.resize);document.removeEventListener('visibilitychange',this.visibility);
    this.renderer.domElement.removeEventListener('webglcontextlost',this.contextLost);
    this.mesh?.dispose();this.spark.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();
  }
}
