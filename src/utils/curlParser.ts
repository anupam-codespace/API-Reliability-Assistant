import { ApiDefinition, HttpMethod, HeaderItem, ParamItem, AuthConfig } from '../types';

export function parseCurlCommand(rawCurl: string): Partial<ApiDefinition> {
  const clean = rawCurl.trim().replace(/\\\r?\n/g, ' ').replace(/\s+/g, ' ');

  // Extract Method (-X METHOD or --request METHOD)
  let method: HttpMethod = 'GET';
  const methodMatch = clean.match(/(?:-X|--request)\s+([A-Z]+)/i);
  if (methodMatch) {
    const matched = methodMatch[1].toUpperCase() as HttpMethod;
    if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(matched)) {
      method = matched;
    }
  }

  // Extract Body (-d, --data, --data-raw, --data-binary)
  let body = '';
  const bodyMatch = clean.match(/(?:-d|--data|--data-raw|--data-binary)\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^\s]+)/);
  if (bodyMatch) {
    let rawBody = bodyMatch[1].trim();
    if ((rawBody.startsWith("'") && rawBody.endsWith("'")) || (rawBody.startsWith('"') && rawBody.endsWith('"'))) {
      rawBody = rawBody.slice(1, -1);
    }
    try {
      const parsedJson = JSON.parse(rawBody);
      body = JSON.stringify(parsedJson, null, 2);
    } catch {
      body = rawBody;
    }
    // If body exists and method wasn't explicitly set to GET, default to POST
    if (!methodMatch && body) {
      method = 'POST';
    }
  }

  // Extract Headers (-H "Header: value" or --header "Header: value")
  const headers: HeaderItem[] = [];
  const headerRegex = /(?:-H|--header)\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))/g;
  let headerMatch: RegExpExecArray | null;
  let authConfig: AuthConfig = { type: 'none' };

  while ((headerMatch = headerRegex.exec(clean)) !== null) {
    const rawHeader = headerMatch[1] || headerMatch[2] || headerMatch[3];
    if (rawHeader) {
      const colonIndex = rawHeader.indexOf(':');
      if (colonIndex !== -1) {
        const key = rawHeader.slice(0, colonIndex).trim();
        const value = rawHeader.slice(colonIndex + 1).trim();

        if (key.toLowerCase() === 'authorization') {
          if (value.toLowerCase().startsWith('bearer ')) {
            authConfig = {
              type: 'bearer',
              tokenPlaceholder: 'YOUR_BEARER_TOKEN',
            };
          } else if (value.toLowerCase().startsWith('basic ')) {
            authConfig = {
              type: 'basic',
              username: 'username_placeholder',
            };
          } else {
            authConfig = {
              type: 'apiKey',
              headerName: 'Authorization',
              apiKeyValue: 'API_KEY_PLACEHOLDER',
            };
          }
        } else if (key.toLowerCase().includes('api-key') || key.toLowerCase().includes('x-api-key')) {
          authConfig = {
            type: 'apiKey',
            headerName: key,
            apiKeyValue: 'API_KEY_PLACEHOLDER',
          };
        } else {
          headers.push({
            id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            key,
            value,
            enabled: true,
          });
        }
      }
    }
  }

  // Extract URL (find url pattern or first quoted/unquoted arg that isn't a flag)
  let endpoint = '';
  // Match http(s) URL or relative /api/...
  const urlMatch = clean.match(/(?:'|")?(https?:\/\/[^\s'"]+|\/[a-zA-Z0-9_\-\/{}:]+)(?:'|")?/);
  if (urlMatch) {
    endpoint = urlMatch[1];
  }

  // Parse Query Parameters from endpoint if present
  const queryParams: ParamItem[] = [];
  if (endpoint.includes('?')) {
    const [baseUrl, queryString] = endpoint.split('?');
    endpoint = baseUrl;
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((val, k) => {
      queryParams.push({
        id: `qp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        key: k,
        value: val,
        enabled: true,
      });
    });
  }

  // Detect Path Parameters (e.g. {id}, :id)
  const pathParams: ParamItem[] = [];
  const pathParamMatches = endpoint.match(/\{([a-zA-Z0-9_]+)\}|:([a-zA-Z0-9_]+)/g);
  if (pathParamMatches) {
    pathParamMatches.forEach((match) => {
      const paramName = match.replace(/[{}:]/g, '');
      if (!pathParams.some((p) => p.key === paramName)) {
        pathParams.push({
          id: `pp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          key: paramName,
          value: '123',
          description: `Identifies target ${paramName}`,
          enabled: true,
        });
      }
    });
  }

  return {
    method,
    endpoint,
    headers,
    queryParams,
    pathParams,
    requestBody: body,
    auth: authConfig,
  };
}

export function generateCurlSnippet(api: ApiDefinition): string {
  let url = String(api.endpoint || '').trim() || 'https://api.example.com/v1/resource';

  const queryParams = Array.isArray(api.queryParams) ? api.queryParams : [];
  const headers = Array.isArray(api.headers) ? api.headers : [];
  const auth = api.auth || { type: 'none' };

  // Apply query params
  const activeQueryParams = queryParams.filter((qp) => qp && qp.enabled && qp.key && qp.key.trim());
  if (activeQueryParams.length > 0) {
    const qs = activeQueryParams
      .map((qp) => `${encodeURIComponent(qp.key)}=${encodeURIComponent(qp.value || 'VALUE')}`)
      .join('&');
    url += (url.includes('?') ? '&' : '?') + qs;
  }

  const method = api.method || 'GET';
  const parts: string[] = [`curl -X ${method} "${url}"`];

  // Auth header
  if (auth.type === 'bearer') {
    parts.push(`  -H "Authorization: Bearer ${auth.tokenPlaceholder || 'YOUR_ACCESS_TOKEN'}"`);
  } else if (auth.type === 'apiKey') {
    const hName = auth.headerName || 'X-API-Key';
    parts.push(`  -H "${hName}: ${auth.apiKeyValue || 'YOUR_API_KEY'}"`);
  } else if (auth.type === 'basic') {
    parts.push(`  -u "${auth.username || 'username'}:${auth.password || 'password'}"`);
  }

  // Active headers
  headers
    .filter((h) => h && h.enabled && h.key && h.key.trim())
    .forEach((h) => {
      parts.push(`  -H "${h.key}: ${h.value || ''}"`);
    });

  // Request body
  if (['POST', 'PUT', 'PATCH'].includes(method) && api.requestBody && String(api.requestBody).trim()) {
    // Add Content-Type if not in headers
    if (!headers.some((h) => h && h.key && h.key.toLowerCase() === 'content-type')) {
      parts.push(`  -H "Content-Type: application/json"`);
    }
    const singleLine = String(api.requestBody).replace(/\r?\n\s*/g, ' ');
    parts.push(`  -d '${singleLine}'`);
  }

  return parts.join(' \\\n');
}
