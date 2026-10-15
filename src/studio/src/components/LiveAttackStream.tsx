import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, ShieldCheck, ChevronRight } from 'lucide-react';

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

interface LiveAttackStreamProps {
  findings: Finding[];
  onInspect: (finding: Finding) => void;
  selectedCategoryFilter?: string | null;
}

export const LiveAttackStream: React.FC<LiveAttackStreamProps> = ({
  findings,
  onInspect,
  selectedCategoryFilter
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VULNERABLE' | 'DEFENDED'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filtered = findings.filter(f => {
    if (statusFilter === 'VULNERABLE' && !f.isVulnerable) return false;
    if (statusFilter === 'DEFENDED' && f.isVulnerable) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (selectedCategoryFilter && f.category !== selectedCategoryFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        f.probeId.toLowerCase().includes(q) ||
        f.probeName.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.promptSent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      case 'HIGH': return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      case 'MEDIUM': return 'bg-yellow-950/80 text-yellow-400 border-yellow-800/80';
      default: return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Adversarial Attack Findings Ledger
            <span className="text-xs font-normal text-slate-400">
              ({filtered.length} of {findings.length} probes)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time attack vector telemetry, target responses, and signature detections
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter probes..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-44 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'ALL' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('VULNERABLE')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'VULNERABLE' ? 'bg-rose-950 text-rose-300' : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Failed
            </button>
            <button
              onClick={() => setStatusFilter('DEFENDED')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'DEFENDED' ? 'bg-emerald-950 text-emerald-300' : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Passed
            </button>
          </div>

          {/* Severity selector */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-3">Severity</th>
              <th className="py-2.5 px-3">Probe ID</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-4">Probe Name & Description</th>
              <th className="py-2.5 px-3">Latency</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No attack probe findings match your criteria.
                </td>
              </tr>
            ) : (
              filtered.map(f => (
                <tr
                  key={f.probeId}
                  onClick={() => onInspect(f)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4">
                    {f.isVulnerable ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                        <ShieldAlert className="w-3.5 h-3.5" /> FAILED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> PASSED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(f.severity)}`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                    {f.probeId}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {f.category.replace('LLM', '').replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 max-w-md truncate text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {f.probeName}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {f.latencyMs}ms
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      Inspect
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
