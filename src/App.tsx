import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ApiInputPanel } from './components/ApiInputPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { CurlImportModal } from './components/CurlImportModal';
import { InitialAppLoader } from './components/InitialAppLoader';
import { ApiDefinition, ReliabilityAnalysis } from './types';
import { ExampleApi } from './data/examples';
import { downloadJsonFile, downloadMarkdownFile, formatAnalysisToMarkdown } from './utils/exportUtils';

const DEFAULT_API_DEF: ApiDefinition = {
  method: 'POST',
  endpoint: '',
  pathParams: [],
  queryParams: [],
  headers: [
    { id: 'h-1', key: 'Content-Type', value: 'application/json', enabled: true },
    { id: 'h-2', key: 'Accept', value: 'application/json', enabled: true },
  ],
  auth: {
    type: 'none',
  },
  requestBody: '',
  expectedBehaviour: '',
  description: '',
};

export default function App() {
  const [apiDef, setApiDef] = useState<ApiDefinition>(DEFAULT_API_DEF);
  const [analysis, setAnalysis] = useState<ReliabilityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [isInitialBooting, setIsInitialBooting] = useState(true);
  const [mobileTab, setMobileTab] = useState<'definition' | 'report'>('definition');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle selecting a preconfigured example with deep copy to avoid state pollution
  const handleSelectExample = (example: ExampleApi) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const clonedDef: ApiDefinition = JSON.parse(JSON.stringify(example.definition));
    setApiDef(clonedDef);
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
    setMobileTab('definition');
  };

  // Handle cURL import
  const handleCurlImport = (parsed: Partial<ApiDefinition>) => {
    setApiDef((prev) => ({
      ...prev,
      method: parsed.method || prev.method,
      endpoint: parsed.endpoint || prev.endpoint,
      headers: parsed.headers && parsed.headers.length > 0 ? parsed.headers : prev.headers,
      queryParams: parsed.queryParams && parsed.queryParams.length > 0 ? parsed.queryParams : prev.queryParams,
      pathParams: parsed.pathParams && parsed.pathParams.length > 0 ? parsed.pathParams : prev.pathParams,
      requestBody: parsed.requestBody !== undefined ? parsed.requestBody : prev.requestBody,
      auth: parsed.auth || prev.auth,
    }));
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
  };

  // Handle Reset / New Analysis
  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setApiDef(JSON.parse(JSON.stringify(DEFAULT_API_DEF)));
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
    setMobileTab('definition');
  };

  // Save / Export actions
  const handleSaveSpec = () => {
    const filename = `api-spec-${apiDef.method.toLowerCase()}-${apiDef.endpoint.replace(/[^a-z0-9]/gi, '_') || 'contract'}.json`;
    downloadJsonFile(filename, apiDef);
  };

  const handleExportSuite = () => {
    if (!analysis) return;
    const filename = `reliability-test-suite-${apiDef.method.toLowerCase()}-${apiDef.endpoint.replace(/[^a-z0-9]/gi, '_') || 'report'}.md`;
    downloadMarkdownFile(filename, formatAnalysisToMarkdown(analysis));
  };

  // Primary Action: Analyze API with race condition and duplicate request guard
  const handleAnalyze = useCallback(async () => {
    if (isLoading) return;

    const trimmedEndpoint = apiDef.endpoint.trim();
    if (!trimmedEndpoint) {
      setError('Please provide a valid endpoint URL to analyze.');
      return;
    }

    // Cancel existing pending request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    // On mobile, switch to report view so user observes progress
    setMobileTab('report');

    try {
      const sanitizedDef: ApiDefinition = {
        ...apiDef,
        endpoint: trimmedEndpoint,
        pathParams: Array.isArray(apiDef.pathParams) ? apiDef.pathParams : [],
        queryParams: Array.isArray(apiDef.queryParams) ? apiDef.queryParams : [],
        headers: Array.isArray(apiDef.headers) ? apiDef.headers : [],
        auth: apiDef.auth || { type: 'none' },
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedDef),
        signal: controller.signal,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Server error occurred while analyzing the API.');
      }

      setAnalysis(json.data as ReliabilityAnalysis);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Ignored, user intentionally cancelled or restarted
        return;
      }
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to complete API reliability analysis. Please check your network connection and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [apiDef, isLoading]);

  // Global Keyboard Shortcut: Cmd/Ctrl + Enter to trigger analysis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnalyze]);

  const totalTests = analysis
    ? (analysis.positiveTests?.length || 0) +
      (analysis.negativeTests?.length || 0) +
      (analysis.edgeCases?.length || 0) +
      (analysis.validationChecks?.length || 0) +
      (analysis.authenticationChecks?.length || 0) +
      (analysis.authorizationChecks?.length || 0) +
      (analysis.securityChecks?.length || 0)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-slate-900 selection:bg-slate-200 selection:text-slate-900">
      {/* Shell Header */}
      <Header
        apiDef={apiDef}
        onSelectExample={handleSelectExample}
        onOpenImportModal={() => setCurlModalOpen(true)}
        onReset={handleReset}
        onSaveSpec={handleSaveSpec}
        onExportSuite={handleExportSuite}
        hasActiveAnalysis={Boolean(analysis)}
      />

      {/* Mobile Responsive Navigation Bar (visible below lg) */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 sticky top-[89px] z-20 shadow-2xs">
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMobileTab('definition')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all text-center ${
              mobileTab === 'definition'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. API Definition
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('report')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all text-center flex items-center justify-center gap-1.5 ${
              mobileTab === 'report'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>2. Reliability Report</span>
            {totalTests > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono font-bold">
                {totalTests}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace: Two-panel side-by-side on desktop (lg:), tab-switched on mobile */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* Left Panel: API Input Workspace (5 cols on lg) */}
          <div
            className={`lg:col-span-5 h-full flex flex-col min-h-[560px] ${
              mobileTab === 'definition' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <ApiInputPanel
              apiDef={apiDef}
              onChange={setApiDef}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
            />
          </div>

          {/* Right Panel: Analysis / Results Workspace (7 cols on lg) */}
          <div
            className={`lg:col-span-7 h-full flex flex-col min-h-[560px] ${
              mobileTab === 'report' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <ResultsPanel
              analysis={analysis}
              isLoading={isLoading}
              error={error}
              onRetry={handleAnalyze}
              onSelectExample={handleSelectExample}
            />
          </div>
        </div>
      </main>

      {/* Responsive Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 text-[11px] text-slate-500 text-center font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Kernel: v2.14.0-qa • SLA: 99.98%</span>
          <span>API Contract Shield © 2025</span>
        </div>
      </footer>

      {/* cURL Import Modal */}
      <CurlImportModal
        isOpen={curlModalOpen}
        onClose={() => setCurlModalOpen(false)}
        onImport={handleCurlImport}
      />

      {/* Retro Pixel Initial Loading Screen (6.5s duration with smooth transition) */}
      {isInitialBooting && (
        <InitialAppLoader
          durationMs={6500}
          onComplete={() => setIsInitialBooting(false)}
        />
      )}
    </div>
  );
}

