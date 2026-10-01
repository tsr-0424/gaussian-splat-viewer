import { Vector3, TOUCH } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export function createNavigation(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.touches.ONE = TOUCH.ROTATE;
  controls.touches.TWO = TOUCH.DOLLY_PAN;
  const keys = new Set();
  const codes = new Set(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight']);
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D：左鍵旋轉、右鍵平移、滾輪縮放；WASD 移動、QE 升降');
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
  return { controls, update(delta, speed) {
    if (!controls.enabled) {keys.clear();controls.update();return;}
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
    controls.dispose(); canvas.removeEventListener('keydown',down); canvas.removeEventListener('pointerdown',focus);
    canvas.removeEventListener('blur',clear); window.removeEventListener('keyup',up); window.removeEventListener('blur',clear);
  }};
}
