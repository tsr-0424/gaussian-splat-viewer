export class PerformancePanel {
  constructor(onBenchmark,onExport,onCancel) {
    this.element=document.createElement('section');this.element.className='performance-panel';this.element.hidden=true;
    this.element.setAttribute('aria-label','Performance Panel');
    this.element.innerHTML='<h2>Performance · V0.2</h2><pre class="metrics"></pre><h3>Benchmark</h3><p>固定視角，每級暖機 3 秒、測量 8 秒。</p><button class="run">Run HIGH / MEDIUM / LOW</button> <button class="cancel" disabled>Cancel</button> <button class="export" disabled>Export JSON</button><p class="bench-status" role="status"></p><pre class="results"></pre>';
    this.element.querySelector('.run').onclick=onBenchmark;this.element.querySelector('.export').onclick=onExport;
    this.element.querySelector('.cancel').onclick=onCancel;document.body.append(this.element);
  }
  toggle() {this.element.hidden=!this.element.hidden;}
  update(s,mode) {
    if(this.element.hidden)return;
    const number=(value,decimals=1)=>value===null?'Unavailable':value.toFixed(decimals);
    this.element.querySelector('.metrics').textContent=[
      `Quality: ${mode} → ${s.quality}`,`FPS: ${number(s.fps)}   Frame time: ${number(s.frameMs)} ms`,
      '(2s rolling average; frame interval, not GPU time)',
      `Canvas: ${s.canvasWidth} × ${s.canvasHeight}`,
      `Viewport: ${s.viewportWidth} × ${s.viewportHeight}`,
      `devicePixelRatio: ${s.dpr}   Renderer ratio: ${s.pixelRatio.toFixed(3)}`,
      `Gaussian count: ${s.splats.toLocaleString()}`,
      `WebGL: ${s.webgl?'available':'no'} / WebGL2: ${s.webgl2?'active':'no'}`,
      `WebGPU: ${s.webgpu?'API exposed (not used)':'unavailable'}`,
      `GPU: ${s.gpu}`,`Acceleration: ${s.classification}`,
      `JS heap: ${s.heapUsed===null?'Unavailable':`${(s.heapUsed/1048576).toFixed(1)} / ${(s.heapLimit/1048576).toFixed(0)} MiB`}`,
      `Device RAM hint: ${s.deviceMemory??'Unavailable'} GiB`,
      `Three resources: ${s.textures} textures / ${s.geometries} geometries`,
      '(JS heap excludes GPU/worker memory; resources are counts)',
    ].join('\n');
  }
  benchmark(bench) {
    this.element.querySelector('.run').disabled=bench.running;
    this.element.querySelector('.cancel').disabled=!bench.running;
    this.element.querySelector('.export').disabled=bench.running||!bench.results.length;
    this.element.querySelector('.bench-status').textContent=bench.running?`測試 ${bench.sequence[bench.index]}…`:bench.message??'';
    this.element.querySelector('.results').textContent=bench.results.map(s=>`${s.quality}: ${s.fps.toFixed(1)} FPS | ${s.frameMs.toFixed(2)} ms\n${s.canvasWidth}×${s.canvasHeight} | ratio ${s.pixelRatio.toFixed(3)}`).join('\n');
    this.element.querySelector('.results').dataset.benchmark=JSON.stringify(bench.results);
  }
  setReady(ready) {this.element.querySelector('.run').disabled=!ready;}
  dispose() {this.element.remove();}
}
