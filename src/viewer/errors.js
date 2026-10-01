// Normalize library rejections (Error, string, null) for readable UI error codes.
export function asViewerError(value, code) {
  const error = value instanceof Error ? value : new Error(String(value));
  // DOMException.code is read-only; cancellation must preserve its AbortError name.
  if (code !== undefined && error.name !== 'AbortError') error.code = code;
  return error;
}
