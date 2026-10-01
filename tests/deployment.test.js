import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateManifest} from '../scripts/manifest.js';
import {createCors} from '../scripts/cors.js';
import {NetworkDiagnostics} from '../src/performance/NetworkDiagnostics.js';
import {projectAssets} from '../scripts/projects.js';
const catalog={version:1,defaultModelId:'xinfuri',models:projectAssets(JSON.parse(readFileSync('config/projects.json','utf8')))};
test('local and production manifests choose different assets without exposing local paths',()=>{
  const local=generateManifest(catalog,{development:true});assert.equal(local.models[0].modelUrl,'/models/新福里.ply');
  const remote=generateManifest(catalog,{assetBase:'https://assets.example.com'});
  assert.ok(remote.models[0].modelUrl.startsWith('https://assets.example.com/projects/'));assert.ok(!('developmentUrl' in remote.models[0]));
  assert.equal(generateManifest(catalog).configurationRequired,true);
});
test('production manifest requires public HTTPS, avoids embedded credentials',()=>{
  assert.throws(()=>generateManifest(catalog,{assetBase:'http://assets.example.com'}));
  assert.throws(()=>generateManifest(catalog,{modelUrl:'https://user:password@example.com/model.ply'}));
  assert.throws(()=>generateManifest(catalog,{modelUrl:'https://example.com/model.ply?secret=token'}));
  assert.equal(generateManifest(catalog,{modelUrl:'https://cdn.example.com/other.spz'}).models[0].modelUrl,'https://cdn.example.com/other.spz');
});
test('Pages manifest uses repository subpath and immutable model hash without Release redirects',()=>{
 const result=generateManifest(catalog,{pages:true,siteBase:'/gaussian-splat-viewer/'});
 assert.equal(result.configurationRequired,false);
 assert.equal(result.models[0].modelUrl,`/gaussian-splat-viewer/models/${catalog.models[0].sha256}/xinfuri.ply`);
});
test('CORS confines read methods and origins while exposing loading/range headers',()=>{
  const [rule]=createCors(['https://viewer.example.com','http://localhost:5173']);
  assert.deepEqual(rule.AllowedMethods,['GET','HEAD']);assert.ok(rule.ExposeHeaders.includes('Content-Length'));
  assert.throws(()=>createCors(['*']));assert.throws(()=>createCors(['https://example.com/path']));
  assert.throws(()=>createCors(['http://remote.example.com']));
});
test('network metrics keep overlapping decode phases distinct and calculate observed throughput',()=>{
  const monitor=new NetworkDiagnostics();assert.equal(monitor.snapshot().decodeTailMs,null);
  monitor.record({phase:'request',at:100});monitor.record({phase:'headers',at:200});monitor.record({phase:'first-byte',at:300});
  monitor.record({phase:'download-complete',at:1200,bytes:1048576});monitor.record({phase:'decoded',at:1400});monitor.record({phase:'rendered',at:1500});
  const result=monitor.snapshot();assert.equal(result.throughputMiBs,1);assert.equal(result.decodeTailMs,200);
  assert.equal(result.downloadDecodeMs,1100);assert.equal(result.firstRenderedFrameMs,1500);
});
