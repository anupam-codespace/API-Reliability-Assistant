import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { parseCurlCommand } from '../utils/curlParser';
import { ApiDefinition } from '../types';

interface CurlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsed: Partial<ApiDefinition>) => void;
}

const SAMPLE_CURL = `curl -X POST https://api.example.com/api/users \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice Smith", "email": "alice@example.com", "role": "developer"}'`;

export const CurlImportModal: React.FC<CurlImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [curlText, setCurlText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<ApiDefinition> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (!curlText.trim()) {
      setParsedPreview(null);
      setParseError(null);
      return;
    }

    try {
      const result = parseCurlCommand(curlText);
      if (!result.endpoint) {
        setParseError('Could not detect a valid URL endpoint in the cURL command.');
        setParsedPreview(null);
      } else {
        setParseError(null);
        setParsedPreview(result);
      }
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Invalid cURL format');
      setParsedPreview(null);
    }
  }, [curlText]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (parsedPreview) {
      onImport(parsedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200/90 w-full max-w-xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Import from cURL</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Paste a cURL command to populate the workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-3.5 bg-white">
          <div className="flex items-center justify-between">
            <label htmlFor="curl-input" className="text-slate-700 font-medium">
              cURL Command
            </label>
            <button
              type="button"
              onClick={() => setCurlText(SAMPLE_CURL)}
              className="text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
            >
              Paste example cURL
            </button>
          </div>

          <textarea
            id="curl-input"
            value={curlText}
            onChange={(e) => setCurlText(e.target.value)}
            placeholder="curl -X POST https://api.example.com/resource -H 'Authorization: Bearer token' -d '{...}'"
            rows={5}
            className="w-full bg-white border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 transition-colors resize-y placeholder:text-slate-400 leading-relaxed shadow-2xs"
          />

          {/* Parsed Inspection Preview */}
          {parsedPreview && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 font-mono">
              <span className="text-slate-700 text-[11px] font-sans font-semibold block">
                Extracted API Contract:
              </span>
              <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700">
                <div>
                  <span className="text-slate-500 block text-[11px] font-sans">Method:</span>
                  <span className="font-semibold text-slate-900">{parsedPreview.method}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-sans">Endpoint:</span>
                  <span className="text-slate-900 font-medium truncate block">{parsedPreview.endpoint}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-sans">Headers:</span>
                  <span className="font-medium text-slate-800">{parsedPreview.headers?.length || 0} parsed</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-sans">Auth:</span>
                  <span className="capitalize font-medium text-slate-800">{parsedPreview.auth?.type || 'None'}</span>
                </div>
              </div>
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {parseError}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-import-curl"
            type="button"
            disabled={!parsedPreview}
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black disabled:opacity-40 disabled:pointer-events-none rounded-md transition-colors cursor-pointer shadow-xs"
          >
            Import to Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
