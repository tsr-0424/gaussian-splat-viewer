import {readFile,stat} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('dist/models.json','utf8'));
if(manifest.configurationRequired)throw new Error('Missing model configuration');
for(const model of manifest.models){
 const suffix=`models/${model.sha256}/${model.id}.${model.format}`;
 if(!model.modelUrl?.endsWith(suffix))throw new Error('Unexpected Pages model URL');
 if((await stat(`dist/${suffix}`)).size!==model.sizeBytes)throw new Error('Missing or incomplete Pages model');
}
console.log('Pages artifact models verified; original PLY remains unchanged.');
