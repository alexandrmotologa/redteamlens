import React, { useState } from 'react';
import { Play, Download, Settings, RefreshCw, Cpu, Globe, KeyRound, Shield, MessageSquare } from 'lucide-react';

interface ScanConfig {
  targetType: 'demo' | 'generic' | 'openai';
  demoHardened: boolean;
  targetUrl: string;
  method: string;
  responsePath: string;
  apiKey: string;
  model: string;
  categories: string[];
  concurrency: number;
  multiTurn: boolean;
}

interface ScanControlPanelProps {
  onStartScan: (config: ScanConfig) => void;
  isScanning: boolean;
  progress: { completed: number; total: number };
  onDownloadHtml: () => void;
  onDownloadMarkdown: () => void;
  onDownloadSarif: () => void;
  onDownloadBadge: () => void;
  hasReport: boolean;
}

export const ScanControlPanel: React.FC<ScanControlPanelProps> = ({
  onStartScan,
  isScanning,
  progress,
  onDownloadHtml,
  onDownloadMarkdown,
  onDownloadSarif,
  onDownloadBadge,
  hasReport
}) => {
  const [targetType, setTargetType] = useState<'demo' | 'generic' | 'openai'>('demo');
  const [demoHardened, setDemoHardened] = useState(false);
  const [targetUrl, setTargetUrl] = useState('http://localhost:4000/chat');
  const [method, setMethod] = useState('POST');
  const [responsePath, setResponsePath] = useState('response');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [concurrency, setConcurrency] = useState(5);
  const [multiTurn, setMultiTurn] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'LLM01_PROMPT_INJECTION',
    'LLM02_SENSITIVE_DISCLOSURE',
    'LLM06_EXCESSIVE_AGENCY',
    'LLM07_SYSTEM_PROMPT_LEAK',
    'LLM08_INDIRECT_INJECTION'
  ]);

  const categories = [
    { id: 'LLM01_PROMPT_INJECTION', label: 'LLM01 Prompt Injection' },
    { id: 'LLM02_SENSITIVE_DISCLOSURE', label: 'LLM02 Sensitive Disclosure' },
    { id: 'LLM06_EXCESSIVE_AGENCY', label: 'LLM06 Excessive Agency' },
    { id: 'LLM07_SYSTEM_PROMPT_LEAK', label: 'LLM07 System Prompt Leak' },
    { id: 'LLM08_INDIRECT_INJECTION', label: 'LLM08 Indirect Injection' }
  ];

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== catId));
      }
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleLaunch = () => {
    onStartScan({
      targetType,
      demoHardened,
      targetUrl,
      method,
      responsePath,
      apiKey,
      model,
      categories: selectedCategories,
      concurrency,
      multiTurn
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Scanner Configuration & Dispatcher
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure target adapter, adversarial battery parameters, and export compliance artifacts
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasReport && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onDownloadHtml}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                title="Download Standalone HTML Report"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                HTML
              </button>
              <button
                onClick={onDownloadMarkdown}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                title="Download Markdown Report"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Markdown
              </button>
              <button
                onClick={onDownloadSarif}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                title="Download SARIF 2.1.0 for GitHub Security"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                SARIF
              </button>
              <button
                onClick={onDownloadBadge}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                title="Download SVG Status Badge"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Badge
              </button>
            </div>
          )}

          <button
            onClick={handleLaunch}
            disabled={isScanning}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              isScanning
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/80 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-rose-950/40 cursor-pointer'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                Scanning ({progress.completed}/{progress.total})...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Launch Red-Team Scan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Type Selector */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setTargetType('demo')}
          className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
            targetType === 'demo'
              ? 'bg-slate-800/80 border-cyan-500/80 text-cyan-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Cpu className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-xs text-slate-200">Built-in Demo Simulator</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Test immediately with zero API keys</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTargetType('generic')}
          className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
            targetType === 'generic'
              ? 'bg-slate-800/80 border-cyan-500/80 text-cyan-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-xs text-slate-200">Custom REST Endpoint</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Audit any HTTP LLM microservice</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTargetType('openai')}
          className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
            targetType === 'openai'
              ? 'bg-slate-800/80 border-cyan-500/80 text-cyan-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <KeyRound className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-xs text-slate-200">OpenAI Compatible API</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Audit OpenAI, Groq, Ollama, vLLM</div>
          </div>
        </button>
      </div>

      {/* Target Specific Settings */}
      <div className="mt-4 p-4 bg-slate-950/40 border border-slate-800/80 rounded-lg">
        {targetType === 'demo' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-300">Simulator Defense Posture:</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {demoHardened
                  ? 'Hardened Agent: refuses jailbreaks, enforces canary protection, blocks SQL injection'
                  : 'Vulnerable Agent: yields to adversarial jailbreaks, leaks system tokens and credentials'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDemoHardened(false)}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${
                  !demoHardened
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Vulnerable Mode
              </button>
              <button
                type="button"
                onClick={() => setDemoHardened(true)}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${
                  demoHardened
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Hardened Mode
              </button>
            </div>
          </div>
        )}

        {targetType === 'generic' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Target URL</label>
              <input
                type="text"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="http://localhost:4000/api/chat"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Response JSON Path</label>
              <input
                type="text"
                value={responsePath}
                onChange={e => setResponsePath(e.target.value)}
                placeholder="response (or choices.0.message.content)"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>
        )}

        {targetType === 'openai' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Checkboxes and Multi-Turn Mode */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Target OWASP LLM Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-800/80 text-cyan-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Turn Mode Toggle */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex items-center gap-3">
          <MessageSquare className={`w-4 h-4 ${multiTurn ? 'text-amber-400' : 'text-slate-500'}`} />
          <div>
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={multiTurn}
                onChange={e => setMultiTurn(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              Multi-Turn Conversational Chains (Crescendo)
            </label>
            <p className="text-[10px] text-slate-400">
              Fires progressive 3-turn attack scenarios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
