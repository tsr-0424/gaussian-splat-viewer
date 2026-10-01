import {readFile,mkdir,rename,unlink} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

// Runs at deployment time, never in the browser. Release URLs remain stable;
// temporary signed redirects are followed without persisting them.
const catalog=JSON.parse(await readFile('config/models.json','utf8'));
for(const model of catalog.models){
 if(!model.releaseUrl?.startsWith('https://github.com/')||!model.releaseUrl.includes('/releases/download/'))throw new Error(`Missing Release URL: ${model.id}`);
 if(!/^[a-f0-9]{64}$/.test(model.sha256)||!Number.isSafeInteger(model.sizeBytes))throw new Error('Invalid model integrity metadata');
 const folder=join('dist','models',model.sha256);await mkdir(folder,{recursive:true});
 const target=join(folder,`${model.id}.${model.format}`),temporary=target+'.part';
 const response=await fetch(model.releaseUrl,{signal:AbortSignal.timeout(600000)});
 if(!response.ok||!response.body)throw new Error(`Release download HTTP ${response.status}`);
 let bytes=0;const hash=createHash('sha256');
 try{
 await pipeline(Readable.fromWeb(response.body),new Transform({transform(chunk,encoding,done){bytes+=chunk.length;if(bytes>model.sizeBytes)return done(new Error('Model exceeds expected size'));hash.update(chunk);done(null,chunk);}}),createWriteStream(temporary));
 if(bytes!==model.sizeBytes||hash.digest('hex')!==model.sha256)throw new Error('Model integrity mismatch');
 await rename(temporary,target);console.log(`Verified ${model.id}: ${bytes} bytes, SHA256 matches`);
 }catch(error){await unlink(temporary).catch(()=>{});throw error;}
}
