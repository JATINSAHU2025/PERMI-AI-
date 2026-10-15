import React, { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { AppSecurityProfile, RiskLevel } from '../../types';

interface Props {
  apps: AppSecurityProfile[];
  onSelectApp: (pkg: string) => void;
}

export const AppListView: React.FC<Props> = ({ apps, onSelectApp }) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');

  const filteredApps = apps.filter((app) => {
    const matchesQuery =
      app.appName.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || app.riskLevel === riskFilter;
    return matchesQuery && matchesRisk;
  });

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Installed Applications</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {apps.length} applications discovered via Android PackageManager
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by application or package name..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden transition-all shadow-2xs"
        />
      </div>

      {/* Risk Filter Chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setRiskFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
            riskFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          All ({apps.length})
        </button>
        <button
          onClick={() => setRiskFilter('HIGH_PRIORITY')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
            riskFilter === 'HIGH_PRIORITY'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          High Priority ({apps.filter((a) => a.riskLevel === 'HIGH_PRIORITY').length})
        </button>
        <button
          onClick={() => setRiskFilter('REVIEW_RECOMMENDED')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
            riskFilter === 'REVIEW_RECOMMENDED'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          Review ({apps.filter((a) => a.riskLevel === 'REVIEW_RECOMMENDED').length})
        </button>
        <button
          onClick={() => setRiskFilter('LOW')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
            riskFilter === 'LOW'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
        >
          Low Risk ({apps.filter((a) => a.riskLevel === 'LOW').length})
        </button>
      </div>

      {/* App List */}
      {filteredApps.length === 0 ? (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          No applications match the search or filter criteria.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredApps.map((app) => (
            <div
              key={app.packageName}
              onClick={() => onSelectApp(app.packageName)}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-700 dark:group-hover:text-blue-400 group-hover:border-blue-200 transition-colors">
                  {app.appName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {app.appName}
                    </h4>
                    {app.isSystemApp && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{app.packageName}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{app.permissions.length} perms</span>
                    <span className={app.sensitivePermissionCount > 0 ? 'text-amber-700 dark:text-amber-400 font-medium' : ''}>
                      {app.sensitivePermissionCount} sensitive granted
                    </span>
                    {app.usageInfo.dataAvailable && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Used: {app.usageInfo.formattedDuration}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    app.riskLevel === 'HIGH_PRIORITY'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : app.riskLevel === 'REVIEW_RECOMMENDED'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {app.riskLevel.replace('_', ' ')}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
