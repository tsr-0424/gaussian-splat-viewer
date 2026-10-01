export class LoadingScreen {
  constructor(name) {
    this.element = document.createElement('div'); this.element.className = 'loading-screen';
    this.element.innerHTML = '<strong></strong><div>Loading Gaussian Splat...</div><progress max="100"></progress><span role="status"></span>';
    this.element.querySelector('strong').textContent = name;
    document.body.append(this.element); this.update({ phase: 'download', percent: null });
  }
  update({ phase, percent }) {
    const progress = this.element.querySelector('progress');
    if (percent === null || phase === 'decode') progress.removeAttribute('value');
    else progress.value = percent;
    this.element.querySelector('[role=status]').textContent = phase === 'decode' ? '解碼中…' : percent === null ? '載入中…' : `${percent}%`;
  }
  complete() {
    this.element.querySelector('[role=status]').textContent='100%';
    this.element.classList.add('complete');this.element.setAttribute('aria-hidden','true');
    this.fadeTimer=setTimeout(()=>{this.element.hidden=true;},500);
  }
  hide() { this.element.hidden = true; }
  setName(name){this.element.querySelector('strong').textContent=name;}
  dispose() { clearTimeout(this.fadeTimer);this.element.remove(); }
}
