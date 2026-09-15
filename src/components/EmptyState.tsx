import React from 'react';
import { EXAMPLE_APIS, ExampleApi } from '../data/examples';

interface EmptyStateProps {
  onSelectExample: (example: ExampleApi) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectExample }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 h-full min-h-[500px] bg-white border border-slate-200/90 rounded-xl shadow-xs text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            Analyze an API to generate reliability and security tests.
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Provide an endpoint and API behaviour, then run the analysis.
          </p>
        </div>

        {/* Examples Section */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
            Try an example
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_APIS.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSelectExample(ex)}
                className="px-3 py-1.5 text-xs rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-medium transition-colors shadow-2xs"
              >
                <span className="font-mono text-[10px] text-slate-400 mr-1.5 font-semibold">
                  {ex.definition.method}
                </span>
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
