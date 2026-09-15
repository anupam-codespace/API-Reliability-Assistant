import React, { useState } from 'react';
import { StatusCodeScenario } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface StatusCodesViewProps {
  statusCodes: StatusCodeScenario[];
}

export const StatusCodesView: React.FC<StatusCodesViewProps> = ({ statusCodes = [] }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const safeCodes = Array.isArray(statusCodes) ? statusCodes : [];

  const handleCopy = async (sc: StatusCodeScenario, idx: number) => {
    const success = await copyToClipboard(`${sc.expectedStatus} - ${sc.scenario}: ${sc.reason}`);
    if (success) {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const getStatusColor = (status: string | number | undefined) => {
    const s = String(status || '');
    if (s.startsWith('2')) return 'text-emerald-700 font-bold font-mono';
    if (s.startsWith('401') || s.startsWith('403')) return 'text-amber-700 font-bold font-mono';
    if (s.startsWith('4')) return 'text-amber-600 font-bold font-mono';
    if (s.startsWith('5')) return 'text-rose-700 font-bold font-mono';
    return 'text-slate-700 font-bold font-mono';
  };

  if (safeCodes.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
        No specific status code scenarios provided.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">Expected HTTP Status Code Expectations ({safeCodes.length})</span>
        <span className="font-mono text-[11px] text-slate-400">RFC 9110 compliant</span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3.5 font-semibold w-28">Status Code</th>
              <th className="py-2.5 px-3.5 font-semibold">Scenario Trigger</th>
              <th className="py-2.5 px-3.5 font-semibold">Expected RFC Reason</th>
              <th className="py-2.5 px-3.5 font-semibold w-20 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {safeCodes.map((sc, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2.5 px-3.5 whitespace-nowrap">
                  <span className={getStatusColor(sc.expectedStatus)}>
                    {String(sc.expectedStatus || '200')}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-900 font-medium">
                  {sc.scenario}
                </td>
                <td className="py-2.5 px-3.5 text-slate-600 leading-relaxed">
                  {sc.reason}
                </td>
                <td className="py-2.5 px-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleCopy(sc, idx)}
                    className="text-slate-600 hover:text-slate-900 text-[11px] px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
                  >
                    {copiedIndex === idx ? 'Copied' : 'Copy'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
