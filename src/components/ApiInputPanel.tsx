import React, { useState } from 'react';
import { ApiDefinition, HttpMethod, AuthType, HeaderItem, ParamItem, ValidationRule } from '../types';
import { generateCurlSnippet } from '../utils/curlParser';
import { copyToClipboard } from '../utils/clipboard';

interface ApiInputPanelProps {
  apiDef: ApiDefinition;
  onChange: (updated: ApiDefinition) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

type TabType = 'body' | 'headers' | 'query' | 'path' | 'auth' | 'rules';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const ApiInputPanel: React.FC<ApiInputPanelProps> = ({
  apiDef,
  onChange,
  onAnalyze,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('body');
  const [jsonFormatError, setJsonFormatError] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [showCurlPreview, setShowCurlPreview] = useState(false);

  const handleMethodChange = (m: HttpMethod) => {
    onChange({ ...apiDef, method: m });
  };

  const handleEndpointChange = (val: string) => {
    onChange({ ...apiDef, endpoint: val });
  };

  // Body JSON formatting
  const handleFormatJson = () => {
    if (!apiDef.requestBody?.trim()) return;
    try {
      const parsed = JSON.parse(apiDef.requestBody);
      onChange({ ...apiDef, requestBody: JSON.stringify(parsed, null, 2) });
      setJsonFormatError(null);
    } catch (err: unknown) {
      setJsonFormatError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  // Path Param handlers
  const handleAddPathParam = () => {
    const newParam: ParamItem = {
      id: `pp-${Date.now()}`,
      key: '',
      value: '',
      description: '',
      enabled: true,
    };
    onChange({ ...apiDef, pathParams: [...apiDef.pathParams, newParam] });
  };

  const handleUpdatePathParam = (id: string, updates: Partial<ParamItem>) => {
    onChange({
      ...apiDef,
      pathParams: apiDef.pathParams.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  const handleRemovePathParam = (id: string) => {
    onChange({
      ...apiDef,
      pathParams: apiDef.pathParams.filter((p) => p.id !== id),
    });
  };

  // Query Param handlers
  const handleAddQueryParam = () => {
    const newParam: ParamItem = {
      id: `qp-${Date.now()}`,
      key: '',
      value: '',
      description: '',
      enabled: true,
    };
    onChange({ ...apiDef, queryParams: [...apiDef.queryParams, newParam] });
  };

  const handleUpdateQueryParam = (id: string, updates: Partial<ParamItem>) => {
    onChange({
      ...apiDef,
      queryParams: apiDef.queryParams.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  const handleRemoveQueryParam = (id: string) => {
    onChange({
      ...apiDef,
      queryParams: apiDef.queryParams.filter((p) => p.id !== id),
    });
  };

  // Header handlers
  const handleAddHeader = () => {
    const newHeader: HeaderItem = {
      id: `h-${Date.now()}`,
      key: '',
      value: '',
      enabled: true,
    };
    onChange({ ...apiDef, headers: [...apiDef.headers, newHeader] });
  };

  const handleUpdateHeader = (id: string, updates: Partial<HeaderItem>) => {
    onChange({
      ...apiDef,
      headers: apiDef.headers.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    });
  };

  const handleRemoveHeader = (id: string) => {
    onChange({
      ...apiDef,
      headers: apiDef.headers.filter((h) => h.id !== id),
    });
  };

  const handleAddCommonHeader = (key: string, value: string) => {
    if (apiDef.headers.some((h) => h.key.toLowerCase() === key.toLowerCase())) return;
    onChange({
      ...apiDef,
      headers: [...apiDef.headers, { id: `h-${Date.now()}`, key, value, enabled: true }],
    });
  };

  const handleAuthTypeChange = (type: AuthType) => {
    onChange({
      ...apiDef,
      auth: {
        ...apiDef.auth,
        type,
      },
    });
  };

  const handleAddValidationRule = () => {
    const newRule: ValidationRule = {
      id: `rule-${Date.now()}`,
      field: 'email',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      description: 'Enforce valid email pattern',
      enabled: true,
    };
    onChange({
      ...apiDef,
      validationRules: [...(apiDef.validationRules || []), newRule],
    });
  };

  const handleUpdateValidationRule = (id: string, updates: Partial<ValidationRule>) => {
    onChange({
      ...apiDef,
      validationRules: (apiDef.validationRules || []).map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  const handleDeleteValidationRule = (id: string) => {
    onChange({
      ...apiDef,
      validationRules: (apiDef.validationRules || []).filter((r) => r.id !== id),
    });
  };

  const handleCopyCurl = async () => {
    const snippet = generateCurlSnippet(apiDef);
    const success = await copyToClipboard(snippet);
    if (success) {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  const isEndpointEmpty = !String(apiDef.endpoint || '').trim();
  const hasInvalidJson = Boolean(
    apiDef.requestBody?.trim() &&
      (() => {
        try {
          JSON.parse(apiDef.requestBody);
          return false;
        } catch {
          return true;
        }
      })()
  );

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
      {/* Top Method & Endpoint */}
      <div className="p-4 border-b border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900 tracking-tight">
            API Request Definition
          </span>
          <button
            type="button"
            onClick={() => setShowCurlPreview((p) => !p)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            {showCurlPreview ? 'Hide cURL' : 'View cURL'}
          </button>
        </div>

        <div className="flex items-stretch gap-2">
          {/* HTTP Method */}
          <div className="shrink-0">
            <select
              id="select-http-method"
              value={apiDef.method}
              aria-label="HTTP Method"
              onChange={(e) => handleMethodChange(e.target.value as HttpMethod)}
              className="h-9 px-2.5 rounded-md bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-400 cursor-pointer shadow-2xs"
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m} className="bg-white text-slate-900">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Endpoint Input */}
          <div className="flex-1">
            <input
              id="input-endpoint-url"
              type="text"
              value={apiDef.endpoint}
              onChange={(e) => handleEndpointChange(e.target.value)}
              placeholder="https://api.example.com/v1/resource"
              aria-label="Endpoint URL"
              className="w-full h-9 px-3 bg-slate-50/70 border border-slate-200 rounded-md text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* cURL preview box */}
        {showCurlPreview && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 text-slate-400">
              <span className="text-[11px]">cURL Representation</span>
              <button
                type="button"
                onClick={handleCopyCurl}
                className="text-[11px] text-slate-300 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 transition-colors"
              >
                {copiedCurl ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap select-all text-slate-200 leading-relaxed">
              {generateCurlSnippet(apiDef)}
            </pre>
          </div>
        )}
      </div>

      {/* Sub-tabs Bar (Text Only, No Decorative Icons) */}
      <div className="border-b border-slate-200 bg-white px-3 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'body'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Request Body
          {apiDef.requestBody?.trim() && (
            <span className="ml-1 text-[10px] text-slate-400">•</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'headers'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Headers ({apiDef.headers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('query')}
          className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'query'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Query Parameters ({apiDef.queryParams.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('path')}
          className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'path'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Path Parameters ({apiDef.pathParams.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auth')}
          className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'auth'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Authentication
          {apiDef.auth.type !== 'none' && (
            <span className="ml-1 text-[10px] text-slate-500 font-semibold">({apiDef.auth.type})</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Expected Behaviour
        </button>
      </div>

      {/* Tab Panels Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
        {/* TAB 1: REQUEST BODY */}
        {activeTab === 'body' && (
          <div className="space-y-2 h-full flex flex-col text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                JSON Body {['GET', 'DELETE'].includes(apiDef.method) ? '(optional for ' + apiDef.method + ')' : '(recommended)'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFormatJson}
                  disabled={!apiDef.requestBody?.trim()}
                  className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 disabled:opacity-40 rounded text-xs font-medium transition-colors"
                >
                  Format JSON
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...apiDef, requestBody: '' })}
                  disabled={!apiDef.requestBody?.trim()}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 disabled:opacity-40 rounded text-xs font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              id="textarea-request-body"
              value={apiDef.requestBody}
              onChange={(e) => {
                onChange({ ...apiDef, requestBody: e.target.value });
                setJsonFormatError(null);
              }}
              placeholder='{\n  "key": "value"\n}'
              className="w-full flex-1 min-h-[240px] p-3 bg-slate-50/70 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400 transition-colors resize-y leading-relaxed"
            />

            {jsonFormatError ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                Invalid JSON: {jsonFormatError}
              </div>
            ) : hasInvalidJson ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                Syntax error: Request Body contains invalid JSON syntax.
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: HEADERS (Tabular) */}
        {activeTab === 'headers' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Request Headers</span>
              <button
                type="button"
                onClick={handleAddHeader}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors shadow-2xs"
              >
                + Add Header
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px]">Quick add:</span>
              <button
                type="button"
                onClick={() => handleAddCommonHeader('Content-Type', 'application/json')}
                className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono shadow-2xs"
              >
                Content-Type: application/json
              </button>
              <button
                type="button"
                onClick={() => handleAddCommonHeader('Accept', 'application/json')}
                className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono shadow-2xs"
              >
                Accept: application/json
              </button>
              <button
                type="button"
                onClick={() => handleAddCommonHeader('Idempotency-Key', 'idem_key_123')}
                className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono shadow-2xs"
              >
                Idempotency-Key
              </button>
            </div>

            {apiDef.headers.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-400">
                No headers configured.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 w-8">Active</th>
                    <th className="pb-2 font-medium">Header Name</th>
                    <th className="pb-2 font-medium">Header Value</th>
                    <th className="pb-2 w-12 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {apiDef.headers.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={h.enabled}
                          onChange={(e) => handleUpdateHeader(h.id, { enabled: e.target.checked })}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={h.key}
                          placeholder="Header-Name"
                          onChange={(e) => handleUpdateHeader(h.id, { key: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={h.value}
                          placeholder="value"
                          onChange={(e) => handleUpdateHeader(h.id, { value: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400"
                        />
                      </td>
                      <td className="py-2 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleRemoveHeader(h.id)}
                          className="text-slate-400 hover:text-rose-600 text-xs px-1.5 py-0.5 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: QUERY PARAMETERS (Tabular) */}
        {activeTab === 'query' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">URL Query Parameters (?key=value)</span>
              <button
                type="button"
                onClick={handleAddQueryParam}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors shadow-2xs"
              >
                + Add Query Param
              </button>
            </div>

            {apiDef.queryParams.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-400">
                No query parameters configured.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 w-8">Active</th>
                    <th className="pb-2 font-medium">Parameter Key</th>
                    <th className="pb-2 font-medium">Sample Value</th>
                    <th className="pb-2 w-12 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {apiDef.queryParams.map((qp) => (
                    <tr key={qp.id}>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={qp.enabled}
                          onChange={(e) => handleUpdateQueryParam(qp.id, { enabled: e.target.checked })}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={qp.key}
                          placeholder="e.g. limit"
                          onChange={(e) => handleUpdateQueryParam(qp.id, { key: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={qp.value}
                          placeholder="e.g. 50"
                          onChange={(e) => handleUpdateQueryParam(qp.id, { value: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400"
                        />
                      </td>
                      <td className="py-2 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleRemoveQueryParam(qp.id)}
                          className="text-slate-400 hover:text-rose-600 text-xs px-1.5 py-0.5 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 4: PATH PARAMETERS (Tabular) */}
        {activeTab === 'path' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Path Variables (e.g. &#123;id&#125; in endpoint)</span>
              <button
                type="button"
                onClick={handleAddPathParam}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors shadow-2xs"
              >
                + Add Path Param
              </button>
            </div>

            {apiDef.pathParams.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-400">
                No path parameters configured. (e.g. `orderId` in `/api/orders/&#123;orderId&#125;`)
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 w-8">Active</th>
                    <th className="pb-2 font-medium">Variable Name</th>
                    <th className="pb-2 font-medium">Sample Value</th>
                    <th className="pb-2 w-12 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {apiDef.pathParams.map((pp) => (
                    <tr key={pp.id}>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={pp.enabled}
                          onChange={(e) => handleUpdatePathParam(pp.id, { enabled: e.target.checked })}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={pp.key}
                          placeholder="e.g. orderId"
                          onChange={(e) => handleUpdatePathParam(pp.id, { key: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={pp.value}
                          placeholder="e.g. ord_123"
                          onChange={(e) => handleUpdatePathParam(pp.id, { value: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400"
                        />
                      </td>
                      <td className="py-2 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleRemovePathParam(pp.id)}
                          className="text-slate-400 hover:text-rose-600 text-xs px-1.5 py-0.5 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 5: AUTHENTICATION */}
        {activeTab === 'auth' && (
          <div className="space-y-3 text-xs">
            <span className="text-slate-500 block">
              Authentication Method (Use placeholder tokens only)
            </span>

            {/* Auth Type Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['none', 'bearer', 'apiKey', 'basic'] as AuthType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAuthTypeChange(type)}
                  className={`p-2.5 text-xs text-center rounded-lg border transition-colors ${
                    apiDef.auth.type === type
                      ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="capitalize">{type === 'apiKey' ? 'API Key' : type}</div>
                </button>
              ))}
            </div>

            {apiDef.auth.type === 'bearer' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-slate-700 font-medium">Bearer Token (Placeholder)</label>
                <input
                  type="text"
                  value={apiDef.auth.tokenPlaceholder || ''}
                  onChange={(e) =>
                    onChange({
                      ...apiDef,
                      auth: { ...apiDef.auth, tokenPlaceholder: e.target.value },
                    })
                  }
                  placeholder="YOUR_ACCESS_TOKEN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:border-slate-400"
                />
              </div>
            )}

            {apiDef.auth.type === 'apiKey' && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Header Name</label>
                  <input
                    type="text"
                    value={apiDef.auth.headerName || ''}
                    onChange={(e) =>
                      onChange({
                        ...apiDef,
                        auth: { ...apiDef.auth, headerName: e.target.value },
                      })
                    }
                    placeholder="X-API-Key"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Key Value (Placeholder)</label>
                  <input
                    type="text"
                    value={apiDef.auth.apiKeyValue || ''}
                    onChange={(e) =>
                      onChange({
                        ...apiDef,
                        auth: { ...apiDef.auth, apiKeyValue: e.target.value },
                      })
                    }
                    placeholder="YOUR_API_KEY"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>
            )}

            {apiDef.auth.type === 'basic' && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Username</label>
                  <input
                    type="text"
                    value={apiDef.auth.username || ''}
                    onChange={(e) =>
                      onChange({
                        ...apiDef,
                        auth: { ...apiDef.auth, username: e.target.value },
                      })
                    }
                    placeholder="user_placeholder"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Password</label>
                  <input
                    type="text"
                    value={apiDef.auth.password || ''}
                    onChange={(e) =>
                      onChange({
                        ...apiDef,
                        auth: { ...apiDef.auth, password: e.target.value },
                      })
                    }
                    placeholder="pass_placeholder"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: EXPECTED BEHAVIOUR, DESCRIPTION & REGEX VALIDATION RULES */}
        {activeTab === 'rules' && (
          <div className="space-y-4 text-xs">
            <div>
              <label htmlFor="textarea-expected-behaviour" className="block text-slate-700 font-medium mb-1">
                Expected Behaviour (Optional)
              </label>
              <textarea
                id="textarea-expected-behaviour"
                rows={3}
                value={apiDef.expectedBehaviour}
                onChange={(e) => onChange({ ...apiDef, expectedBehaviour: e.target.value })}
                placeholder="Describe business rules, required fields, status codes, and constraints to guide the analysis."
                className="w-full bg-slate-50/70 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400 leading-relaxed"
              />
            </div>

            {/* Field Validation Patterns (Regex) Section */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Field Validation Patterns (Regex)</span>
                  <span className="text-[11px] text-slate-500">
                    Enforce specific regex formats for fields (e.g. email, UUID, phone) in test generation.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddValidationRule}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  + Add Regex Pattern
                </button>
              </div>

              {(!apiDef.validationRules || apiDef.validationRules.length === 0) ? (
                <div className="p-3 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                  No regex validation patterns defined. Click "+ Add Regex Pattern" to enforce formats like email or phone.
                </div>
              ) : (
                <div className="space-y-2">
                  {apiDef.validationRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) =>
                            handleUpdateValidationRule(rule.id, { enabled: e.target.checked })
                          }
                          className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={rule.field}
                          onChange={(e) =>
                            handleUpdateValidationRule(rule.id, { field: e.target.value })
                          }
                          placeholder="Field name (e.g. email)"
                          className="w-28 bg-white border border-slate-200 rounded px-2 py-1 font-mono text-xs text-slate-800 focus:outline-hidden focus:border-slate-400"
                        />
                        <input
                          type="text"
                          value={rule.pattern}
                          onChange={(e) =>
                            handleUpdateValidationRule(rule.id, { pattern: e.target.value })
                          }
                          placeholder="Regex pattern e.g. ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 font-mono text-xs text-slate-800 focus:outline-hidden focus:border-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteValidationRule(rule.id)}
                          className="px-2 py-1 text-slate-400 hover:text-rose-600 rounded text-xs transition-colors cursor-pointer"
                          aria-label="Delete rule"
                        >
                          ✕
                        </button>
                      </div>
                      {rule.description && (
                        <p className="text-[11px] text-slate-500 pl-6">{rule.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="textarea-description" className="block text-slate-700 font-medium mb-1">
                API Description (Optional)
              </label>
              <textarea
                id="textarea-description"
                rows={2}
                value={apiDef.description || ''}
                onChange={(e) => onChange({ ...apiDef, description: e.target.value })}
                placeholder="High-level background or microservice description."
                className="w-full bg-slate-50/70 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Bar */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2">
        {isEndpointEmpty && (
          <div className="text-xs text-slate-500">
            Enter an Endpoint URL to enable analysis.
          </div>
        )}

        {hasInvalidJson && (
          <div className="text-xs text-rose-600 font-medium">
            Request Body contains invalid JSON syntax.
          </div>
        )}

        <button
          id="btn-analyze-api"
          type="button"
          disabled={isEndpointEmpty || hasInvalidJson || isLoading}
          onClick={onAnalyze}
          className="w-full h-10 flex items-center justify-center font-medium text-xs text-white bg-slate-900 hover:bg-black active:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          {isLoading ? 'Analyzing API Reliability...' : 'Analyze API'}
        </button>
      </div>
    </div>
  );
};
