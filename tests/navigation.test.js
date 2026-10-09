import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {FreeLookControls} from '../src/viewer/FreeLookControls.js';
class Canvas extends EventTarget {
 clientHeight=720;captures=new Set();
 setPointerCapture(id){this.captures.add(id);}
 hasPointerCapture(id){return this.captures.has(id);}
 releasePointerCapture(id){this.captures.delete(id);}
}
function fixture(){
 const camera=new PerspectiveCamera(60,1,.001,100);camera.position.set(2,3,4);camera.lookAt(2,3,3);camera.updateMatrixWorld();
 const orbit={target:new Vector3(2,3,3)},canvas=new Canvas();let active=true;
 globalThis.window=new EventTarget();
 const control=new FreeLookControls(camera,canvas,orbit,()=>active,()=>1);
 return {camera,orbit,control,canvas,disable(){active=false;},dispose(){control.dispose();delete globalThis.window;}};
}
function fire(canvas,type,values){const event=new Event(type,{cancelable:true});Object.assign(event,values);canvas.dispatchEvent(event);}
test('look drag holds the viewing position, preserves distance and prevents upside-down pitch',()=>{
 const f=fixture();try{
  const position=f.camera.position.clone();
  fire(f.canvas,'pointerdown',{pointerId:1,button:0,clientX:10,clientY:10});
  fire(f.canvas,'pointermove',{pointerId:1,clientX:110,clientY:-100000});
  assert.ok(f.camera.position.distanceTo(position)<1e-10);
  assert.ok(Math.abs(f.camera.position.distanceTo(f.orbit.target)-1)<1e-10);
  assert.ok(new Vector3(0,1,0).applyQuaternion(f.camera.quaternion).y>0);
  f.disable();const target=f.orbit.target.clone();
  fire(f.canvas,'pointermove',{pointerId:1,clientX:210,clientY:200});assert.ok(f.orbit.target.equals(target));
 }finally{f.dispose();}
});
test('wheel travel can pass the target and retreat without a model-sized distance cap',()=>{
 const f=fixture();try{
  fire(f.canvas,'wheel',{deltaY:-100000,deltaMode:0});assert.ok(f.camera.position.z<-400);
  assert.ok(Math.abs(f.camera.position.distanceTo(f.orbit.target)-1)<1e-10);
  fire(f.canvas,'wheel',{deltaY:200000,deltaMode:0});assert.ok(f.camera.position.z>400);
  f.disable();const position=f.camera.position.clone();fire(f.canvas,'wheel',{deltaY:-200000,deltaMode:0});assert.ok(f.camera.position.equals(position));
 }finally{f.dispose();}
});
