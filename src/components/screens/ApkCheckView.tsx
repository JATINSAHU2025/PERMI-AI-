import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Lock,
  Globe,
  Info,
  WifiOff,
  Wifi,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Clock,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { ApkAnalysisReport, OnlineReputationInfo } from '../../types';
import { parseAndAnalyzeApk } from '../../utils/apkParser';
import { RiskMeter } from '../RiskMeter';

interface Props {
  onSaveReport?: (report: ApkAnalysisReport) => void;
  enableOnlineReputation?: boolean;
}

const ANALYSIS_STAGES = [
  { id: 1, label: 'Reading APK archive', minPercent: 12 },
  { id: 2, label: 'Extracting package information & manifest', minPercent: 28 },
  { id: 3, label: 'Checking permissions and components', minPercent: 48 },
  { id: 4, label: 'Checking signing certificates & integrity', minPercent: 68 },
  { id: 5, label: 'Calculating 0-100 risk score', minPercent: 82 },
  { id: 6, label: 'Checking online reputation & user reviews', minPercent: 92 },
  { id: 7, label: 'Preparing security report', minPercent: 98 },
];

export const ApkCheckView: React.FC<Props> = ({
  onSaveReport,
  enableOnlineReputation = true,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    sizeFormatted: string;
    bytes: number;
    lastModifiedFormatted: string;
    mimeType: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const [report, setReport] = useState<ApkAnalysisReport | null>(null);
  const [isCopiedHash, setIsCopiedHash] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  // Monitor network online / offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Validate and read file information
  const handleValidateAndSetFile = async (file: File) => {
    setFileError(null);
    setReport(null);

    // Validate size
    if (file.size === 0) {
      setFileError('The selected file is empty (0 bytes). Please choose a valid APK package.');
      setSelectedFile(null);
      setFileDetails(null);
      return;
    }

    const maxBytes = 200 * 1024 * 1024; // 200 MB
    if (file.size > maxBytes) {
      setFileError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). PermiScan supports packages up to 200 MB.`
      );
      setSelectedFile(null);
      setFileDetails(null);
      return;
    }

    // Check extension & MIME
    const nameLower = file.name.toLowerCase();
    const isApkExt = nameLower.endsWith('.apk');
    const isApkMime =
      file.type === 'application/vnd.android.package-archive' ||
      file.type === 'application/octet-stream' ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed';

    // Verify ZIP magic bytes (PK\x03\x04)
    let isZipHeader = false;
    try {
      const sliceBuffer = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(sliceBuffer);
      if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
        isZipHeader = true;
      }
    } catch {
      // ignore slice errors
    }

    if (!isApkExt && !isApkMime && !isZipHeader) {
      setFileError(
        'Please select a valid Android package file (.apk). Selected file does not appear to be an Android package archive.'
      );
      setSelectedFile(null);
      setFileDetails(null);
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const dateFormatted = new Date(file.lastModified).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setSelectedFile(file);
    setFileDetails({
      name: file.name,
      sizeFormatted: `${sizeMb} MB (${file.size.toLocaleString()} bytes)`,
      bytes: file.size,
      lastModifiedFormatted: dateFormatted,
      mimeType: file.type || 'application/vnd.android.package-archive',
    });
  };

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => Math.max(prev - 1, 0));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleValidateAndSetFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileDetails(null);
    setFileError(null);
    setReport(null);
    setIsAnalyzing(false);
    setProgressPercent(0);
    setProgressStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    cancelRef.current = false;
    setIsAnalyzing(true);
    setFileError(null);
    setReport(null);
    setProgressPercent(5);
    setProgressStage('Initializing on-device static analysis environment...');

    try {
      const generatedReport = await parseAndAnalyzeApk(selectedFile, {
        enableOnlineReputation,
        onProgress: (stage, percent) => {
          if (!cancelRef.current) {
            setProgressStage(stage);
            setProgressPercent(percent);
          }
        },
      });

      if (!cancelRef.current) {
        setReport(generatedReport);
        if (onSaveReport) {
          onSaveReport(generatedReport);
        }
      }
    } catch (err: any) {
      if (!cancelRef.current) {
        setFileError(
          err.message || 'An unexpected error occurred while analyzing the APK archive.'
        );
        setReport(null);
      }
    } finally {
      if (!cancelRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleCancelAnalysis = () => {
    cancelRef.current = true;
    setIsAnalyzing(false);
    setProgressPercent(0);
    setProgressStage('');
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setIsCopiedHash(true);
    setTimeout(() => setIsCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      {/* Header with Network Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>APK Security &amp; Privacy Review</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Safely audit pre-installation Android package archives. Evaluates manifest declarations, digital signatures, permissions, and threat reputation.
          </p>
        </div>

        {/* Offline / Online Status Badge */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online Mode</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode (100% On-Device)</span>
            </span>
          )}
        </div>
      </div>

      {/* File Upload / Drag-and-Drop Area (When no file is loaded) */}
      {!selectedFile && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900/60 ${
            dragCounter > 0
              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-2xs">
            <UploadCloud className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
              Drop an APK here or choose a file
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Select any Android Application Package (.apk) to inspect its permissions, exported components, cryptographic certificates, and privacy footprint without executing code.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <label className="cursor-pointer px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Browse Files</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleValidateAndSetFile(file);
                }}
              />
            </label>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            <span>Supports standard .apk packages</span>
            <span>•</span>
            <span>Up to 200 MB</span>
            <span>•</span>
            <span>Private &amp; On-Device</span>
          </div>
        </div>
      )}

      {/* Selected File Card: Displays detailed file information & manual Scan trigger */}
      {selectedFile && fileDetails && !isAnalyzing && !report && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-6 h-6 stroke-[1.8]" />
              </div>

              <div className="min-w-0 space-y-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {fileDetails.name}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fileDetails.sizeFormatted}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fileDetails.lastModifiedFormatted}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Valid APK package container</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                    <span>Ready to scan</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleStartAnalysis}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Scan APK</span>
            </button>
            <button
              onClick={handleRemoveFile}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer"
            >
              Remove File
            </button>
          </div>
        </div>
      )}

      {/* Validation Error Alert */}
      {fileError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">APK Inspection Notice</span>
            <p className="leading-relaxed">{fileError}</p>
            <button
              onClick={handleRemoveFile}
              className="mt-1 text-xs text-rose-700 dark:text-rose-400 font-semibold underline block cursor-pointer"
            >
              Choose another APK file
            </button>
          </div>
        </div>
      )}

      {/* Multi-Step Analysis Progress Display (Real 7 stages) */}
      {isAnalyzing && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in duration-200">
          {/* Header & Overall Percentage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Auditing Package Archive
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                  {selectedFile?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {progressPercent}%
              </span>
              <button
                onClick={handleCancelAnalysis}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current Stage Caption */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">{progressStage}</span>
          </div>

          {/* 7 Distinct Analysis Stages */}
          <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Inspection Stages
            </span>

            <div className="grid grid-cols-1 gap-1.5">
              {ANALYSIS_STAGES.map((stage) => {
                const isComplete = progressPercent > stage.minPercent;
                const nextMin = ANALYSIS_STAGES[stage.id]?.minPercent ?? 100;
                const isCurrent = progressPercent >= stage.minPercent && progressPercent <= nextMin;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-medium'
                        : isComplete
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-600 shrink-0">
                          {stage.id}
                        </div>
                      )}
                      <span>
                        {stage.id}. {stage.label}
                      </span>
                    </div>

                    <span className="text-[11px]">
                      {isComplete ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">Done</span>
                      ) : isCurrent ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Active</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">Pending</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Complete APK Security & Privacy Report */}
      {report && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Report Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Security &amp; Privacy Audit Report
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {report.appName} <span className="font-normal text-slate-500 dark:text-slate-400">({report.fileName})</span>
              </h3>
            </div>

            <button
              onClick={handleRemoveFile}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Scan Another APK
            </button>
          </div>

          {/* Section 1: 6-Segment Speedometer Risk Meter */}
          <RiskMeter
            score={report.riskScore}
            riskBand={report.riskBand}
            explanation={report.riskScoreExplanation}
            coveragePercent={report.evidenceCoveragePercent}
          />

          {/* Section 2: Key Findings Requiring Attention */}
          {report.findings.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Key Findings Requiring Attention
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {report.findings.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {report.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className={`p-4 rounded-xl bg-white dark:bg-slate-900 border space-y-2.5 shadow-2xs ${
                      finding.riskLevel === 'HIGH_PRIORITY'
                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                        : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                        {finding.title}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                          finding.riskLevel === 'HIGH_PRIORITY'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {finding.riskLevel.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">
                          Evidence:
                        </span>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 pl-1 space-y-0.5 text-xs">
                          {finding.evidence.map((ev, i) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">
                          Why it deserves attention:
                        </span>
                        <p>{finding.whyItDeservesAttention}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">
                          What cannot be verified via static inspection:
                        </span>
                        <p className="italic text-slate-500 dark:text-slate-400">
                          {finding.whatCannotBeVerified}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-150 dark:border-slate-700">
                        <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">
                          Practical Next Action:
                        </span>
                        <p>{finding.practicalNextAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: App Identity & Package Metadata */}
          <div className="p-4.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Application &amp; Package Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Package Name</span>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate block">
                  {report.packageName}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Target Android SDK</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  API {report.targetSdk} (Min SDK: API {report.minSdk})
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Archive Size</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {(report.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB ({report.fileSizeBytes.toLocaleString()} bytes)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Exported Components</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {report.exportedComponentsCount} of {report.components.length} components
                </span>
              </div>
              <div className="col-span-1 sm:col-span-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">File SHA-256 Hash</span>
                  <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate block">
                    {report.fileSha256}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyHash(report.fileSha256)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
                  title="Copy SHA-256"
                >
                  {isCopiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Permissions & Sensitive Flags */}
          <div className="p-4.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Permissions &amp; Privacy ({report.permissions.length} declared)
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {report.permissions.filter((p) => p.isSensitive).length} sensitive
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Permissions declared in the manifest are capabilities requested by the developer. They require runtime user authorization on the Android device before active access.
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {report.permissions.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  No permissions declared in AndroidManifest.xml.
                </div>
              ) : (
                report.permissions.map((p) => (
                  <div
                    key={p.name}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      p.isSensitive
                        ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className={`font-semibold ${p.isSensitive ? 'text-amber-900 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
                        {p.simpleName}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{p.description}</p>
                    </div>
                    {p.isSensitive && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                        Sensitive
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 5: Signature & Digital Integrity */}
          <div className="p-4.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Cryptographic Signature &amp; Integrity
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Signing Scheme:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {report.signatureInfo.hasV2Scheme ? 'APK Signature Scheme v2/v3' : 'JAR Signing Scheme v1'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Certificate Status:</span>
                <span className={`font-semibold ${report.signatureInfo.isSelfSigned ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {report.signatureInfo.signatureStatus.replace('_', ' ')}
                </span>
              </div>
              {report.signatureInfo.certIssuer && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Issuer:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                    {report.signatureInfo.certIssuer}
                  </span>
                </div>
              )}
              {report.signatureInfo.certFingerprintSha256 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Cert SHA-256:</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[220px]">
                    {report.signatureInfo.certFingerprintSha256.substring(0, 24)}...
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                {report.signatureInfo.explanation}
              </p>
            </div>
          </div>

          {/* Section 6: Online Reputation & User Community Reviews */}
          <div className="p-4.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Online Threat Intelligence &amp; Community Reviews
              </h3>
              {report.onlineReputation.isOffline ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Offline Mode
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Verified Online
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {report.onlineReputation.explanation}
            </p>

            {/* Detections Counter if checked */}
            {report.onlineReputation.detectionsCount !== undefined && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Antivirus Flagged</span>
                  <span className={`font-semibold text-sm ${report.onlineReputation.detectionsCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {report.onlineReputation.detectionsCount} / {report.onlineReputation.totalEngines || 70}
                  </span>
                </div>
                {report.onlineReputation.publicRating && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Public Store Rating</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      ★ {report.onlineReputation.publicRating} / 5.0
                    </span>
                  </div>
                )}
                {report.onlineReputation.source && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Intelligence Feed</span>
                    <span className="font-medium text-xs text-slate-700 dark:text-slate-300 truncate block">
                      {report.onlineReputation.source}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Community User Reviews Summary (if cataloged) */}
            {report.onlineReputation.userReviewsSummary && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Community Reviews Summary ({report.onlineReputation.userReviewsSummary.totalReviewsCount.toLocaleString()} ratings)
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <ThumbsUp className="w-3 h-3" /> Positive Feedback:
                    </span>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 pl-1 text-[11px] space-y-0.5">
                      {report.onlineReputation.userReviewsSummary.positiveThemes.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {report.onlineReputation.userReviewsSummary.negativeThemes.length > 0 && (
                    <div className="pt-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        <ThumbsDown className="w-3 h-3" /> Reported Issues:
                      </span>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 pl-1 text-[11px] space-y-0.5">
                        {report.onlineReputation.userReviewsSummary.negativeThemes.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Recommended Next Action */}
          <div className="p-4.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-2">
            <h3 className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Recommended Next Action
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
              {report.riskBand === 'VERY_HIGH_RISK'
                ? 'We recommend against installing this application due to high-risk permission combinations and sensitive capabilities. If installation is mandatory, restrict all background permissions.'
                : report.riskBand === 'HIGH_RISK'
                ? 'Review each permission prompt carefully during initial launch. Deny background location and overlay access unless strictly necessary.'
                : report.riskBand === 'ELEVATED_RISK'
                ? 'Review requested capabilities carefully. Audit exported components and avoid granting background access unless required.'
                : report.riskBand === 'MODERATE_RISK'
                ? 'The application declares normal capabilities. Grant sensitive permissions (e.g. location or camera) only when using relevant features.'
                : report.riskBand === 'LOWER_RISK'
                ? 'The application declares standard permissions for its category. Safe for typical use.'
                : 'The application declares minimal capabilities and no suspicious permission patterns. Safe for standard installation.'}
            </p>
          </div>

          {/* Section 8: Expandable Technical Details (Native Libraries & Components) */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Technical Analysis Details (Native Libraries, Components, Domains)</span>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechnicalDetails && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5 text-xs animate-in fade-in duration-150">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Native Libraries ({report.nativeLibraries.length})
                  </span>
                  {report.nativeLibraries.length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500">No compiled .so native libraries detected.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {report.nativeLibraries.map((lib, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {lib}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Exported Components ({report.components.filter((c) => c.isExported).length})
                  </span>
                  {report.components.filter((c) => c.isExported).length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500">No exported components detected.</span>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {report.components
                        .filter((c) => c.isExported)
                        .map((c, i) => (
                          <div
                            key={i}
                            className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800/60 font-mono text-[10px] text-slate-700 dark:text-slate-300 flex items-center justify-between"
                          >
                            <span className="truncate">{c.name}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ml-2 shrink-0">
                              {c.type}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {report.embeddedUrls.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                      Extracted Network Endpoints ({report.embeddedUrls.length})
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {report.embeddedUrls.map((url, i) => (
                        <div
                          key={i}
                          className="p-1 rounded bg-slate-50 dark:bg-slate-800/60 font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate"
                        >
                          {url}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 9: Analysis Limitations Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              Analysis Limitations &amp; Scope
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 leading-relaxed">
              {report.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
