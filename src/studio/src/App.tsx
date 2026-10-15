import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Terminal, GitCompare, Wrench } from 'lucide-react';
import { ComplianceGradeCard } from './components/ComplianceGradeCard';
import { VulnerabilityMatrix } from './components/VulnerabilityMatrix';
import { RemediationList } from './components/RemediationList';
import { ScanControlPanel } from './components/ScanControlPanel';
import { LiveAttackStream } from './components/LiveAttackStream';
import { AttackPayloadViewer } from './components/AttackPayloadViewer';
import { PlaygroundView } from './components/PlaygroundView';
import { PromptPatcherModal } from './components/PromptPatcherModal';
import { AuditComparatorView } from './components/AuditComparatorView';

type ActiveTab = 'scanner' | 'playground' | 'patcher' | 'comparator';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [report, setReport] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [corpusStats, setCorpusStats] = useState<{ total: number } | null>(null);

  useEffect(() => {
    // Fetch corpus stats on mount
    fetch('/api/probes')
      .then(res => res.json())
      .then(data => {
        setCorpusStats({ total: data.total || 240 });
      })
      .catch(() => {
        setCorpusStats({ total: 240 });
      });

    // Auto-launch demo scan on first load
    handleStartScan({
      targetType: 'demo',
      demoHardened: false,
      targetUrl: 'internal://simulator',
      method: 'POST',
      responsePath: 'response',
      apiKey: '',
      model: 'gpt-4o-mini',
      categories: [
        'LLM01_PROMPT_INJECTION',
        'LLM02_SENSITIVE_DISCLOSURE',
        'LLM06_EXCESSIVE_AGENCY',
        'LLM07_SYSTEM_PROMPT_LEAK',
        'LLM08_INDIRECT_INJECTION'
      ],
      concurrency: 5,
      multiTurn: false
    });
  }, []);

  const handleStartScan = async (config: any) => {
    setIsScanning(true);
    setFindings([]);
    setReport(null);
    setProgress({ completed: 0, total: 0 });

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: config.targetType,
          demo: config.targetType === 'demo',
          hardened: config.demoHardened,
          targetUrl: config.targetUrl,
          method: config.method,
          responsePath: config.responsePath,
          apiKey: config.apiKey,
          model: config.model,
          categories: config.categories,
          concurrency: config.concurrency,
          multiTurn: config.multiTurn
        })
      });

      const data = await res.json();
      const scanId = data.scanId;

      // Connect to SSE stream
      const eventSource = new EventSource(`/api/scan/${scanId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'init') {
            setProgress({ completed: payload.completed, total: payload.total });
          } else if (payload.type === 'probe_complete') {
            setProgress({ completed: payload.completed, total: payload.total });
            setFindings(prev => [...prev, payload.finding]);
          } else if (payload.type === 'scan_complete') {
            setReport(payload.report);
            setIsScanning(false);
            eventSource.close();
          } else if (payload.type === 'scan_error') {
            setIsScanning(false);
            eventSource.close();
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsScanning(false);
      };
    } catch (err) {
      console.error('Failed to initiate scan:', err);
      setIsScanning(false);
    }
  };

  const downloadReport = async (format: 'html' | 'markdown') => {
    if (!report) return;
    try {
      const res = await fetch(`/api/report/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });
      const text = await res.text();
      const blob = new Blob([text], {
        type: format === 'html' ? 'text/html' : 'text/markdown'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redteamlens-audit-${Date.now()}.${format === 'html' ? 'html' : 'md'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to export ${format} report:`, err);
    }
  };

  const downloadSarif = async () => {
    if (!report) return;
    try {
      const res = await fetch('/api/report/sarif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });
      const text = await res.text();
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redteamlens-audit-${Date.now()}.sarif`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export SARIF report:', err);
    }
  };

  const downloadBadge = async () => {
    if (!report) return;
    try {
      const score = Math.round(report.complianceScore || 0);
      const grade = report.letterGrade || 'A';
      const res = await fetch(`/api/badge?score=${score}&grade=${grade}&label=OWASP LLM`);
      const svg = await res.text();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redteamlens-badge-${grade}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export SVG badge:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                RedTeamLens
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800/60 px-1.5 py-0.2 rounded">
                  Studio
                </span>
              </span>
              <p className="text-[10px] text-slate-400">
                OWASP LLM Top 10 Red-Teaming & Fuzzing Platform
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'scanner'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Audit Scanner</span>
            </button>
            <button
              onClick={() => setActiveTab('playground')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'playground'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Playground</span>
            </button>
            <button
              onClick={() => setActiveTab('patcher')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'patcher'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Auto-Patcher</span>
            </button>
            <button
              onClick={() => setActiveTab('comparator')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'comparator'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Comparator</span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Corpus: <strong className="text-slate-200">{corpusStats?.total || 240}</strong> probes</span>
            </div>

            <a
              href="https://github.com/alexandrmotologa/redteamlens"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="GitHub Repository"
            >
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Mobile Tab Navigation Bar */}
        <div className="flex md:hidden border-t border-slate-800 px-4 py-2 gap-1 overflow-x-auto bg-slate-950/90">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'scanner' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400'
            }`}
          >
            <Shield className="w-3 h-3" /> Scanner
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'playground' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            <Terminal className="w-3 h-3" /> Playground
          </button>
          <button
            onClick={() => setActiveTab('patcher')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'patcher' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400'
            }`}
          >
            <Wrench className="w-3 h-3" /> Auto-Patcher
          </button>
          <button
            onClick={() => setActiveTab('comparator')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'comparator' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400'
            }`}
          >
            <GitCompare className="w-3 h-3" /> Comparator
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TAB 1: AUDIT SCANNER */}
        {activeTab === 'scanner' && (
          <>
            <ScanControlPanel
              onStartScan={handleStartScan}
              isScanning={isScanning}
              progress={progress}
              onDownloadHtml={() => downloadReport('html')}
              onDownloadMarkdown={() => downloadReport('markdown')}
              onDownloadSarif={downloadSarif}
              onDownloadBadge={downloadBadge}
              hasReport={Boolean(report)}
            />

            {/* Audit Results when report available */}
            {report && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <ComplianceGradeCard
                  score={report.complianceScore}
                  letterGrade={report.letterGrade}
                  totalProbes={report.totalProbesRun}
                  vulnerabilities={report.vulnerabilitiesFound}
                  criticalCount={report.severityBreakdown.critical}
                  highCount={report.severityBreakdown.high}
                  durationMs={report.durationMs}
                />

                <VulnerabilityMatrix
                  categories={report.categoryBreakdown}
                  onSelectCategory={cat => setSelectedCategoryFilter(prev => prev === cat ? null : cat)}
                />

                {report.recommendedHardening && report.recommendedHardening.length > 0 && (
                  <RemediationList recommendations={report.recommendedHardening} />
                )}
              </div>
            )}

            <LiveAttackStream
              findings={findings}
              onInspect={finding => setSelectedFinding(finding)}
              selectedCategoryFilter={selectedCategoryFilter}
            />
          </>
        )}

        {/* TAB 2: AD-HOC PLAYGROUND */}
        {activeTab === 'playground' && <PlaygroundView />}

        {/* TAB 3: PROMPT AUTO-PATCHER */}
        {activeTab === 'patcher' && <PromptPatcherModal />}

        {/* TAB 4: AUDIT COMPARATOR */}
        {activeTab === 'comparator' && <AuditComparatorView />}
      </main>

      {/* Payload Inspector Modal */}
      <AttackPayloadViewer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />
    </div>
  );
}

export default App;

