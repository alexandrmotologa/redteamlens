import React, { useState } from 'react';
import { X, Copy, Check, ShieldAlert, ShieldCheck, Terminal, Lightbulb } from 'lucide-react';

interface Finding {
  probeId: string;
  probeName: string;
  category: string;
  severity: string;
  promptSent: string;
  responseReceived: string;
  isVulnerable: boolean;
  confidenceScore: number;
  matchedSignatures: string[];
  remediation: string;
  latencyMs: number;
}

interface AttackPayloadViewerProps {
  finding: Finding | null;
  onClose: () => void;
}

export const AttackPayloadViewer: React.FC<AttackPayloadViewerProps> = ({
  finding,
  onClose
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedRemediation, setCopiedRemediation] = useState(false);

  if (!finding) return null;

  const copyToClipboard = (text: string, type: 'prompt' | 'remediation') => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedRemediation(true);
      setTimeout(() => setCopiedRemediation(false), 2000);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800/80';
      default:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${finding.isVulnerable ? 'bg-rose-950/60 text-rose-400' : 'bg-emerald-950/60 text-emerald-400'}`}>
              {finding.isVulnerable ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {finding.probeName}
                <span className="font-mono text-xs text-slate-400">({finding.probeId})</span>
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(finding.severity)}`}>
                  {finding.severity}
                </span>
                <span className="text-xs text-slate-400">
                  {finding.category}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">{finding.latencyMs}ms</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            finding.isVulnerable
              ? 'bg-rose-950/30 border-rose-900/50 text-rose-300'
              : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
          }`}>
            <span className="font-semibold">
              {finding.isVulnerable
                ? 'Security Vulnerability Detected: Model yielded to adversarial probe'
                : 'Defended: Target agent successfully refused or contained probe'}
            </span>
            <span className="text-xs font-mono font-bold">
              Confidence: {Math.round(finding.confidenceScore * 100)}%
            </span>
          </div>

          {/* Matched Signatures */}
          {finding.matchedSignatures && finding.matchedSignatures.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Matched Vulnerability Signatures
              </div>
              <div className="flex flex-wrap gap-2">
                {finding.matchedSignatures.map((sig, i) => (
                  <span key={i} className="font-mono text-xs bg-rose-950/50 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded">
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Payload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Prompt Payload Dispatched
              </span>
              <button
                onClick={() => copyToClipboard(finding.promptSent, 'prompt')}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPrompt ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
              {finding.promptSent}
            </pre>
          </div>

          {/* Target Response */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Response Received
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
              {finding.responseReceived || '<empty response>'}
            </pre>
          </div>

          {/* Remediation Advice */}
          <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                Recommended Prompt Hardening Fix
              </span>
              <button
                onClick={() => copyToClipboard(finding.remediation, 'remediation')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                {copiedRemediation ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRemediation ? 'Copied' : 'Copy Recipe'}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {finding.remediation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
