import React, { useState } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import { RiskFinding, RiskLevel } from '../../types';

interface Props {
  findings: RiskFinding[];
  onSelectApp: (pkg: string) => void;
}

export const FindingsView: React.FC<Props> = ({ findings, onSelectApp }) => {
  const [filter, setFilter] = useState<RiskLevel | 'ALL'>('ALL');

  const filtered = findings.filter((f) => filter === 'ALL' || f.riskLevel === filter);

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Security Findings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deterministic rule-based risk detections with clear evidence and boundaries
        </p>
      </div>

      {/* Heuristic Disclaimer Card */}
      <div className="bg-blue-50/70 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-blue-950 dark:text-blue-200 text-xs">
          <Info className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
          Heuristic Assessment Notice
        </div>
        <p className="text-blue-800 dark:text-blue-300 text-xs leading-relaxed">
          Findings evaluate requested permissions, legacy Android target versions, and install vectors.
          A high-priority finding highlights an expanded attack surface, not a definitive malware accusation.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          All ({findings.length})
        </button>
        <button
          onClick={() => setFilter('HIGH_PRIORITY')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
            filter === 'HIGH_PRIORITY'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          High Priority ({findings.filter((f) => f.riskLevel === 'HIGH_PRIORITY').length})
        </button>
        <button
          onClick={() => setFilter('REVIEW_RECOMMENDED')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
            filter === 'REVIEW_RECOMMENDED'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          Review ({findings.filter((f) => f.riskLevel === 'REVIEW_RECOMMENDED').length})
        </button>
        <button
          onClick={() => setFilter('LOW')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
            filter === 'LOW'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
        >
          Low Risk ({findings.filter((f) => f.riskLevel === 'LOW').length})
        </button>
      </div>

      {/* Findings List */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          No security findings match the selected risk filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((finding) => (
            <div
              key={finding.id}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border space-y-3 transition-all ${
                finding.riskLevel === 'HIGH_PRIORITY'
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/15 dark:bg-rose-950/20'
                  : finding.riskLevel === 'REVIEW_RECOMMENDED'
                  ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/15 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white">{finding.title}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                        finding.riskLevel === 'HIGH_PRIORITY'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : finding.riskLevel === 'REVIEW_RECOMMENDED'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {finding.riskLevel.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium truncate">
                    {finding.appName} • <span className="text-slate-500 dark:text-slate-400 font-normal">{finding.packageName}</span>
                  </p>
                </div>

                <button
                  onClick={() => onSelectApp(finding.packageName)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  <span>Audit App</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Finding Details */}
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">Supporting Evidence:</span>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5 mt-0.5 pl-1">
                    {finding.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">Why it matters:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{finding.whyItDeservesAttention}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">What cannot be verified locally:</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{finding.whatCannotBeVerified}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                  <strong>Recommended Action:</strong> {finding.practicalNextAction}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
