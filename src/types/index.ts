export type RiskLevel = 'LOW' | 'REVIEW_RECOMMENDED' | 'HIGH_PRIORITY';

export type RiskBand =
  | 'VERY_HIGH_RISK'
  | 'HIGH_RISK'
  | 'ELEVATED_RISK'
  | 'MODERATE_RISK'
  | 'LOWER_RISK'
  | 'LOWEST_RISK';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface PermissionDetail {
  name: string;
  simpleName: string;
  isGranted: boolean;
  isSensitive: boolean;
  category: 'CAMERA' | 'MICROPHONE' | 'LOCATION' | 'CONTACTS' | 'SMS' | 'PHONE' | 'STORAGE' | 'SYSTEM';
  description: string;
  whyDangerous: string;
}

export interface UsageInfo {
  hasUsageAccess: boolean;
  totalForegroundTimeMs: number;
  lastTimeUsedMs: number;
  formattedDuration: string;
  dataAvailable: boolean;
}

export interface RiskFinding {
  id: string;
  packageName: string;
  appName: string;
  riskLevel: RiskLevel;
  title: string;
  evidence: string[];
  whyItDeservesAttention: string;
  whatCannotBeVerified: string;
  practicalNextAction: string;
  detectedAt: number;
  category?: string;
  scoreContribution?: number;
}

export interface AppSecurityProfile {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  targetSdk: number;
  minSdk: number;
  isSystemApp: boolean;
  installSource: string;
  firstInstallTime: number;
  lastUpdateTime: number;
  permissions: PermissionDetail[];
  sensitivePermissionCount: number;
  usageInfo: UsageInfo;
  riskLevel: RiskLevel;
  findings: RiskFinding[];
}

export interface ScanSession {
  id: string;
  timestamp: number;
  durationMs: number;
  totalAppsScanned: number;
  highRiskCount: number;
  reviewRecommendedCount: number;
  lowRiskCount: number;
  totalSensitivePermissionsGranted: number;
}

export interface ObservationEvent {
  id: string;
  packageName: string;
  appName: string;
  timestamp: number;
  eventType: 'INITIAL_SCAN' | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED' | 'APP_UPDATED' | 'NEW_INSTALL';
  detail: string;
  permissionName?: string;
}

export interface ApkComponent {
  type: 'activity' | 'service' | 'receiver' | 'provider';
  name: string;
  isExported: boolean;
  permission?: string;
  intentFilters?: string[];
}

export interface ApkSignatureInfo {
  hasV1Scheme: boolean;
  hasV2Scheme: boolean;
  hasV3Scheme: boolean;
  signatureStatus: 'VERIFIED' | 'UNVERIFIED' | 'SELF_SIGNED' | 'NO_SIGNATURE';
  certIssuer?: string;
  certSubject?: string;
  certFingerprintSha256?: string;
  isSelfSigned: boolean;
  explanation: string;
}

export interface SuspiciousIndicator {
  id: string;
  category: 'INSECURE_CONFIGURATION' | 'OVERLAY_ABUSE' | 'NETWORK_CLEARTEXT' | 'EXPORTED_SURFACE' | 'PERMISSION_ANOMALY' | 'PERSISTENCE';
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  technicalDetails?: string;
  impact: string;
  recommendation: string;
  scoreWeight: number;
}

export interface OnlineReputationInfo {
  status: 'CHECKED' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'NOT_FOUND';
  checkedAt?: number;
  source?: string;
  detectionsCount?: number;
  totalEngines?: number;
  publicRating?: number;
  userReviewsSummary?: {
    positiveThemes: string[];
    negativeThemes: string[];
    totalReviewsCount: number;
  };
  explanation: string;
  isOffline: boolean;
}

export interface ApkAnalysisReport {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileSha256: string;
  analyzedAt: number;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
  riskScore: number; // 0 - 100
  riskBand: RiskBand;
  riskScoreExplanation: string;
  evidenceCoveragePercent: number;
  permissions: PermissionDetail[];
  components: ApkComponent[];
  exportedComponentsCount: number;
  nativeLibraries: string[];
  embeddedUrls: string[];
  signatureInfo: ApkSignatureInfo;
  suspiciousIndicators: SuspiciousIndicator[];
  onlineReputation: OnlineReputationInfo;
  findings: RiskFinding[];
  limitations: string[];
}

export interface UserSettings {
  theme: ThemePreference;
  enableOnlineReputation: boolean;
  askBeforeOnlineLookup: boolean;
  maxFileSizeMb: number;
  virusTotalApiKey?: string;
}
