import React from 'react';
import { History, Clock, Zap } from 'lucide-react';
import { ObservationEvent, ScanSession } from '../../types';

interface Props {
  sessions: ScanSession[];
  observations: ObservationEvent[];
  onSelectApp: (pkg: string) => void;
}

export const HistoryView: React.FC<Props> = ({
  sessions,
  observations,
  onSelectApp,
}) => {
  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Scan &amp; Observation History</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Chronological record of scans and recorded permission changes
        </p>
      </div>

      {/* Observation History Delta Log */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Detected App Events &amp; Permission State Diffs
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Changes recorded dynamically across scan intervals
          </p>
        </div>

        {observations.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center text-xs text-slate-500 dark:text-slate-400">
            No dynamic changes detected yet. Toggle permissions in an app profile or trigger new scans to log delta events.
          </div>
        ) : (
          <div className="space-y-2">
            {observations.map((obs) => (
              <div
                key={obs.id}
                onClick={() => onSelectApp(obs.packageName)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                        obs.eventType === 'NEW_INSTALL'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : obs.eventType === 'PERMISSION_REVOKED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {obs.eventType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {obs.appName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{obs.detail}</p>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                  {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scan Sessions Audit Log */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            Audit Session Records
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Persisted in Room Database on device (`scan_sessions` table)
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center text-xs text-slate-500 dark:text-slate-400">
            No previous scan sessions in database.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {new Date(sess.timestamp).toLocaleString()}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-xs">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {sess.durationMs} ms
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span>{sess.totalAppsScanned} apps scanned</span>
                  <span className={sess.highRiskCount > 0 ? 'text-rose-700 dark:text-rose-400 font-semibold' : ''}>
                    {sess.highRiskCount} High Risk
                  </span>
                  <span className={sess.reviewRecommendedCount > 0 ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}>
                    {sess.reviewRecommendedCount} Review
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {sess.totalSensitivePermissionsGranted} sensitive permissions granted
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
