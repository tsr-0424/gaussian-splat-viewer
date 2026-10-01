// Fixed view, 3s warm-up + 8s timed sample per preset. No synthetic FPS or GPU timing claims.
export class Benchmark {
  constructor(viewer, adaptive, onUpdate) {
    this.viewer=viewer;this.adaptive=adaptive;this.onUpdate=onUpdate;this.results=[];this.running=false;
    this.onFrame=(delta,now)=>this.sample(delta,now);
    viewer.frameListeners.add(this.onFrame);
  }
  start() {
    if(this.running || !this.viewer.ready) return;
    this.results=[];this.running=true;this.previousMode=this.adaptive.mode;this.previousQuality=this.adaptive.quality;
    this.viewer.resetView();this.viewer.navigation.controls.enabled=false;
    this.sequence=['HIGH','MEDIUM','LOW'].filter(q=>this.adaptive.maxQuality!=='LOW'||q==='LOW');
    this.index=0;this.begin();
  }
  begin() {
    this.transitioning=true;
    const now=performance.now();this.adaptive.setMode(this.sequence[this.index],now);
    this.viewer.setQuality(this.adaptive.quality);
    this.transitioning=false;
    this.warmUntil=now+3000;this.until=now+11000;this.samples=[];
    this.signature=this.signatureOfViewer();
    this.onUpdate(this);
  }
  signatureOfViewer() {
    const canvas=this.viewer.renderer.domElement;
    return `${canvas.width}/${canvas.height}/${this.viewer.renderer.getPixelRatio()}/${devicePixelRatio}`;
  }
  sample(delta,now) {
    if(!this.running) return;
    if(this.signatureOfViewer()!==this.signature) {this.cancel('視窗或解析度改變，測試取消。');return;}
    if(now<this.warmUntil) return;
    this.samples.push(delta);
    if(now>=this.until) {
      const sum=this.samples.reduce((a,b)=>a+b,0);
      const sorted=[...this.samples].sort((a,b)=>a-b);
      this.results.push({...this.viewer.getStats(),fps:this.samples.length*1000/sum,frameMs:sum/this.samples.length,
        p95FrameMs:sorted[Math.floor((sorted.length-1)*.95)],sampleFrames:this.samples.length,sampleSeconds:sum/1000,
        timestamp:new Date().toISOString(),model:document.querySelector('#name').textContent});
      this.index++;
      if(this.index<this.sequence.length)this.begin();else this.finish();
    }
  }
  restore() {
    this.viewer.navigation.controls.enabled=true;
    this.adaptive.change(this.previousQuality,performance.now());
    this.adaptive.setMode(this.previousMode,performance.now());this.viewer.monitor.reset();
  }
  finish() {this.running=false;this.restore();this.message='完成（固定視角）';this.onUpdate(this);}
  cancel(message='測試取消。') {if(!this.running)return;this.running=false;this.restore();this.message=message;this.onUpdate(this);}
  export() {
    const data={version:'0.2.0',method:'fixed view; 3s warm-up + 8s sampling per preset',results:this.results};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='gaussian-benchmark.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  dispose() {this.cancel();this.viewer.frameListeners.delete(this.onFrame);}
}
