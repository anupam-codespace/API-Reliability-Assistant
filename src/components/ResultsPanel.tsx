import React, { useState, useMemo } from 'react';
import { Copy, Check, Filter } from 'lucide-react';
import {
  ReliabilityAnalysis,
  TestCase,
  RiskLevel,
} from '../types';
import { TestCaseCard } from './TestCaseCard';
import { StatusCodesView } from './StatusCodesView';
import { SampleRequestsView } from './SampleRequestsView';
import { ObservationsView } from './ObservationsView';
import { AnalysisLoading } from './AnalysisLoading';
import { EmptyState } from './EmptyState';
import { ExampleApi } from '../data/examples';
import { copyToClipboard } from '../utils/clipboard';

interface ResultsPanelProps {
  analysis: ReliabilityAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectExample: (example: ExampleApi) => void;
}

type MainViewTab = 'tests' | 'security' | 'status-codes' | 'sample-requests' | 'observations';

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  analysis,
  isLoading,
  error,
  onRetry,
  onSelectExample,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<MainViewTab>('tests');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [copiedAll, setCopiedAll] = useState(false);

  // Group all tests into a flat list
  const allTests = useMemo(() => {
    if (!analysis) return [];
    return [
      ...(analysis.positiveTests || []),
      ...(analysis.negativeTests || []),
      ...(analysis.edgeCases || []),
      ...(analysis.validationChecks || []),
      ...(analysis.authenticationChecks || []),
      ...(analysis.authorizationChecks || []),
      ...(analysis.securityChecks || []),
    ];
  }, [analysis]);

  // Security & Auth specific tests
  const securityTests = useMemo(() => {
    if (!analysis) return [];
    return [
      ...(analysis.securityChecks || []),
      ...(analysis.authorizationChecks || []),
      ...(analysis.authenticationChecks || []),
    ];
  }, [analysis]);

  // Current list based on active tab
  const currentTabTests = activeMainTab === 'security' ? securityTests : allTests;

  // Expand all / Collapse all toggle
  const isAllCurrentExpanded =
    currentTabTests.length > 0 &&
    currentTabTests.every((t, idx) => expandedCardIds.has(t.id || `tc-${idx}`));

  const handleToggleExpandAll = () => {
    if (isAllCurrentExpanded) {
      setExpandedCardIds((prev) => {
        const next = new Set(prev);
        currentTabTests.forEach((t, idx) => next.delete(t.id || `tc-${idx}`));
        return next;
      });
    } else {
      setExpandedCardIds((prev) => {
        const next = new Set(prev);
        currentTabTests.forEach((t, idx) => next.add(t.id || `tc-${idx}`));
        return next;
      });
    }
  };

  const handleToggleCard = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter tests based on category, severity, search
  const filteredTests = useMemo(() => {
    const listToFilter = activeMainTab === 'security' ? securityTests : allTests;

    return listToFilter.filter((test) => {
      if (activeMainTab === 'tests' && selectedCategory !== 'all' && test.category !== selectedCategory) {
        return false;
      }
      if (selectedSeverity !== 'all' && test.severity !== selectedSeverity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = String(test.id || '').toLowerCase().includes(q);
        const matchesScenario = String(test.scenario || '').toLowerCase().includes(q);
        const reqStr =
          typeof test.request === 'object' && test.request !== null
            ? JSON.stringify(test.request)
            : String(test.request || '');
        const matchesReq = reqStr.toLowerCase().includes(q);
        const matchesStatus = String(test.expectedStatus || '').toLowerCase().includes(q);
        if (!matchesId && !matchesScenario && !matchesReq && !matchesStatus) {
          return false;
        }
      }
      return true;
    });
  }, [allTests, securityTests, activeMainTab, selectedCategory, selectedSeverity, searchQuery]);

  // Export all tests aggregated by category into a formatted text block
  const handleCopyAllTests = async () => {
    if (!analysis) return;
    const metaMethod = analysis.meta?.method || 'API';
    const metaEndpoint = analysis.meta?.endpoint || '';
    const metaGenerated = analysis.meta?.generatedAt
      ? new Date(analysis.meta.generatedAt).toLocaleString()
      : new Date().toLocaleString();

    const categoriesList: { name: string; tests: TestCase[] }[] = [
      { name: 'Positive Tests', tests: analysis.positiveTests || [] },
      { name: 'Negative Tests', tests: analysis.negativeTests || [] },
      { name: 'Edge & Boundary Tests', tests: analysis.edgeCases || [] },
      { name: 'Validation Checks', tests: analysis.validationChecks || [] },
      { name: 'Authentication Checks', tests: analysis.authenticationChecks || [] },
      { name: 'Authorization Checks', tests: analysis.authorizationChecks || [] },
      { name: 'Security Checks', tests: analysis.securityChecks || [] },
    ];

    let output = `================================================================================
API RELIABILITY TEST SUITE: ALL TEST CASES (${allTests.length} Total)
API: ${metaMethod} ${metaEndpoint}
Generated: ${metaGenerated}
Reliability Score: ${analysis.reliabilityScore}/100 | Risk Level: ${analysis.riskLevel}
================================================================================

SUMMARY:
${analysis.summary}

`;

    categoriesList.forEach((cat) => {
      output += `================================================================================
[CATEGORY] ${cat.name.toUpperCase()} (${cat.tests.length} Test Cases)
================================================================================\n\n`;

      if (cat.tests.length === 0) {
        output += `(No test cases generated for this category)\n\n`;
      } else {
        cat.tests.forEach((t, idx) => {
          const reqStr =
            typeof t.request === 'object' && t.request !== null
              ? JSON.stringify(t.request, null, 2)
              : String(t.request || '');

          output += `[${t.id || `TC-${idx + 1}`}] ${t.scenario || 'Scenario'}
- Category: ${t.category || cat.name}
- Severity: ${t.severity || 'Medium'}
- Expected Status: ${String(t.expectedStatus || '200 OK')}
- Expected Behaviour: ${String(t.expectedBehaviour || '')}
- Rationale: ${String(t.rationale || '')}
- Payload / Request:
${reqStr}

--------------------------------------------------------------------------------
`;
        });
        output += `\n`;
      }
    });

    if (analysis.statusCodes && analysis.statusCodes.length > 0) {
      output += `================================================================================
HTTP STATUS CODE EXPECTATIONS (${analysis.statusCodes.length} Scenarios)
================================================================================\n`;
      analysis.statusCodes.forEach((sc) => {
        output += `- ${sc.expectedStatus}: ${sc.scenario} (${sc.reason})\n`;
      });
      output += `\n`;
    }

    const success = await copyToClipboard(output);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'High':
        return 'text-rose-700 font-semibold';
      case 'Medium':
        return 'text-amber-700 font-semibold';
      case 'Low':
      default:
        return 'text-emerald-700 font-semibold';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700';
    if (score >= 60) return 'text-amber-700';
    return 'text-rose-700';
  };

  // 1. Loading State
  if (isLoading) {
    return <AnalysisLoading />;
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 lg:p-12 h-full min-h-[420px] bg-white border border-slate-200/90 rounded-xl shadow-xs text-center space-y-4 text-xs">
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-sm font-semibold text-slate-900">Analysis Failed</h3>
          <p className="text-slate-600 leading-relaxed">{error}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 font-medium text-white bg-slate-900 hover:bg-black rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (!analysis) {
    return <EmptyState onSelectExample={onSelectExample} />;
  }

  // 4. Active Results Panel
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
      {/* 1. Reliability Summary & Score Header */}
      <div className="p-4 border-b border-slate-200 bg-white space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap font-mono">
              <span className="font-bold text-slate-800 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">
                {analysis.meta?.method || 'POST'}
              </span>
              <span className="text-slate-800 font-semibold truncate max-w-md">
                {analysis.meta?.endpoint || ''}
              </span>
            </div>

            {/* Executive Summary */}
            <p className="text-slate-600 leading-relaxed text-xs">
              <strong className="text-slate-900 font-semibold mr-1">Reliability Summary:</strong>
              {analysis.summary}
            </p>
          </div>

          {/* Key Metrics: Reliability Score, Risk Level, Test Count */}
          <div className="flex items-center gap-2 shrink-0 self-start">
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] uppercase text-slate-400 font-medium block">Score</span>
              <span className={`text-base font-bold font-mono ${getScoreColor(analysis.reliabilityScore)}`}>
                {analysis.reliabilityScore}
                <span className="text-[10px] text-slate-400 font-normal">/100</span>
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] uppercase text-slate-400 font-medium block">Risk</span>
              <span className={`text-xs ${getRiskBadge(analysis.riskLevel)}`}>
                {analysis.riskLevel}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] uppercase text-slate-400 font-medium block">Tests</span>
              <span className="text-base font-bold font-mono text-slate-900">
                {allTests.length}
              </span>
            </div>
          </div>
        </div>

        {/* Test Coverage Breakdown Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2.5 border-t border-slate-200 text-[11px] text-center font-mono">
          <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 block font-sans">Positive</span>
            <span className="text-slate-900 font-semibold">{analysis.positiveTests?.length || 0}</span>
          </div>
          <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 block font-sans">Negative</span>
            <span className="text-slate-900 font-semibold">{analysis.negativeTests?.length || 0}</span>
          </div>
          <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 block font-sans">Edge & Bound</span>
            <span className="text-slate-900 font-semibold">{analysis.edgeCases?.length || 0}</span>
          </div>
          <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 block font-sans">Validation</span>
            <span className="text-slate-900 font-semibold">{analysis.validationChecks?.length || 0}</span>
          </div>
          <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 block font-sans">Auth/IDOR</span>
            <span className="text-slate-900 font-semibold">
              {(analysis.authenticationChecks?.length || 0) + (analysis.authorizationChecks?.length || 0)}
            </span>
          </div>
          <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 block font-sans">Security</span>
            <span className="text-slate-900 font-semibold">{analysis.securityChecks?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Top Filter & Quick Actions Bar */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-700">Filter Category:</span>
          <select
            id="top-category-filter-dropdown"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              if (activeMainTab !== 'tests') setActiveMainTab('tests');
            }}
            aria-label="Filter test cases by category"
            className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-slate-500 shadow-2xs cursor-pointer"
          >
            <option value="all">All Categories ({allTests.length})</option>
            <option value="Positive">Positive ({analysis.positiveTests?.length || 0})</option>
            <option value="Negative">Negative ({analysis.negativeTests?.length || 0})</option>
            <option value="Edge & Boundary">Edge & Boundary ({analysis.edgeCases?.length || 0})</option>
            <option value="Validation">Validation ({analysis.validationChecks?.length || 0})</option>
            <option value="Authentication">Authentication ({analysis.authenticationChecks?.length || 0})</option>
            <option value="Authorization">Authorization ({analysis.authorizationChecks?.length || 0})</option>
            <option value="Security">Security ({analysis.securityChecks?.length || 0})</option>
          </select>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-[11px] text-slate-500 hover:text-slate-900 underline underline-offset-2 ml-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Prominent Copy All Tests Button */}
        <button
          id="btn-copy-all-tests"
          type="button"
          onClick={handleCopyAllTests}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-emerald-700">All Tests Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Copy All Tests</span>
            </>
          )}
        </button>
      </div>

      {/* Main View Tabs Bar */}
      <div className="border-b border-slate-200 bg-white px-3 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveMainTab('tests')}
            className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeMainTab === 'tests'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Test Cases ({allTests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('security')}
            className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeMainTab === 'security'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Security Checks ({securityTests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('status-codes')}
            className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeMainTab === 'status-codes'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            HTTP Status Expectations ({analysis.statusCodes?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('sample-requests')}
            className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeMainTab === 'sample-requests'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sample Requests ({analysis.sampleRequests?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('observations')}
            className={`px-3 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeMainTab === 'observations'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Observations & Assumptions
          </button>
        </div>
      </div>

      {/* Main Tab Panel Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
        {/* VIEW 1: ALL TEST CASES OR SECURITY VIEW */}
        {(activeMainTab === 'tests' || activeMainTab === 'security') && (
          <div className="space-y-3">
            {/* Filter and Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50/70 p-2.5 border border-slate-200/80 rounded-lg text-xs">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search test ID, scenario name, or status..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 shadow-2xs"
                />
              </div>

              {/* Category & Severity Filter */}
              <div className="flex items-center gap-2">
                {activeMainTab === 'tests' && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label="Filter by Category"
                    className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400 shadow-2xs"
                  >
                    <option value="all">All Categories ({allTests.length})</option>
                    <option value="Positive">Positive ({analysis.positiveTests?.length || 0})</option>
                    <option value="Negative">Negative ({analysis.negativeTests?.length || 0})</option>
                    <option value="Edge & Boundary">Edge & Boundary ({analysis.edgeCases?.length || 0})</option>
                    <option value="Validation">Validation ({analysis.validationChecks?.length || 0})</option>
                    <option value="Authentication">Authentication ({analysis.authenticationChecks?.length || 0})</option>
                    <option value="Authorization">Authorization ({analysis.authorizationChecks?.length || 0})</option>
                    <option value="Security">Security ({analysis.securityChecks?.length || 0})</option>
                  </select>
                )}

                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  aria-label="Filter by Severity"
                  className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400 shadow-2xs"
                >
                  <option value="all">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                {/* Expand / Collapse All Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-md font-medium transition-colors whitespace-nowrap shadow-2xs"
                >
                  {isAllCurrentExpanded ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
            </div>

            {/* Test Cards List */}
            {filteredTests.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                No test cases match the filter criteria.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTests.map((testCase) => (
                  <TestCaseCard
                    key={testCase.id}
                    testCase={testCase}
                    isExpanded={expandedCardIds.has(testCase.id)}
                    onToggleExpand={() => handleToggleCard(testCase.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: HTTP STATUS CODES MATRIX */}
        {activeMainTab === 'status-codes' && (
          <StatusCodesView statusCodes={analysis.statusCodes || []} />
        )}

        {/* VIEW 3: SAMPLE REQUESTS */}
        {activeMainTab === 'sample-requests' && (
          <SampleRequestsView sampleRequests={analysis.sampleRequests || []} />
        )}

        {/* VIEW 4: OBSERVATIONS & ASSUMPTIONS */}
        {activeMainTab === 'observations' && (
          <ObservationsView
            observations={analysis.reliabilityObservations || []}
            assumptions={analysis.assumptions || []}
          />
        )}
      </div>
    </div>
  );
};
