import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { EXAMPLE_APIS, ExampleApi } from '../data/examples';
import { ApiDefinition } from '../types';

interface HeaderProps {
  apiDef: ApiDefinition;
  onSelectExample: (example: ExampleApi) => void;
  onOpenImportModal: () => void;
  onReset: () => void;
  onSaveSpec: () => void;
  onExportSuite: () => void;
  hasActiveAnalysis: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  apiDef,
  onSelectExample,
  onOpenImportModal,
  onReset,
  onSaveSpec,
  onExportSuite,
  hasActiveAnalysis,
}) => {
  const [examplesOpen, setExamplesOpen] = useState(false);

  return (
    <header className="border-b border-slate-200/90 bg-white sticky top-0 z-30 shadow-2xs">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        {/* Brand & Purpose */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-slate-900 text-sm tracking-tight">
              API Reliability Assistant
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold tracking-wide">
              PROD
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Session
            </span>
          </div>

          <span className="text-slate-300 hidden md:inline">•</span>

          <span className="text-xs text-slate-500 hidden md:inline">
            Automated contract verification & deterministic security analysis
          </span>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            id="btn-import-curl"
            type="button"
            onClick={onOpenImportModal}
            className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium shadow-2xs transition-colors"
          >
            Import cURL
          </button>

          <button
            id="btn-save-spec"
            type="button"
            onClick={onSaveSpec}
            className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium shadow-2xs transition-colors"
          >
            Save Spec
          </button>

          <button
            id="btn-export-suite"
            type="button"
            disabled={!hasActiveAnalysis}
            onClick={onExportSuite}
            className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 text-slate-700 font-medium shadow-2xs transition-colors"
          >
            Export Suite
          </button>

          <button
            id="btn-new-analysis"
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-black text-white font-medium shadow-2xs transition-colors"
          >
            + New Analysis
          </button>
        </div>
      </div>

      {/* Sub-bar: Active Target Breadcrumb and Quick Example Shortcuts */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/60">
        <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px] truncate">
          <span className="font-bold text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
            {apiDef.method}
          </span>
          <span className="text-slate-800 truncate font-medium">
            {apiDef.endpoint || '/api/resource'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-700 font-sans font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Shield Engine Ready
          </span>
        </div>

        {/* Quick Examples Selection */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 hidden sm:inline">Try Example:</span>
          
          {/* Desktop inline pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            {EXAMPLE_APIS.slice(0, 2).map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSelectExample(ex)}
                className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 shadow-2xs transition-colors text-xs"
              >
                <span className="font-mono text-[10px] text-slate-500 mr-1 font-semibold">{ex.definition.method}</span>
                {ex.name}
              </button>
            ))}
          </div>

          {/* Mobile dropdown */}
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setExamplesOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors text-xs"
              aria-expanded={examplesOpen}
            >
              <span className="font-medium">Examples</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${examplesOpen ? 'rotate-180' : ''}`} />
            </button>

            {examplesOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExamplesOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  {EXAMPLE_APIS.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => {
                        onSelectExample(ex);
                        setExamplesOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-between"
                    >
                      <span>{ex.name}</span>
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{ex.definition.method}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

