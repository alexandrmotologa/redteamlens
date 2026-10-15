import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock } from 'lucide-react';

interface ComplianceGradeCardProps {
  score: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalProbes: number;
  vulnerabilities: number;
  criticalCount: number;
  highCount: number;
  durationMs: number;
}

export const ComplianceGradeCard: React.FC<ComplianceGradeCardProps> = ({
  score,
  letterGrade,
  totalProbes,
  vulnerabilities,
  criticalCount,
  highCount,
  durationMs
}) => {
  const getGradeColor = () => {
    switch (letterGrade) {
      case 'A': return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
      case 'B': return 'text-blue-400 border-blue-500/40 bg-blue-950/20';
      case 'C': return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
      case 'D': return 'text-orange-400 border-orange-500/40 bg-orange-950/20';
      default: return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
    }
  };

  const passed = totalProbes - vulnerabilities;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Compliance Grade */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OWASP Compliance</div>
          <div className="text-3xl font-extrabold text-slate-100 mt-1">{score}%</div>
          <div className="text-xs text-slate-400 mt-1">
            {passed} of {totalProbes} probes passed
          </div>
        </div>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-4xl border-2 ${getGradeColor()}`}>
          {letterGrade}
        </div>
      </div>

      {/* Vulnerabilities Found */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vulnerabilities Detected</div>
          <div className={`text-3xl font-extrabold mt-1 ${vulnerabilities > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {vulnerabilities}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {vulnerabilities === 0 ? 'Zero safety violations' : 'Requires prompt remediation'}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${vulnerabilities > 0 ? 'bg-rose-950/40 text-rose-400' : 'bg-emerald-950/40 text-emerald-400'}`}>
          {vulnerabilities > 0 ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
        </div>
      </div>

      {/* High Risk Findings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical & High Severities</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">
            {criticalCount} <span className="text-sm font-normal text-slate-400">Crit</span> / {highCount} <span className="text-sm font-normal text-slate-400">High</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Immediate production blockers
          </div>
        </div>
        <div className="p-3 rounded-xl bg-amber-950/40 text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
      </div>

      {/* Scan Latency & Duration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Execution Benchmark</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1">
            {(durationMs / 1000).toFixed(2)}s
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Avg {totalProbes > 0 ? Math.round(durationMs / totalProbes) : 0}ms per probe
          </div>
        </div>
        <div className="p-3 rounded-xl bg-cyan-950/40 text-cyan-400">
          <Clock className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};
