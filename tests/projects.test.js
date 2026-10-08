import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateProjects,projectAssets} from '../scripts/projects.js';
import {parseRoute,projectLink,viewerLink} from '../src/routing.js';
import {shareData} from '../src/ui/share.js';
const catalog=JSON.parse(readFileSync('config/projects.json','utf8'));
test('static catalog adds a second project without viewer source changes and preserves Pages subpath',()=>{
 const fixture=structuredClone(catalog);const second=structuredClone(fixture.projects[0]);second.id='my-room';second.title='我的房間';delete second.scans[0].assetId;second.thumbnail='thumbnails/room.webp';fixture.projects.push(second);
 const result=generateProjects(fixture,{pages:true,siteBase:'/gaussian-splat-viewer/'});
 const added=result.projects.at(-1);
 assert.equal(result.projects.length,catalog.projects.length+1);assert.equal(added.thumbnail,'/gaussian-splat-viewer/thumbnails/room.webp');
 assert.ok(added.scans[0].modelUrl.endsWith('/my-room--main.ply'));assert.ok(!('developmentUrl' in added.scans[0]));
 assert.equal(generateProjects(fixture,{development:true}).projects[0].scans[0].modelUrl,'/models/新福里.ply');
});
test('invalid catalog paths, duplicate identities, integrity metadata and cameras are rejected before publishing',()=>{
 const duplicate=structuredClone(catalog);duplicate.projects.push(duplicate.projects[0]);assert.throws(()=>projectAssets(duplicate));
 const traversal=structuredClone(catalog);traversal.projects[0].scans[0].assetId='../outside';assert.throws(()=>projectAssets(traversal));
 const camera=structuredClone(catalog);camera.projects[0].scans[0].defaultCamera={position:[0,0,0],target:[0,NaN,0]};assert.throws(()=>projectAssets(camera));
 const image=structuredClone(catalog);image.projects[0].thumbnail='../private.png';assert.throws(()=>generateProjects(image));
});
test('hash routes survive static hosting and malformed paths cannot resolve a scan',()=>{
 assert.deepEqual(parseRoute('#/'),{type:'gallery'});
 assert.deepEqual(parseRoute(projectLink('xinfuri')),{type:'project',projectId:'xinfuri'});
 assert.deepEqual(parseRoute(viewerLink('xinfuri','main')),{type:'viewer',projectId:'xinfuri',scanId:'main'});
 assert.equal(parseRoute('#/viewer/%broken/main').type,'missing');assert.equal(parseRoute('#/viewer/xinfuri/main/extra').type,'missing');
 assert.deepEqual(parseRoute('','?model=xinfuri'),{type:'legacy',id:'xinfuri'});
});
test('a debug benchmark session shares the normal project/scan URL',()=>{
 const data=shareData('新福里 / 主掃描','https://tsr-0424.github.io/gaussian-splat-viewer/debug/#/viewer/xinfuri/main','/gaussian-splat-viewer/');
 assert.equal(data.url,'https://tsr-0424.github.io/gaussian-splat-viewer/#/viewer/xinfuri/main');
 assert.equal(shareData('scan','http://127.0.0.1:5174/#/viewer/xinfuri/main').url,'http://127.0.0.1:5174/#/viewer/xinfuri/main');
});
