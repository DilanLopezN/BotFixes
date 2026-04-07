export function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    function (key, val) {
      if (val != null && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular Reference]';
        }
        seen.add(val);
      }
      return val;
    },
    space,
  );
}

const PROBLEMATIC_KEYS = new Set([
  'socket',
  'parser',
  'req',
  'res',
  'request',
  'response',
  '_readableState',
  '_writableState',
  '_events',
  '_eventsCount',
  'connection',
  'client',
  'agent',
  'config',
  'adapter',
  'transformRequest',
  'transformResponse',
  'validateStatus',
  'maxRedirects',
  'timeout',
  'httpAgent',
  'httpsAgent',
  'auth',
  'proxy',
  'cancelToken',
  'decompress',
]);

function sanitizeRecursively(obj: any, depth: number = 0, maxDepth: number = 20): any {
  if (depth > maxDepth) return '[Max Depth Reached]';
  if (obj == null) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date || obj instanceof RegExp) return obj;
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      code: (obj as any).code,
      status: (obj as any).status,
      statusText: (obj as any).statusText,
    };
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map((item) => sanitizeRecursively(item, depth + 1, maxDepth));
  }

  if (obj?.toJSON && typeof obj?.toJSON === 'function') {
    try {
      return sanitizeRecursively(obj.toJSON(), depth + 1, maxDepth);
    } catch {}
  }

  const sanitized: any = {};
  let keys: string[];

  try {
    keys = Object.keys(obj).slice(0, 100);
  } catch {
    return '[Object - Cannot enumerate keys]';
  }

  for (const key of keys) {
    if (PROBLEMATIC_KEYS.has(key)) {
      continue;
    }

    try {
      const value = obj[key];

      if (typeof value === 'string' && value.length > 1500) {
        sanitized[key] = value.substring(0, 1500) + '... [truncated]';
      } else {
        sanitized[key] = sanitizeRecursively(value, depth + 1, maxDepth);
      }
    } catch {
      sanitized[key] = '[Sanitization Error]';
    }
  }

  return sanitized;
}

export function sanitizeObject(obj: any): any {
  try {
    return sanitizeRecursively(obj);
  } catch (error) {
    return { error: 'Failed to sanitize object' };
  }
}
