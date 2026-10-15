import React, { useState, useEffect } from 'react';
import {
  Lock,
  Sliders,
  AlertTriangle,
  RefreshCcw,
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  Globe,
  Wifi,
  WifiOff,
  Key,
} from 'lucide-react';
import { ThemePreference } from '../../types';

interface Props {
  hasUsageAccess: boolean;
  onToggleUsageAccess: () => void;
  onResetData: () => void;
  themePreference: ThemePreference;
  onSelectTheme: (theme: ThemePreference) => void;
  enableOnlineReputation: boolean;
  onToggleOnlineReputation: () => void;
}

export const SettingsView: React.FC<Props> = ({
  hasUsageAccess,
  onToggleUsageAccess,
  onResetData,
  themePreference,
  onSelectTheme,
  enableOnlineReputation,
  onToggleOnlineReputation,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load saved API key
    try {
      const stored = localStorage.getItem('permiscan_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.virusTotalApiKey) {
          setApiKey(parsed.virusTotalApiKey);
        }
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveApiKey = () => {
    try {
      const stored = localStorage.getItem('permiscan_settings');
      const parsed = stored ? JSON.parse(stored) : {};
      parsed.virusTotalApiKey = apiKey.trim();
      localStorage.setItem('permiscan_settings', JSON.stringify(parsed));
      setSavedKeySuccess(true);
      setTimeout(() => setSavedKeySuccess(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Settings &amp; Privacy</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Appearance, threat intelligence preferences, Android platform security gates, and local cache controls
        </p>
      </div>

      {/* Theme Preference Card */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Appearance &amp; Theme
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Choose your preferred color theme. PermiScan provides clean light and dark styles.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-medium">
          <button
            onClick={() => onSelectTheme('light')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              themePreference === 'light'
                ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs font-semibold'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            onClick={() => onSelectTheme('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              themePreference === 'dark'
                ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs font-semibold'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-500" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => onSelectTheme('system')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              themePreference === 'system'
                ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs font-semibold'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Laptop className="w-4 h-4 text-slate-500" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Online Threat Intelligence & Community Lookup Preferences */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Online Threat Intelligence &amp; Community Reviews
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Verify APK file hashes against public security feeds and community ratings when connected.
            </p>
          </div>

          <div className="shrink-0 ml-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Wifi className="w-3 h-3" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
        </div>

        {/* Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">
              Enable Online Reputation Queries
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              When disabled or when offline, PermiScan runs 100% locally with on-device heuristics without any outbound network calls.
            </p>
          </div>

          <button
            onClick={onToggleOnlineReputation}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              enableOnlineReputation
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
            }`}
          >
            {enableOnlineReputation ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Optional VirusTotal API Key Field */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
            <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Custom VirusTotal API Key (Optional)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            By default, PermiScan queries public threat databases. Enter a personal VirusTotal v3 API key to query your private quota.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your VirusTotal API key..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 font-mono"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              {savedKeySuccess ? 'Saved!' : 'Save Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Zero-Exfiltration Privacy Guarantee Card */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200/90 dark:border-emerald-800 space-y-2">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Zero-Exfiltration Privacy Guarantee</span>
        </div>
        <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
          PermiScan operates on-device. All package audits, permission queries, and usage statistics are processed locally using standard Android platform APIs.
        </p>
        <ul className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1 list-disc list-inside pt-1">
          <li><strong>No Cloud Upload:</strong> Your installed application inventory is never sent off-device.</li>
          <li><strong>No Ad SDKs or Trackers:</strong> Zero third-party telemetry libraries are bundled.</li>
          <li><strong>Transparent Heuristics:</strong> Risk scores rely on documented, explainable security rules.</li>
        </ul>
      </div>

      {/* Special System Access Controls */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Special App Access &amp; System Permissions
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Android platform security access gates
          </p>
        </div>

        {/* Usage Access Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Usage Access (UsageStatsManager)</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                  hasUsageAccess
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {hasUsageAccess ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Required to read foreground app screen time. On real Android hardware, users configure this under Android Settings &gt; Special App Access.
            </p>
          </div>

          <button
            onClick={onToggleUsageAccess}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              hasUsageAccess
                ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            {hasUsageAccess ? 'Revoke Access' : 'Enable Access'}
          </button>
        </div>

        {/* QUERY_ALL_PACKAGES info */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="font-semibold text-slate-900 dark:text-white block">Package Visibility (QUERY_ALL_PACKAGES)</span>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Declared in `AndroidManifest.xml` with Google Play policy compliance rationale as a dedicated security assistant and permission manager.
          </p>
        </div>
      </div>

      {/* Android Security Platform Boundaries */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Android Architectural Boundaries &amp; Limitations
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          In compliance with honest mobile cybersecurity engineering principles, PermiScan explicitly outlines what standard third-party Android applications can and cannot observe:
        </p>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
          <p>
            <strong className="text-slate-900 dark:text-white">1. Real-Time Hardware Sensor Invocations:</strong> Standard apps without root cannot passively eavesdrop on when other apps turn on the camera or microphone.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">2. Foreground vs. Background:</strong> High foreground screen time reflects active user engagement; it does not constitute proof of background data exfiltration.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">3. System Installer Overlays:</strong> Non-manufacturer apps cannot replace the core system package installation UI dialog; PermiScan provides pre-install APK file inspection as proactive defense.
          </p>
        </div>
      </div>

      {/* Cache Reset Action */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white block">Reset Local Observation Database</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clears local scan records and restores baseline snapshot state.
          </p>
        </div>
        <button
          onClick={onResetData}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reset Cache</span>
        </button>
      </div>
    </div>
  );
};
