import { Vector3, TOUCH } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {FreeLookControls} from './FreeLookControls.js';
export function createNavigation(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);
  controls.minDistance=0;controls.maxDistance=Infinity;
  controls.zoomToCursor=true;
  controls.touches.ONE = TOUCH.ROTATE;
  controls.touches.TWO = TOUCH.DOLLY_PAN;
  const keys = new Set();
  const codes = new Set(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight']);
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D：左鍵環視、右鍵平移、滾輪前後移動；WASD 移動、QE 升降');
  const down = e => { if (codes.has(e.code)) { e.preventDefault(); keys.add(e.code); } };
  const up = e => keys.delete(e.code);
  const clear = () => keys.clear();
  const focus = () => canvas.focus({preventScroll:true});
  canvas.addEventListener('keydown', down);
  canvas.addEventListener('pointerdown', focus);
  canvas.addEventListener('blur', clear);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', clear);
  const forward = new Vector3(), right = new Vector3(), move = new Vector3();
  let mode='LOOK',travelSpeed=1;
  const free=new FreeLookControls(camera,canvas,controls,()=>mode==='LOOK'&&controls.enabled,()=>travelSpeed);
  function setMode(value){
    if(!['LOOK','ORBIT'].includes(value))return;
    free.clear();keys.clear();controls.enableDamping=false;controls.update();
    mode=value;controls.enableRotate=controls.enablePan=controls.enableZoom=mode==='ORBIT';controls.enableDamping=mode==='ORBIT';
    canvas.setAttribute('aria-label',mode==='LOOK'?'3D：左鍵環視、右鍵平移、滾輪前後移動；WASD 移動、QE 升降':'3D：左鍵繞物件旋轉、右鍵平移、滾輪縮放；WASD 移動、QE 升降');
  }
  setMode('LOOK');
  return { controls, setMode, get mode(){return mode;}, update(delta, speed) {
    travelSpeed=speed;
    if (!controls.enabled) {keys.clear();free.clear();controls.update();return;}
    camera.getWorldDirection(forward);
    right.crossVectors(forward, camera.up).normalize();
    move.set(0,0,0);
    if(keys.has('KeyW')) move.add(forward);
    if(keys.has('KeyS')) move.sub(forward);
    if(keys.has('KeyD')) move.add(right);
    if(keys.has('KeyA')) move.sub(right);
    if(keys.has('KeyE')) move.add(camera.up);
    if(keys.has('KeyQ')) move.sub(camera.up);
    move.normalize().multiplyScalar(delta * speed * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 3 : 1));
    camera.position.add(move); controls.target.add(move); controls.update();
  }, dispose() {
    free.dispose();controls.dispose(); canvas.removeEventListener('keydown',down); canvas.removeEventListener('pointerdown',focus);
    canvas.removeEventListener('blur',clear); window.removeEventListener('keyup',up); window.removeEventListener('blur',clear);
  }};
}
