import React from 'react';
import { ReliabilityObservation } from '../types';

interface ObservationsViewProps {
  observations: ReliabilityObservation[];
  assumptions: string[];
}

export const ObservationsView: React.FC<ObservationsViewProps> = ({
  observations = [],
  assumptions = [],
}) => {
  const safeObs = Array.isArray(observations) ? observations : [];
  const safeAssumptions = Array.isArray(assumptions) ? assumptions : [];

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case 'High':
        return 'text-rose-700 font-semibold';
      case 'Medium':
        return 'text-amber-700 font-semibold';
      case 'Low':
      default:
        return 'text-slate-500 font-medium';
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Reliability & Architectural Observations */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">
          Architectural Observations & Risks ({safeObs.length})
        </h3>

        {safeObs.length === 0 ? (
          <div className="p-6 text-slate-400 border border-dashed border-slate-200 rounded-lg text-center">
            No specific architectural vulnerabilities noted for this contract.
          </div>
        ) : (
          <div className="space-y-3">
            {safeObs.map((obs, idx) => (
              <div
                key={idx}
                className="p-4 border border-slate-200/90 bg-white rounded-lg space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{obs.title}</span>
                  <span className={`text-[11px] uppercase tracking-wide ${getSeverityLabel(obs.severity)}`}>
                    {obs.severity} Risk
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 font-medium mr-1">Observation:</strong>
                  {obs.observation}
                </p>

                <p className="text-slate-800 leading-relaxed border-t border-slate-100 pt-2 mt-2">
                  <strong className="text-slate-900 font-medium mr-1">Recommendation:</strong>
                  {obs.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assumptions & Inferences */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">
            Documented Inferences & Assumptions ({safeAssumptions.length})
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Where the API definition was implicit, the engine documented explicit assumptions:
          </p>
        </div>

        {safeAssumptions.length === 0 ? (
          <div className="p-6 text-slate-400 border border-dashed border-slate-200 rounded-lg text-center">
            No implicit assumptions required; API definition provided sufficient explicit context.
          </div>
        ) : (
          <ol className="list-decimal list-inside space-y-2 p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 leading-relaxed font-mono text-[11px]">
            {safeAssumptions.map((assumption, idx) => (
              <li key={idx} className="pl-1">
                <span className="font-sans text-slate-700">{assumption}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
