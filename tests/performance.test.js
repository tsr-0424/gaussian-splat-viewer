import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRenderer } from '../src/performance/DeviceCapabilities.js';
import { pixelRatioFor, initialQuality } from '../src/performance/QualityPresets.js';
import { PerformanceMonitor } from '../src/performance/PerformanceMonitor.js';
import { AdaptiveQuality } from '../src/performance/AdaptiveQuality.js';

test('software detection is vendor-neutral and privacy-safe',()=>{
  for(const gpu of ['Google SwiftShader','Microsoft Basic Render Driver','Mesa llvmpipe','softpipe','Microsoft WARP']) assert.equal(classifyRenderer(gpu),'software');
  for(const gpu of ['Intel Iris Xe','AMD Radeon','Apple M3','NVIDIA RTX']) assert.equal(classifyRenderer(gpu),'hardware-likely');
  assert.equal(classifyRenderer('WebKit WebGL'),'unknown');
});
test('DPR and framebuffer budgets bound rendering without UA rules',()=>{
  assert.equal(pixelRatioFor('HIGH',3,1000,1000),2);
  assert.equal(pixelRatioFor('MEDIUM',3,1000,1000),1.25);
  assert.equal(pixelRatioFor('LOW',3,1000,1000),.75);
  assert.ok(pixelRatioFor('HIGH',2,3840,2160)**2*3840*2160<=4_000_001);
  assert.equal(initialQuality({software:false,classification:'hardware-likely'},390,844,3),'HIGH');
  assert.equal(initialQuality({software:false,classification:'unknown'},800,600,1),'MEDIUM');
});
test('rolling monitor excludes hidden-tab-sized gaps and responds to sustained drops',()=>{
  const monitor=new PerformanceMonitor();monitor.tick(0);
  for(let t=20;t<=2000;t+=20)monitor.tick(t);
  assert.ok(Math.abs(monitor.snapshot().fps-50)<.01);
  for(let t=2050;t<=4100;t+=50)monitor.tick(t);
  assert.ok(Math.abs(monitor.snapshot().fps-20)<.01);
  monitor.tick(10000);assert.equal(monitor.snapshot().fps,null);
});
test('AUTO requires sustained signals, cooldown, and longer upgrade dwell',()=>{
  const changes=[];const auto=new AdaptiveQuality({quality:'HIGH',onChange:q=>changes.push(q)});
  const low={samples:30,durationMs:2000,frameMs:50};
  auto.update(low,12000);auto.update(low,15500);assert.equal(auto.quality,'HIGH');
  auto.update(low,16000);assert.equal(auto.quality,'MEDIUM');
  auto.update(low,27000);assert.equal(changes.length,1);
  const high={samples:120,durationMs:2000,frameMs:14};
  auto.update(high,28000);auto.update(high,37000);assert.equal(auto.quality,'MEDIUM');
  auto.update(high,38000);assert.equal(auto.quality,'HIGH');
  auto.setMode('MEDIUM',40000);auto.update(low,80000);auto.update(low,90000);assert.equal(auto.quality,'MEDIUM');
});
test('one bad frame window cannot downgrade; software cap cannot upgrade',()=>{
  const auto=new AdaptiveQuality({quality:'HIGH',onChange:()=>{}});
  auto.update({samples:60,durationMs:2000,frameMs:50},12000);
  auto.update({samples:60,durationMs:2000,frameMs:20},12500);
  auto.update({samples:60,durationMs:2000,frameMs:50},15000);assert.equal(auto.quality,'HIGH');
  const soft=new AdaptiveQuality({quality:'LOW',maxQuality:'LOW',onChange:()=>{}});
  soft.setMode('HIGH',0);assert.equal(soft.quality,'LOW');
  soft.setMode('AUTO',0);soft.update({samples:120,durationMs:2000,frameMs:10},12000);
  soft.update({samples:120,durationMs:2000,frameMs:10},22000);assert.equal(soft.quality,'LOW');
});
