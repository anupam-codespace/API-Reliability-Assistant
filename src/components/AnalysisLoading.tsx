import React, { useState, useEffect } from 'react';

interface Stage {
  id: string;
  label: string;
  durationMs: number;
}

const STAGES: Stage[] = [
  { id: '1', label: 'Understanding request structure', durationMs: 1000 },
  { id: '2', label: 'Generating test scenarios', durationMs: 1400 },
  { id: '3', label: 'Reviewing validation', durationMs: 1200 },
  { id: '4', label: 'Reviewing security', durationMs: 1500 },
  { id: '5', label: 'Preparing reliability report', durationMs: 1400 },
];

export const AnalysisLoading: React.FC = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < STAGES.length; i++) {
      accumulated += STAGES[i].durationMs;
      if (elapsed < accumulated) {
        setCurrentStageIndex(i);
        return;
      }
    }
    setCurrentStageIndex(STAGES.length - 1);
  }, [elapsed]);

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 h-full min-h-[500px] bg-white border border-slate-200/90 rounded-xl shadow-xs text-xs">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <h3 className="font-semibold text-slate-900 text-sm tracking-tight">
            Analyzing API
          </h3>
          <p className="text-slate-500 text-xs">
            Evaluating validation, boundaries, and security test scenarios
          </p>
        </div>

        {/* Subtle Progress bar */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-slate-800 transition-all duration-300"
              style={{
                width: `${Math.min(95, ((currentStageIndex + 1) / STAGES.length) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Step {currentStageIndex + 1} of {STAGES.length}</span>
            <span>{(elapsed / 1000).toFixed(1)}s</span>
          </div>
        </div>

        {/* Compact steps list */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-2">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  isCurrent
                    ? 'text-slate-900 font-medium'
                    : isDone
                    ? 'text-slate-400 line-through'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCurrent ? 'bg-slate-900 animate-pulse' : isDone ? 'bg-slate-300' : 'bg-slate-200'
                  }`}
                />
                <span>{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
