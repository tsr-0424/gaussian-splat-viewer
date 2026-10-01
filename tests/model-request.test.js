import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beginModelRequest} from '../src/viewer/modelRequest.js';
test('model request starts before renderer import settles and retains one original response',async()=>{
 const original=globalThis.fetch,calls=[],controller=new AbortController();let finish;
 globalThis.fetch=(url,options)=>{calls.push({url,options});return new Promise(resolve=>{finish=resolve;});};
 try{const request=beginModelRequest('https://example.com/original.ply',controller.signal);assert.equal(calls.length,1);assert.equal(request.events[0].phase,'request');assert.equal(calls[0].options.signal,controller.signal);const response={body:{originalStream:true}};finish(response);assert.equal(await request.promise,response);assert.equal(calls.length,1);}finally{globalThis.fetch=original;}
});
test('early rejection is retained for loader without an unhandled import-time rejection',async()=>{
 const original=globalThis.fetch,error=new DOMException('route disposed','AbortError');globalThis.fetch=()=>Promise.reject(error);
 try{const request=beginModelRequest('https://example.com/original.ply',new AbortController().signal);await assert.rejects(request.promise,value=>value===error);}finally{globalThis.fetch=original;}
});
