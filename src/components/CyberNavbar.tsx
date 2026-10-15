import React from 'react';
import { ShieldCheck, Smartphone, Monitor, Code2, RefreshCw, Sun, Moon } from 'lucide-react';

export type AppMode = 'DEVICE_SIMULATOR' | 'EXPANDED_CONSOLE' | 'SOURCE_EXPLORER';

interface Props {
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  isScanning: boolean;
  onQuickScan: () => void;
  lastDurationMs: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const CyberNavbar: React.FC<Props> = ({
  mode,
  onModeChange,
  isScanning,
  onQuickScan,
  lastDurationMs,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">PermiScan</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Android Security
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Proactive permission auditing &amp; APK review</p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-medium">
          <button
            onClick={() => onModeChange('DEVICE_SIMULATOR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'DEVICE_SIMULATOR'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Phone View</span>
          </button>

          <button
            onClick={() => onModeChange('EXPANDED_CONSOLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'EXPANDED_CONSOLE'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Full Screen</span>
          </button>

          <button
            onClick={() => onModeChange('SOURCE_EXPLORER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'SOURCE_EXPLORER'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kotlin Source</span>
          </button>
        </div>

        {/* Right Actions: Theme toggle & Quick Scan */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {lastDurationMs > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{lastDurationMs}ms</span>
            </div>
          )}

          <button
            onClick={onQuickScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-xs rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Device'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
