import React, { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { TestCase, TestSeverity } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface TestCaseCardProps {
  testCase: TestCase;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  isExpanded,
  onToggleExpand,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedRequest, setCopiedRequest] = useState(false);

  const getSeverityStyle = (sev: TestSeverity | string | undefined) => {
    switch (sev) {
      case 'Critical':
        return 'text-rose-700 font-semibold';
      case 'High':
        return 'text-rose-600 font-semibold';
      case 'Medium':
        return 'text-amber-700 font-medium';
      case 'Low':
      case 'Info':
      default:
        return 'text-slate-500 font-medium';
    }
  };

  const getStatusColor = (statusStr: string | number | undefined) => {
    const s = String(statusStr || '');
    if (s.startsWith('2')) return 'text-emerald-700 font-bold';
    if (s.startsWith('401') || s.startsWith('403')) return 'text-amber-700 font-bold';
    if (s.startsWith('4')) return 'text-amber-600 font-bold';
    if (s.startsWith('5')) return 'text-rose-700 font-bold';
    return 'text-slate-700 font-bold';
  };

  const safeRequest =
    typeof testCase.request === 'object' && testCase.request !== null
      ? JSON.stringify(testCase.request, null, 2)
      : String(testCase.request || '');

  const safeExpectedBehaviour =
    typeof testCase.expectedBehaviour === 'object' && testCase.expectedBehaviour !== null
      ? JSON.stringify(testCase.expectedBehaviour, null, 2)
      : String(testCase.expectedBehaviour || '');

  const safeRationale =
    typeof testCase.rationale === 'object' && testCase.rationale !== null
      ? JSON.stringify(testCase.rationale, null, 2)
      : String(testCase.rationale || '');

  const handleCopyTestCase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = `=== TEST CASE: ${testCase.id || 'TC'} ===
Category: ${testCase.category || 'General'}
Scenario: ${testCase.scenario || ''}
Severity: ${testCase.severity || 'Medium'}
Expected Status: ${testCase.expectedStatus || '200 OK'}
Expected Behaviour: ${safeExpectedBehaviour}
Rationale: ${safeRationale}
Input / Request:
${safeRequest}
`;
    const success = await copyToClipboard(formatted);
    if (success) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleCopyRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(safeRequest);
    if (success) {
      setCopiedRequest(true);
      setTimeout(() => setCopiedRequest(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand();
    }
  };

  return (
    <div
      className={`border rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.008] overflow-hidden ${
        isExpanded
          ? 'bg-white border-slate-300 shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
      }`}
    >
      {/* Clickable Header Bar */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
        onKeyDown={handleKeyDown}
        className="p-3.5 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none text-xs focus:outline-hidden focus:bg-slate-50 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            {/* Test ID */}
            <span className="font-mono font-semibold px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
              {testCase.id || 'TC'}
            </span>

            {/* Expected Status */}
            <span className={`font-mono text-xs ${getStatusColor(testCase.expectedStatus)}`}>
              {String(testCase.expectedStatus || '200')}
            </span>

            {/* Severity */}
            <span className={`text-[11px] uppercase tracking-wide ${getSeverityStyle(testCase.severity)}`}>
              {testCase.severity || 'Medium'}
            </span>
          </div>

          {/* Scenario Headline */}
          <span className="text-slate-900 truncate font-medium">
            {testCase.scenario || 'Test Scenario'}
          </span>
        </div>

        {/* Actions & Chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyTestCase}
            aria-label="Copy test case"
            title="Copy test case"
            className="flex items-center gap-1 text-[11px] px-2 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors shadow-2xs"
          >
            {copiedText ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="font-medium text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isExpanded ? 'rotate-180 text-slate-700' : ''
            }`}
          />
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-3 text-xs bg-slate-50/50">
          {/* Expected Behaviour */}
          <div>
            <span className="text-slate-600 font-medium block mb-1">
              Expected Behaviour:
            </span>
            <p className="text-slate-800 leading-relaxed bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-2xs">
              {safeExpectedBehaviour}
            </p>
          </div>

          {/* Rationale */}
          <div>
            <span className="text-slate-600 font-medium block mb-1">
              Rationale:
            </span>
            <p className="text-slate-700 leading-relaxed bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-2xs">
              {safeRationale}
            </p>
          </div>

          {/* Input / Request Payload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 font-medium">
                Input / Request Payload:
              </span>
              <button
                type="button"
                onClick={handleCopyRequest}
                className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors shadow-2xs"
              >
                {copiedRequest ? 'Copied' : 'Copy Input'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-100 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {safeRequest}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
