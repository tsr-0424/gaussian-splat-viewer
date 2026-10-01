import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asViewerError } from '../src/viewer/errors.js';
test('decoder string and null rejections become coded Error objects',()=>{
  const error=asViewerError('Invalid PLY file','INVALID_MODEL');
  assert.ok(error instanceof Error);assert.equal(error.message,'Invalid PLY file');assert.equal(error.code,'INVALID_MODEL');
  assert.ok(asViewerError(null,'INVALID_MODEL') instanceof Error);
});
test('native errors retain diagnostic stack and AbortError identity',()=>{
  const original=new Error('network failed');const result=asViewerError(original,'DOWNLOAD_FAILED');
  assert.equal(result,original);assert.equal(result.code,'DOWNLOAD_FAILED');assert.ok(result.stack);
  const abort=new DOMException('Aborted','AbortError');assert.equal(asViewerError(abort,undefined).name,'AbortError');
});
