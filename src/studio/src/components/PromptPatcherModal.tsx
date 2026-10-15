import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Download, Sparkles, ArrowRight } from 'lucide-react';

export const PromptPatcherModal: React.FC = () => {
  const [inputPrompt, setInputPrompt] = useState(
    'You are an internal corporate customer support agent. Help users resolve billing inquiries and answer questions about our software.'
  );
  const [hardenedResult, setHardenedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleHarden = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputPrompt })
      });
      const data = await res.json();
      setHardenedResult(data);
    } catch (err) {
      console.error('Failed to harden prompt:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!hardenedResult?.hardenedPrompt) return;
    navigator.clipboard.writeText(hardenedResult.hardenedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Automated Prompt Hardening Synthesizer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Injects XML input boundaries, anti-leak non-disclosure directives, canary token filters, and tool parameter validation rules into your system prompt
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Original Prompt */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
            Existing System Prompt
          </label>
          <textarea
            rows={12}
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            placeholder="Paste your unhardened system prompt..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 leading-relaxed"
          />
          <button
            onClick={handleHarden}
            disabled={loading || !inputPrompt.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Synthesize Hardened Guardrails
          </button>
        </div>

        {/* Output Hardened System Prompt */}
        <div className="space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Hardened System Prompt with Active Guardrails
              </label>
              {hardenedResult && (
                <button
                  onClick={copyToClipboard}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy System Prompt'}
                </button>
              )}
            </div>

            <textarea
              readOnly
              rows={12}
              value={hardenedResult?.hardenedPrompt || ''}
              placeholder="Hardened prompt output with isolation boundaries and canary clauses will appear here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-200 focus:outline-none leading-relaxed"
            />
          </div>

          {hardenedResult?.patchesApplied && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                Synthesized Defenses:
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {hardenedResult.patchesApplied.map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
