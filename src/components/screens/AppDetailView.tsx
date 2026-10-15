import React from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Cpu,
} from 'lucide-react';
import { AppSecurityProfile, ObservationEvent } from '../../types';

interface Props {
  app: AppSecurityProfile;
  observations: ObservationEvent[];
  onBack: () => void;
  onTogglePermissionGrant: (packageName: string, permissionName: string) => void;
}

export const AppDetailView: React.FC<Props> = ({
  app,
  observations,
  onBack,
  onTogglePermissionGrant,
}) => {
  const appObservations = observations.filter((o) => o.packageName === app.packageName);

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">{app.appName}</h2>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                app.riskLevel === 'HIGH_PRIORITY'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : app.riskLevel === 'REVIEW_RECOMMENDED'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {app.riskLevel.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{app.packageName}</p>
        </div>
      </div>

      {/* Package Identity & Integrity Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Package Identity &amp; Integrity
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Android PackageManager</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Version</span>
            <span className="font-medium text-slate-900 dark:text-white">{app.versionName} ({app.versionCode})</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Target SDK</span>
            <span className="font-medium text-slate-900 dark:text-white">API {app.targetSdk} (Min: {app.minSdk})</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Installation Source</span>
            <span className="font-medium text-slate-900 dark:text-white break-words">{app.installSource}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Package Type</span>
            <span className="font-medium text-slate-900 dark:text-white">{app.isSystemApp ? 'Pre-installed System App' : 'User Installed App'}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">First Installed</span>
            <span className="font-medium text-slate-900 dark:text-white">{new Date(app.firstInstallTime).toLocaleString()}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Last Updated</span>
            <span className="font-medium text-slate-900 dark:text-white">{new Date(app.lastUpdateTime).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Foreground Usage Statistics (UsageStatsManager) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Foreground App Usage Statistics
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              app.usageInfo.hasUsageAccess
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {app.usageInfo.hasUsageAccess ? 'UsageAccess Active' : 'Access Required'}
          </span>
        </div>

        {app.usageInfo.hasUsageAccess && app.usageInfo.dataAvailable ? (
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Foreground Screen Time:</span>
              <span className="text-blue-700 dark:text-blue-400 font-bold text-sm">{app.usageInfo.formattedDuration}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Last Active Time:</span>
              <span>{new Date(app.usageInfo.lastTimeUsedMs).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 py-1 leading-relaxed">
            {app.usageInfo.hasUsageAccess
              ? 'No foreground screen time recorded for this app in the measurement window.'
              : 'Usage access permission is required under Android Settings > Apps > Special App Access > Usage Access.'}
          </div>
        )}

        <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
          <strong>Security Notice:</strong> Android&apos;s UsageStatsManager exposes cumulative foreground screen time only.
          It does not measure background microphone, camera, or sensor access.
        </div>
      </div>

      {/* Security Findings for This App */}
      {app.findings.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Security Findings ({app.findings.length})
          </h3>

          <div className="space-y-2.5">
            {app.findings.map((f) => (
              <div
                key={f.id}
                className={`p-4 rounded-xl bg-white dark:bg-slate-900 border space-y-2.5 ${
                  f.riskLevel === 'HIGH_PRIORITY'
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                    : f.riskLevel === 'REVIEW_RECOMMENDED'
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{f.title}</h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                      f.riskLevel === 'HIGH_PRIORITY'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : f.riskLevel === 'REVIEW_RECOMMENDED'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {f.riskLevel.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">Supporting Evidence:</span>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 pl-1 space-y-0.5 mt-0.5 text-xs">
                      {f.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">Why it matters:</span>
                    <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">{f.whyItDeservesAttention}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">What cannot be verified locally:</span>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{f.whatCannotBeVerified}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                    <strong>Recommended Action:</strong> {f.practicalNextAction}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Breakdown & Grant/Revoke Switches */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Permissions ({app.permissions.length} total, {app.sensitivePermissionCount} sensitive granted)
          </h3>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            Tap button to toggle state
          </span>
        </div>

        <div className="space-y-2">
          {app.permissions.map((perm) => (
            <div
              key={perm.name}
              className={`p-3.5 rounded-xl bg-white dark:bg-slate-900 border transition-all ${
                perm.isSensitive
                  ? perm.isGranted
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/15'
                    : 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-semibold ${perm.isSensitive ? 'text-amber-900 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
                      {perm.simpleName}
                    </span>
                    {perm.isSensitive && (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Sensitive ({perm.category})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono break-all">{perm.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{perm.description}</p>
                  {perm.isSensitive && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium pt-0.5">
                      Security risk: {perm.whyDangerous}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onTogglePermissionGrant(app.packageName, perm.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border shrink-0 cursor-pointer ${
                    perm.isGranted
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {perm.isGranted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Granted</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Denied</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observation History Timeline */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Local Observation History
        </h3>

        {appObservations.length === 0 ? (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Observation logging begins with your first scan. Future permission grants, revocations, or updates will appear on this timeline.
          </div>
        ) : (
          <div className="space-y-2">
            {appObservations.map((obs) => (
              <div
                key={obs.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700 dark:text-blue-400 font-semibold">{obs.eventType.replace('_', ' ')}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">{new Date(obs.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{obs.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
