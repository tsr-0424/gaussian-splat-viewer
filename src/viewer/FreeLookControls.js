import {Euler,Vector3} from 'three';

// Look around from the current camera position; wheel/pinch translates the camera.
export class FreeLookControls {
 constructor(camera,canvas,orbit,isActive,getSpeed){
  this.camera=camera;this.canvas=canvas;this.orbit=orbit;this.isActive=isActive;this.getSpeed=getSpeed;
  this.points=new Map();this.forward=new Vector3();this.right=new Vector3();this.vertical=new Vector3();this.rotation=new Euler(0,0,0,'YXZ');
  this.down=event=>{
   if(!this.isActive())return;
   this.points.set(event.pointerId,{x:event.clientX,y:event.clientY,pan:event.button===2||event.shiftKey});
   canvas.setPointerCapture(event.pointerId);event.preventDefault();
  };
  this.move=event=>{
   const previous=this.points.get(event.pointerId);if(!previous)return;
   if(!this.isActive()){this.clear();return;}
   const before=this.gesture();this.points.set(event.pointerId,{...previous,x:event.clientX,y:event.clientY});
   const after=this.gesture();
   if(this.points.size>=2){
    this.pan(after.x-before.x,after.y-before.y);
    if(before.distance>0&&after.distance>0)this.travel(Math.log(after.distance/before.distance)*this.getSpeed()*3);
   }else if(previous.pan)this.pan(event.clientX-previous.x,event.clientY-previous.y);
   else this.look(event.clientX-previous.x,event.clientY-previous.y);
   event.preventDefault();
  };
  this.up=event=>{this.points.delete(event.pointerId);if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);};
  this.wheel=event=>{
   if(!this.isActive())return;
   const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1);
   this.travel(-pixels*this.getSpeed()*.005);event.preventDefault();
  };
  this.context=event=>{if(this.isActive())event.preventDefault();};
  this.blur=()=>this.clear();
  canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointermove',this.move);
  canvas.addEventListener('pointerup',this.up);canvas.addEventListener('pointercancel',this.up);
  canvas.addEventListener('lostpointercapture',this.up);canvas.addEventListener('wheel',this.wheel,{passive:false});
  canvas.addEventListener('contextmenu',this.context);window.addEventListener('blur',this.blur);
 }
 gesture(){const values=[...this.points.values()].slice(0,2);return {x:values.reduce((n,p)=>n+p.x,0)/values.length,y:values.reduce((n,p)=>n+p.y,0)/values.length,distance:values.length===2?Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y):0};}
 look(dx,dy){
  this.camera.getWorldDirection(this.forward);
  const distance=Math.max(this.camera.position.distanceTo(this.orbit.target),1e-6);
  const yaw=Math.atan2(-this.forward.x,-this.forward.z)-dx*.003;
  const pitch=Math.max(-Math.PI/2+.001,Math.min(Math.PI/2-.001,Math.asin(Math.max(-1,Math.min(1,this.forward.y)))-dy*.003));
  this.camera.quaternion.setFromEuler(this.rotation.set(pitch,yaw,0,'YXZ'));
  this.camera.getWorldDirection(this.forward);
  this.orbit.target.copy(this.camera.position).addScaledVector(this.forward,distance);
  this.camera.updateMatrixWorld();
 }
 pan(dx,dy){
  const distance=Math.max(this.camera.position.distanceTo(this.orbit.target),1e-6);
  const scale=2*distance*Math.tan(this.camera.fov*Math.PI/360)/Math.max(this.canvas.clientHeight,1);
  this.right.setFromMatrixColumn(this.camera.matrixWorld,0);
  this.vertical.setFromMatrixColumn(this.camera.matrixWorld,1);
  this.translate(this.right.multiplyScalar(-dx*scale).addScaledVector(this.vertical,dy*scale));
 }
 travel(distance){this.camera.getWorldDirection(this.forward);this.translate(this.forward.multiplyScalar(distance));}
 translate(move){this.camera.position.add(move);this.orbit.target.add(move);this.camera.updateMatrixWorld();}
 clear(){this.points.clear();}
 dispose(){
  this.clear();const c=this.canvas;c.removeEventListener('pointerdown',this.down);c.removeEventListener('pointermove',this.move);
  c.removeEventListener('pointerup',this.up);c.removeEventListener('pointercancel',this.up);c.removeEventListener('lostpointercapture',this.up);
  c.removeEventListener('wheel',this.wheel);c.removeEventListener('contextmenu',this.context);window.removeEventListener('blur',this.blur);
 }
}
