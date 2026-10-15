import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Layers,
  History,
  Settings,
  UploadCloud,
  ChevronRight,
  Bell,
  X,
} from 'lucide-react';
import {
  AppSecurityProfile,
  ScanSession,
  ObservationEvent,
  ThemePreference,
} from './types';
import { buildInitialApps } from './data/initialApps';
import { evaluateAppRisk } from './utils/riskEngine';
import { CyberNavbar, AppMode } from './components/CyberNavbar';
import { DashboardView } from './components/screens/DashboardView';
import { AppListView } from './components/screens/AppListView';
import { AppDetailView } from './components/screens/AppDetailView';
import { AnalyticsView } from './components/screens/AnalyticsView';
import { FindingsView } from './components/screens/FindingsView';
import { ApkCheckView } from './components/screens/ApkCheckView';
import { HistoryView } from './components/screens/HistoryView';
import { SettingsView } from './components/screens/SettingsView';
import { SourceCodeExplorer } from './components/SourceCodeExplorer';

export default function App() {
  const [viewMode, setViewMode] = useState<AppMode>('DEVICE_SIMULATOR');
  // Default to dashboard as the primary executive view; APK Review is last in navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Theme Management (Light / Dark / System)
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('permiscan_theme_pref') as ThemePreference;
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    }
    return 'light';
  });

  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  const isDark = themePreference === 'dark' || (themePreference === 'system' && isSystemDark);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      try {
        localStorage.setItem('permiscan_theme_pref', themePreference);
      } catch {
        // ignore
      }
    }
  }, [isDark, themePreference]);

  const handleToggleTheme = () => {
    setThemePreference((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Online threat intelligence toggle state
  const [enableOnlineReputation, setEnableOnlineReputation] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('permiscan_online_rep');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleOnlineReputation = () => {
    setEnableOnlineReputation((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('permiscan_online_rep', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [hasUsageAccess, setHasUsageAccess] = useState<boolean>(true);
  const [apps, setApps] = useState<AppSecurityProfile[]>(() => buildInitialApps(true));
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStage, setScanStage] = useState<string>('');
  const [lastDurationMs, setLastDurationMs] = useState<number>(312);

  const [sessions, setSessions] = useState<ScanSession[]>(() => [
    {
      id: 'session-baseline',
      timestamp: Date.now() - 1000 * 60 * 12,
      durationMs: 312,
      totalAppsScanned: 8,
      highRiskCount: 2,
      reviewRecommendedCount: 2,
      lowRiskCount: 4,
      totalSensitivePermissionsGranted: 14,
    },
  ]);

  const [observations, setObservations] = useState<ObservationEvent[]>(() => [
    {
      id: 'obs-init',
      packageName: 'all',
      appName: 'System Baseline',
      timestamp: Date.now() - 1000 * 60 * 12,
      eventType: 'INITIAL_SCAN',
      detail: 'Initial baseline audit recorded 8 installed application profiles.',
    },
  ]);

  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    packageName?: string;
  } | null>(null);

  // Snapshot tracking for permission state comparisons
  const [previousSnapshots, setPreviousSnapshots] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const init = buildInitialApps(true);
    for (const app of init) {
      for (const p of app.permissions) {
        map[`${app.packageName}:${p.name}`] = p.isGranted;
      }
    }
    return map;
  });

  const allFindings = apps.flatMap((a) => a.findings);

  // Multi-stage working device scan handler
  const handleScanDevice = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(15);
    setScanStage('Querying PackageManager for installed packages...');
    const start = performance.now();

    setTimeout(() => {
      setScanProgress(45);
      setScanStage('Auditing requested & granted permissions...');

      setTimeout(() => {
        setScanProgress(75);
        setScanStage('Evaluating permission combinations & security heuristics...');

        setTimeout(() => {
          setScanProgress(92);
          setScanStage('Comparing state diffs against historical baseline...');

          setTimeout(() => {
            const end = performance.now();
            const elapsed = Math.round(end - start);
            setLastDurationMs(elapsed);

            // Re-evaluate risk for every app based on current granted permissions
            const updatedApps = apps.map((app) => {
              const evalResult = evaluateAppRisk(
                app.packageName,
                app.appName,
                app.isSystemApp,
                app.targetSdk,
                app.installSource,
                app.permissions
              );
              const sensCount = app.permissions.filter((p) => p.isGranted && p.isSensitive).length;

              return {
                ...app,
                riskLevel: evalResult.riskLevel,
                findings: evalResult.findings,
                sensitivePermissionCount: sensCount,
              };
            });

            // Check for permission state diffs
            const newObservations: ObservationEvent[] = [];
            const newSnapshots: Record<string, boolean> = { ...previousSnapshots };

            for (const app of updatedApps) {
              for (const perm of app.permissions) {
                const key = `${app.packageName}:${perm.name}`;
                const wasGranted = previousSnapshots[key];

                if (wasGranted !== undefined && wasGranted !== perm.isGranted) {
                  const evType = perm.isGranted ? 'PERMISSION_GRANTED' : 'PERMISSION_REVOKED';
                  const action = perm.isGranted ? 'granted to' : 'revoked from';
                  newObservations.push({
                    id: `obs-diff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    packageName: app.packageName,
                    appName: app.appName,
                    timestamp: Date.now(),
                    eventType: evType,
                    detail: `Sensitive permission ${perm.simpleName} was ${action} ${app.appName}.`,
                    permissionName: perm.name,
                  });
                  newSnapshots[key] = perm.isGranted;
                }
              }
            }

            setPreviousSnapshots(newSnapshots);
            setApps(updatedApps);

            const highCount = updatedApps.filter((a) => a.riskLevel === 'HIGH_PRIORITY').length;
            const reviewCount = updatedApps.filter((a) => a.riskLevel === 'REVIEW_RECOMMENDED').length;
            const lowCount = updatedApps.filter((a) => a.riskLevel === 'LOW').length;
            const totalSensitive = updatedApps.reduce(
              (acc, a) => acc + a.sensitivePermissionCount,
              0
            );

            const newSession: ScanSession = {
              id: `session-${Date.now()}`,
              timestamp: Date.now(),
              durationMs: elapsed,
              totalAppsScanned: updatedApps.length,
              highRiskCount: highCount,
              reviewRecommendedCount: reviewCount,
              lowRiskCount: lowCount,
              totalSensitivePermissionsGranted: totalSensitive,
            };

            setSessions((prev) => [newSession, ...prev]);

            if (newObservations.length > 0) {
              setObservations((prev) => [...newObservations, ...prev]);
            }

            setIsScanning(false);
            setScanProgress(100);
            setScanStage('');
          }, 180);
        }, 180);
      }, 180);
    }, 180);
  };

  // Toggle permission grant for an individual application
  const handleTogglePermissionGrant = (packageName: string, permissionName: string) => {
    setApps((prevApps) =>
      prevApps.map((app) => {
        if (app.packageName !== packageName) return app;

        const updatedPermissions = app.permissions.map((p) => {
          if (p.name !== permissionName) return p;
          const nextGranted = !p.isGranted;

          // Record observation event
          const newEvent: ObservationEvent = {
            id: `obs-${Date.now()}`,
            packageName: app.packageName,
            appName: app.appName,
            timestamp: Date.now(),
            eventType: nextGranted ? 'PERMISSION_GRANTED' : 'PERMISSION_REVOKED',
            detail: `${nextGranted ? 'Granted' : 'Revoked'} ${p.simpleName} for ${app.appName}`,
            permissionName: p.name,
          };
          setObservations((prev) => [newEvent, ...prev]);

          return { ...p, isGranted: nextGranted };
        });

        // Recompute risk level & findings dynamically
        const evalResult = evaluateAppRisk(
          app.packageName,
          app.appName,
          app.isSystemApp,
          app.targetSdk,
          app.installSource,
          updatedPermissions
        );

        const sensCount = updatedPermissions.filter((p) => p.isGranted && p.isSensitive).length;

        return {
          ...app,
          permissions: updatedPermissions,
          sensitivePermissionCount: sensCount,
          riskLevel: evalResult.riskLevel,
          findings: evalResult.findings,
        };
      })
    );
  };

  // Toggle usage stats access permission
  const handleToggleUsageAccess = () => {
    const nextState = !hasUsageAccess;
    setHasUsageAccess(nextState);
    setApps((prev) =>
      prev.map((app) => ({
        ...app,
        usageInfo: {
          ...app.usageInfo,
          hasUsageAccess: nextState,
          dataAvailable: nextState && app.usageInfo.totalForegroundTimeMs > 0,
          formattedDuration: nextState ? app.usageInfo.formattedDuration : 'Usage access disabled',
        },
      }))
    );
  };

  const handleResetData = () => {
    setApps(buildInitialApps(hasUsageAccess));
    setSessions([
      {
        id: 'session-reset',
        timestamp: Date.now(),
        durationMs: 312,
        totalAppsScanned: 8,
        highRiskCount: 2,
        reviewRecommendedCount: 2,
        lowRiskCount: 4,
        totalSensitivePermissionsGranted: 14,
      },
    ]);
    setObservations([
      {
        id: 'obs-reset',
        packageName: 'all',
        appName: 'System Baseline',
        timestamp: Date.now(),
        eventType: 'INITIAL_SCAN',
        detail: 'Database cache cleared and restored to default baseline.',
      },
    ]);
  };

  const currentSelectedApp = apps.find((a) => a.packageName === selectedPackage) || null;

  const renderScreenContent = () => {
    if (activeTab === 'app_detail' && currentSelectedApp) {
      return (
        <AppDetailView
          app={currentSelectedApp}
          observations={observations}
          onBack={() => setActiveTab('apps')}
          onTogglePermissionGrant={handleTogglePermissionGrant}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            apps={apps}
            findings={allFindings}
            lastSession={sessions[0] || null}
            isScanning={isScanning}
            scanProgress={scanProgress}
            scanStage={scanStage}
            onScan={handleScanDevice}
            onSelectApp={(pkg) => {
              setSelectedPackage(pkg);
              setActiveTab('app_detail');
            }}
            onNavigate={(tab) => setActiveTab(tab)}
            hasUsageAccess={hasUsageAccess}
            onToggleUsageAccess={handleToggleUsageAccess}
          />
        );
      case 'apps':
        return (
          <AppListView
            apps={apps}
            onSelectApp={(pkg) => {
              setSelectedPackage(pkg);
              setActiveTab('app_detail');
            }}
          />
        );
      case 'findings':
        return (
          <FindingsView
            findings={allFindings}
            onSelectApp={(pkg) => {
              setSelectedPackage(pkg);
              setActiveTab('app_detail');
            }}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            apps={apps}
            sessions={sessions}
            observations={observations}
            hasUsageAccess={hasUsageAccess}
          />
        );
      case 'apk_check':
        return (
          <ApkCheckView
            enableOnlineReputation={enableOnlineReputation}
            onSaveReport={(rep) => {
              const newObs: ObservationEvent = {
                id: `obs-apk-${Date.now()}`,
                packageName: rep.packageName,
                appName: rep.appName,
                timestamp: Date.now(),
                eventType: 'INITIAL_SCAN',
                detail: `Audited APK: ${rep.appName} (${rep.riskBand}, score ${rep.riskScore}/100)`,
              };
              setObservations((prev) => [newObs, ...prev]);
            }}
          />
        );
      case 'history':
        return (
          <HistoryView
            sessions={sessions}
            observations={observations}
            onSelectApp={(pkg) => {
              setSelectedPackage(pkg);
              setActiveTab('app_detail');
            }}
          />
        );
      case 'settings':
        return (
          <SettingsView
            hasUsageAccess={hasUsageAccess}
            onToggleUsageAccess={handleToggleUsageAccess}
            onResetData={handleResetData}
            themePreference={themePreference}
            onSelectTheme={(t) => setThemePreference(t)}
            enableOnlineReputation={enableOnlineReputation}
            onToggleOnlineReputation={handleToggleOnlineReputation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100">
      {/* Top Navbar */}
      <CyberNavbar
        mode={viewMode}
        onModeChange={(m) => setViewMode(m)}
        isScanning={isScanning}
        onQuickScan={handleScanDevice}
        lastDurationMs={lastDurationMs}
        theme={isDark ? 'dark' : 'light'}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col">
        {/* Floating System Security Notification Alert */}
        {notification && (
          <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-md flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-100 dark:border-rose-800">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-rose-900 dark:text-rose-200">{notification.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{notification.message}</p>
                {notification.packageName && (
                  <button
                    onClick={() => {
                      setSelectedPackage(notification.packageName!);
                      setActiveTab('app_detail');
                      setNotification(null);
                    }}
                    className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Audit this application now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Mode Switching */}
        {viewMode === 'SOURCE_EXPLORER' ? (
          <SourceCodeExplorer />
        ) : viewMode === 'DEVICE_SIMULATOR' ? (
          /* Android Mobile Phone Frame Simulator */
          <div className="flex-1 flex items-center justify-center py-2">
            <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-[40px] p-2.5 shadow-xl border-4 border-slate-300 dark:border-slate-700 ring-1 ring-slate-200/80 dark:ring-slate-800 flex flex-col h-[780px] max-h-[92vh] overflow-hidden relative transition-colors duration-200">
              {/* Phone Status Bar */}
              <div className="h-7 px-5 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-850 rounded-t-[30px] border-b border-slate-100 dark:border-slate-800 select-none">
                <span>09:41</span>
                <div className="w-18 h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-700 dark:text-blue-400 font-bold text-[11px]">5G</span>
                  <span className="text-[11px]">94%</span>
                </div>
              </div>

              {/* Scrollable Screen Body (With pb-24 so content never gets covered by bottom nav) */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 select-text pb-24">
                {renderScreenContent()}
              </div>

              {/* Material 3 Bottom Navigation Bar - APK Review is in the LAST position */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 flex items-center justify-around text-xs font-medium text-slate-500 dark:text-slate-400 rounded-b-[30px] shadow-xs">
                {/* 1. Dashboard */}
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[11px]">Dashboard</span>
                </button>

                {/* 2. Apps */}
                <button
                  onClick={() => setActiveTab('apps')}
                  className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'apps' || activeTab === 'app_detail'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                  <span className="text-[11px]">Apps</span>
                </button>

                {/* 3. Findings */}
                <button
                  onClick={() => setActiveTab('findings')}
                  className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'findings'
                      ? 'text-amber-600 dark:text-amber-400 font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-[11px]">Findings</span>
                </button>

                {/* 4. Analytics */}
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-[11px]">Analytics</span>
                </button>

                {/* 5. APK Review — LAST position in navigation as requested */}
                <button
                  onClick={() => setActiveTab('apk_check')}
                  className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'apk_check'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <UploadCloud className="w-5 h-5" />
                  <span className="text-[11px]">APK Review</span>
                </button>
              </div>

              {/* Android Gesture Bar */}
              <div className="h-1.5 bg-white dark:bg-slate-900 flex items-center justify-center absolute bottom-0.5 left-0 right-0">
                <div className="w-24 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          /* Full Screen Desktop Mode */
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs shrink-0 space-y-1 text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1.5">
                Device Audit
              </div>

              {/* 1. Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Dashboard</span>
              </button>

              {/* 2. Installed Apps */}
              <button
                onClick={() => setActiveTab('apps')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'apps' || activeTab === 'app_detail'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Installed Apps</span>
              </button>

              {/* 3. Findings */}
              <button
                onClick={() => setActiveTab('findings')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'findings'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Security Findings</span>
              </button>

              {/* 4. Analytics */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Analytics &amp; Usage</span>
              </button>

              {/* 5. Scan History */}
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Scan History</span>
              </button>

              {/* 6. Settings */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Settings &amp; Privacy</span>
              </button>

              {/* 7. APK Review — LAST position in sidebar navigation */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-1">
                  Pre-Install Security
                </div>
                <button
                  onClick={() => setActiveTab('apk_check')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'apk_check'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>APK Review</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">Tool</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-y-auto">
              {renderScreenContent()}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        PermiScan • Production-Ready Android Mobile Security Assistant • Kotlin &amp; Jetpack Compose
      </footer>
    </div>
  );
}
