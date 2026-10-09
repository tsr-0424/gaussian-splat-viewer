import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameraViewFromUrl,withCameraView} from '../src/viewer/cameraView.js';
import {shareData} from '../src/ui/share.js';
test('camera links preserve the exact pose and project route for another visitor',()=>{
 const view={position:[1.23456789,1.6,-2.3],target:[-4,1.6,-9]};
 const href=withCameraView('https://example.com/viewer/?v=123#/viewer/he-aiyu/main',view);
 assert.deepEqual(cameraViewFromUrl(href),view);
 assert.equal(new URL(href).hash,'#/viewer/he-aiyu/main');
 assert.equal(new URL(href).searchParams.get('v'),'123');
 const other=new URL(href);other.hash='#/viewer/fenqihu-sign/main';assert.equal(cameraViewFromUrl(other.href),null);
 const shared=shareData('scan',href.replace('/viewer/','/viewer/debug/'),'/viewer/',view);
 assert.equal(new URL(shared.url).pathname,'/viewer/');assert.deepEqual(cameraViewFromUrl(shared.url),view);
});
test('malformed, nonfinite and coincident camera poses cannot override the default',()=>{
 for(const value of ['1,2,3','1,2,3,1,2,3','0,,0,0,0,-1','NaN,0,0,0,0,-1','Infinity,0,0,0,0,-1','1e100,0,0,0,0,-1'])
  assert.equal(cameraViewFromUrl(`https://example.com/?view=${encodeURIComponent(value)}`),null);
 assert.equal(cameraViewFromUrl('https://example.com/'),null);
});
