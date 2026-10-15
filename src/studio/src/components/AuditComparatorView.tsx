import React, { useState } from 'react';
import { GitCompare, TrendingUp, TrendingDown, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';

export const AuditComparatorView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<any>(null);

  // Run a demo comparison (simulates Before Hardening vs After Hardening)
  const handleRunDemoComparison = async () => {
    setLoading(true);
    try {
      // 1. Fetch vulnerable baseline scan
      const resBase = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'demo', hardened: false, limit: 30 })
      });
      const dataBase = await resBase.json();

      // Poll until done
      let baseReport: any = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 400));
        const check = await fetch(`/api/scan/${dataBase.scanId}`).then(r => r.json());
        if (check.isDone && check.report) {
          baseReport = check.report;
          break;
        }
      }

      // 2. Fetch hardened comparison scan
      const resComp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'demo', hardened: true, limit: 30 })
      });
      const dataComp = await resComp.json();

      let compReport: any = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 400));
        const check = await fetch(`/api/scan/${dataComp.scanId}`).then(r => r.json());
        if (check.isDone && check.report) {
          compReport = check.report;
          break;
        }
      }

      if (baseReport && compReport) {
        const diffRes = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseline: baseReport, comparison: compReport })
        });
        const diffData = await diffRes.json();
        setComparison(diffData);
      }
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            Security Audit Comparison & Regression Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare security postures across prompt versions and identify remediations or regressions
          </p>
        </div>

        <button
          onClick={handleRunDemoComparison}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Benchmarking (Baseline vs Hardened)...
            </>
          ) : (
            <>
              <GitCompare className="w-3.5 h-3.5" />
              Run Before vs After Benchmark
            </>
          )}
        </button>
      </div>

      {!comparison && !loading && (
        <div className="py-16 text-center text-xs text-slate-500">
          Click "Run Before vs After Benchmark" to observe the security improvement between a vulnerable agent and a hardened agent.
        </div>
      )}

      {comparison && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Delta Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Score Delta</span>
              <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                +{comparison.scoreDelta}%
              </div>
              <span className="text-xs text-slate-400">
                {comparison.baselineScore}% → {comparison.comparisonScore}%
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Grade Evolution</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                Grade {comparison.baselineGrade} → {comparison.comparisonGrade}
              </div>
              <span className="text-xs text-slate-400">
                {comparison.gradeImproved ? 'Verified Improvement' : 'Unchanged'}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Resolved Vulnerabilities</span>
              <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                {comparison.resolvedVulnerabilities.length}
              </div>
              <span className="text-xs text-slate-400">Attacks neutralized</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Security Regressions</span>
              <div className="text-2xl font-black text-slate-100 mt-1 flex items-center gap-1">
                <AlertOctagon className={`w-6 h-6 ${comparison.newRegressions.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                {comparison.newRegressions.length}
              </div>
              <span className="text-xs text-slate-400">
                {comparison.newRegressions.length === 0 ? 'Zero regression defects' : 'New vulnerabilities introduced'}
              </span>
            </div>
          </div>

          {/* Remediated List */}
          {comparison.resolvedVulnerabilities.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Successfully Remediated Attack Vectors ({comparison.resolvedVulnerabilities.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {comparison.resolvedVulnerabilities.slice(0, 8).map((f: any) => (
                  <div key={f.probeId} className="p-2.5 bg-slate-900 border border-slate-800/80 rounded flex items-center justify-between">
                    <div>
                      <span className="font-mono text-slate-400 mr-2">{f.probeId}</span>
                      <span className="text-slate-200">{f.probeName}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold text-[11px]">FIXED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
