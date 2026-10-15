import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Terminal } from 'lucide-react';

interface RemediationListProps {
  recommendations: string[];
}

export const RemediationList: React.FC<RemediationListProps> = ({ recommendations }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!recommendations || recommendations.length === 0) return null;

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-slate-100">Actionable Prompt Hardening Recipes</h2>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        The following security defenses are automatically synthesized based on the vulnerabilities exposed during this scan session.
      </p>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-4 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg group hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center text-xs font-bold mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {rec}
              </p>
            </div>
            <button
              onClick={() => copyText(rec, idx)}
              className="flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              title="Copy defense rule"
            >
              {copiedIndex === idx ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
