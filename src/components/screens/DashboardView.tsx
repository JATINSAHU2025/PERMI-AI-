import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  BarChart2,
  CheckCircle,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import { AppSecurityProfile, RiskFinding, ScanSession } from '../../types';

interface Props {
  apps: AppSecurityProfile[];
  findings: RiskFinding[];
  lastSession: ScanSession | null;
  isScanning: boolean;
  scanProgress: number; // 0 to 100
  scanStage: string;
  onScan: () => void;
  onSelectApp: (pkg: string) => void;
  onNavigate: (tab: string) => void;
  hasUsageAccess: boolean;
  onToggleUsageAccess: () => void;
}

export const DashboardView: React.FC<Props> = ({
  apps,
  findings,
  lastSession,
  isScanning,
  scanProgress,
  scanStage,
  onScan,
  onSelectApp,
  onNavigate,
  hasUsageAccess,
  onToggleUsageAccess,
}) => {
  const flaggedApps = apps.filter((a) => a.riskLevel !== 'LOW');
  const highRiskApps = apps.filter((a) => a.riskLevel === 'HIGH_PRIORITY');
  const totalSensitiveGranted = apps.reduce(
    (acc, a) => acc + a.permissions.filter((p) => p.isGranted && p.isSensitive).length,
    0
  );
  const recentUpdatedApps = [...apps].sort((a, b) => b.lastUpdateTime - a.lastUpdateTime).slice(0, 3);

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      {/* Primary Security Status Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                highRiskApps.length > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60'
                  : flaggedApps.length > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60'
              }`}
            >
              {highRiskApps.length > 0 ? (
                <AlertCircle className="w-6 h-6 stroke-[2.2]" />
              ) : flaggedApps.length > 0 ? (
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {highRiskApps.length > 0
                    ? `${highRiskApps.length} Apps Need Immediate Review`
                    : flaggedApps.length > 0
                    ? `${flaggedApps.length} Apps Recommended for Review`
                    : 'Device Security Verified'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {isScanning
                  ? scanStage || 'Scanning installed packages...'
                  : `Last audited ${
                      lastSession
                        ? new Date(lastSession.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'just now'
                    } (${lastSession ? `${lastSession.durationMs}ms` : '312ms'}). ${apps.length} packages inspected.`}
              </p>
            </div>
          </div>

          {/* Prominent Scan Device Button */}
          <button
            onClick={onScan}
            disabled={isScanning}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-medium text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Device...' : 'Scan Device'}</span>
          </button>
        </div>

        {/* Live Scan Progress Bar */}
        {isScanning && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium text-blue-700 dark:text-blue-400">{scanStage || 'Auditing app permissions...'}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{scanProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(scanProgress, 5)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Installed Apps */}
        <div
          onClick={() => onNavigate('apps')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Audited Apps</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{apps.length}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">PackageManager visible</p>
          </div>
        </div>

        {/* Metric 2: Flagged Apps */}
        <div
          onClick={() => onNavigate('findings')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Flagged for Review</span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                flaggedApps.length > 0 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold tracking-tight ${
                flaggedApps.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {flaggedApps.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {highRiskApps.length > 0 ? `${highRiskApps.length} high priority` : 'Review recommended'}
            </p>
          </div>
        </div>

        {/* Metric 3: Sensitive Permissions Granted */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Sensitive Grants</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">{totalSensitiveGranted}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Camera, Mic, GPS, SMS</p>
          </div>
        </div>

        {/* Metric 4: Usage Access Status */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Usage Access</span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                hasUsageAccess ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-sm font-semibold tracking-tight ${
                hasUsageAccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {hasUsageAccess ? 'Authorized' : 'Not Granted'}
            </div>
            <button
              onClick={onToggleUsageAccess}
              className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline text-left block cursor-pointer"
            >
              {hasUsageAccess ? 'Manage Access' : 'Grant Usage Access'}
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Installation APK File Review Link Card */}
      <div
        onClick={() => onNavigate('apk_check')}
        className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/70 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200/80 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              Pre-Installation APK Security Review
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
              Inspect APK files before installation. Audits permissions, signing certificates, and risk scores.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
          <span>Review APK</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Recent Security Findings Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Security Findings</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {findings.length}
            </span>
          </div>
          <button
            onClick={() => onNavigate('findings')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {findings.length === 0 ? (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center space-y-1">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">No Security Findings Detected</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Installed applications adhere to normal permission parameters. No anomalous or disproportionate permission combinations were detected.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {findings.slice(0, 3).map((f) => (
              <div
                key={f.id}
                onClick={() => onSelectApp(f.packageName)}
                className={`p-4 rounded-xl bg-white dark:bg-slate-900 border transition-all cursor-pointer hover:shadow-xs ${
                  f.riskLevel === 'HIGH_PRIORITY'
                    ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                    : f.riskLevel === 'REVIEW_RECOMMENDED'
                    ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{f.title}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          f.riskLevel === 'HIGH_PRIORITY'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {f.riskLevel.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                      {f.appName} <span className="text-slate-400 font-normal">({f.packageName})</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed pt-0.5">
                      {f.whyItDeservesAttention}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Recommended: {f.practicalNextAction}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Installed or Updated Applications */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recently Updated Applications</h3>
          <button
            onClick={() => onNavigate('apps')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
          >
            <span>All Packages</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentUpdatedApps.map((app) => (
            <div
              key={app.packageName}
              onClick={() => onSelectApp(app.packageName)}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs flex items-center justify-between cursor-pointer transition-all gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                  {app.appName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{app.appName}</span>
                    {app.isSystemApp && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{app.packageName}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    app.riskLevel === 'HIGH_PRIORITY'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : app.riskLevel === 'REVIEW_RECOMMENDED'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {app.riskLevel === 'HIGH_PRIORITY' ? 'High' : app.riskLevel === 'REVIEW_RECOMMENDED' ? 'Review' : 'Low'}
                </span>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  {new Date(app.lastUpdateTime).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
