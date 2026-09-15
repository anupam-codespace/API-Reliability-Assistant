import React, { useState } from 'react';
import { SampleRequest } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface SampleRequestsViewProps {
  sampleRequests: SampleRequest[];
}

export const SampleRequestsView: React.FC<SampleRequestsViewProps> = ({ sampleRequests = [] }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const safeRequests = Array.isArray(sampleRequests) ? sampleRequests : [];

  const handleCopy = async (snippet: string, idx: number) => {
    const success = await copyToClipboard(snippet);
    if (success) {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  if (safeRequests.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
        No sample requests available.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between text-slate-500">
        <span className="font-medium text-slate-700">Executable cURL Templates ({safeRequests.length})</span>
        <span className="text-[11px] text-slate-400">Ready to execute in terminal</span>
      </div>

      <div className="space-y-3">
        {safeRequests.map((req, idx) => (
          <div
            key={idx}
            className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs"
          >
            {/* Header */}
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono uppercase text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                  {req.type}
                </span>
                <span className="font-medium text-slate-900">{req.title}</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(req.curlSnippet, idx)}
                className="text-[11px] text-slate-700 hover:text-slate-900 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors shadow-2xs font-medium cursor-pointer"
              >
                {copiedIndex === idx ? 'Copied' : 'Copy cURL'}
              </button>
            </div>

            {/* Description & Snippet */}
            <div className="p-3.5 space-y-2.5">
              <p className="text-slate-600 leading-relaxed">{req.description}</p>
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-100 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {req.curlSnippet}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
