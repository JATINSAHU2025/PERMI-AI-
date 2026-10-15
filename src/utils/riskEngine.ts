import {
  AppSecurityProfile,
  PermissionDetail,
  RiskFinding,
  RiskLevel,
  RiskBand,
  SuspiciousIndicator,
  ApkComponent,
  ApkSignatureInfo,
  OnlineReputationInfo,
} from '../types';

export function getRiskBand(score: number): RiskBand {
  if (score >= 85) return 'VERY_HIGH_RISK';
  if (score >= 68) return 'HIGH_RISK';
  if (score >= 51) return 'ELEVATED_RISK';
  if (score >= 34) return 'MODERATE_RISK';
  if (score >= 17) return 'LOWER_RISK';
  return 'LOWEST_RISK';
}

export function getRiskBandLabel(band: RiskBand): string {
  switch (band) {
    case 'VERY_HIGH_RISK':
      return 'Very High Risk';
    case 'HIGH_RISK':
      return 'High Risk';
    case 'ELEVATED_RISK':
      return 'Elevated Risk';
    case 'MODERATE_RISK':
      return 'Moderate Risk';
    case 'LOWER_RISK':
      return 'Lower Risk';
    case 'LOWEST_RISK':
      return 'Lowest Risk';
  }
}

export interface RiskEvaluationResult {
  riskScore: number; // 0 - 100
  riskBand: RiskBand;
  riskLevel: RiskLevel;
  riskScoreExplanation: string;
  evidenceCoveragePercent: number;
  findings: RiskFinding[];
  suspiciousIndicators: SuspiciousIndicator[];
}

/**
 * Deterministic, explainable 0–100 risk scoring model.
 * Each evaluated indicator has a documented point weight and plain-English rationale.
 */
export function calculateComprehensiveRiskScore(params: {
  packageName: string;
  appName: string;
  targetSdk: number;
  minSdk: number;
  permissions: PermissionDetail[];
  components?: ApkComponent[];
  signatureInfo?: ApkSignatureInfo;
  onlineReputation?: OnlineReputationInfo;
  manifestFlags?: {
    usesCleartextTraffic?: boolean;
    debuggable?: boolean;
    allowBackup?: boolean;
  };
}): RiskEvaluationResult {
  const {
    packageName,
    appName,
    targetSdk,
    permissions,
    components = [],
    signatureInfo,
    onlineReputation,
    manifestFlags = {},
  } = params;

  let baseScore = 5; // Clean baseline
  const findings: RiskFinding[] = [];
  const suspiciousIndicators: SuspiciousIndicator[] = [];

  const requestedSet = new Set(permissions.map((p) => p.name));
  const sensitivePerms = permissions.filter((p) => p.isSensitive);

  // --- Rule 1: Overlay & Package Installation Capability (Classic Dropper Pattern) ---
  const hasOverlay = requestedSet.has('android.permission.SYSTEM_ALERT_WINDOW');
  const hasInstallPackages = requestedSet.has('android.permission.REQUEST_INSTALL_PACKAGES');
  if (hasOverlay && hasInstallPackages) {
    baseScore += 25;
    findings.push({
      id: `${packageName}-overlay-install`,
      packageName,
      appName,
      riskLevel: 'HIGH_PRIORITY',
      title: 'Overlay Display and Package Installation Permissions',
      evidence: [
        'SYSTEM_ALERT_WINDOW: Can display floating views on top of other running apps',
        'REQUEST_INSTALL_PACKAGES: Can request installation of additional APK packages',
      ],
      whyItDeservesAttention:
        'This combination allows an application to draw deceptive overlays over legitimate login prompts and prompt the user to install secondary payloads.',
      whatCannotBeVerified:
        'Static review cannot verify whether overlays activate only for legitimate UI widgets or during authentication dialogues.',
      practicalNextAction:
        'Do not install this APK unless it comes from a verified developer who requires floating tools (e.g. screen recorders).',
      detectedAt: Date.now(),
      scoreContribution: 25,
      category: 'Attack Surface',
    });

    suspiciousIndicators.push({
      id: 'ind-overlay-install',
      category: 'OVERLAY_ABUSE',
      title: 'Draw Over Apps + Install Packages declared',
      severity: 'CRITICAL',
      description: 'App can draw over arbitrary applications and trigger package installations.',
      impact: 'Enables clickjacking/tapjacking and staged payload delivery.',
      recommendation: 'Check whether the app is an official utility with a verified signature.',
      scoreWeight: 25,
    });
  }

  // --- Rule 2: Disproportionate Audio/Camera Access for Utilities ---
  const isUtility =
    appName.toLowerCase().includes('flashlight') ||
    appName.toLowerCase().includes('calculator') ||
    appName.toLowerCase().includes('torch') ||
    appName.toLowerCase().includes('compass');
  const hasAudio = requestedSet.has('android.permission.RECORD_AUDIO');
  const hasCamera = requestedSet.has('android.permission.CAMERA');
  if (isUtility && (hasAudio || hasCamera)) {
    baseScore += 25;
    findings.push({
      id: `${packageName}-utility-sensor`,
      packageName,
      appName,
      riskLevel: 'HIGH_PRIORITY',
      title: 'Disproportionate Sensor Access for Utility Application',
      evidence: [
        `App name or category indicates utility purpose (${appName})`,
        hasAudio ? 'Requests audio recording (RECORD_AUDIO)' : '',
        hasCamera ? 'Requests optical camera capture (CAMERA)' : '',
      ].filter(Boolean),
      whyItDeservesAttention:
        'Simple utility tools (flashlights, calculators) have no operational need to record acoustic audio or take photos.',
      whatCannotBeVerified:
        'Static analysis cannot verify whether sensor calls originate from an embedded third-party advertising SDK or intentional app features.',
      practicalNextAction:
        'Avoid installing utility applications that request microphone or camera permissions.',
      detectedAt: Date.now(),
      scoreContribution: 25,
      category: 'Permissions',
    });

    suspiciousIndicators.push({
      id: 'ind-utility-sensors',
      category: 'PERMISSION_ANOMALY',
      title: 'Disproportionate hardware sensor requests',
      severity: 'HIGH',
      description: 'Microphone or camera requested by an app claiming to be a simple utility.',
      impact: 'Potential background acoustic or optical surveillance.',
      recommendation: 'Use built-in system tools or open-source alternatives.',
      scoreWeight: 25,
    });
  }

  // --- Rule 3: Persistent Background Location Tracking ---
  const hasBgLoc = requestedSet.has('android.permission.ACCESS_BACKGROUND_LOCATION');
  const hasFineLoc = requestedSet.has('android.permission.ACCESS_FINE_LOCATION');
  if (hasBgLoc && hasFineLoc) {
    baseScore += 20;
    findings.push({
      id: `${packageName}-bg-location`,
      packageName,
      appName,
      riskLevel: 'HIGH_PRIORITY',
      title: 'Continuous Background Location Requested',
      evidence: [
        'ACCESS_BACKGROUND_LOCATION declared in manifest',
        'ACCESS_FINE_LOCATION declared for precise GPS telemetry',
      ],
      whyItDeservesAttention:
        'Continuous background location tracking permits 24/7 physical whereabouts profiling even when the application is not actively displayed.',
      whatCannotBeVerified:
        'Whether GPS coordinates are buffered locally on device or uploaded to external marketing brokers.',
      practicalNextAction:
        'If installed, restrict location access in Android Settings to "Only while using the app".',
      detectedAt: Date.now(),
      scoreContribution: 20,
      category: 'Privacy',
    });

    suspiciousIndicators.push({
      id: 'ind-bg-location',
      category: 'PERMISSION_ANOMALY',
      title: 'Unattended Background Location Tracking',
      severity: 'HIGH',
      description: 'App can query GPS coordinates without visible screen presence.',
      impact: 'Continuous behavioral mobility tracking.',
      recommendation: 'Evaluate whether background navigation or transit tracking is an essential core feature.',
      scoreWeight: 20,
    });
  }

  // --- Rule 4: Two-Factor / Communication Snooping (SMS + Contacts) ---
  const hasSms =
    requestedSet.has('android.permission.READ_SMS') ||
    requestedSet.has('android.permission.RECEIVE_SMS');
  const hasContacts = requestedSet.has('android.permission.READ_CONTACTS');
  if (hasSms && hasContacts) {
    baseScore += 18;
    findings.push({
      id: `${packageName}-sms-contacts`,
      packageName,
      appName,
      riskLevel: 'REVIEW_RECOMMENDED',
      title: 'Combined Address Book & SMS Messaging Access',
      evidence: [
        'Requests SMS message reading or interception',
        'Requests personal contacts address book access',
      ],
      whyItDeservesAttention:
        'SMS access can expose banking one-time passwords (OTPs) and verification codes, while contact access exposes personal relationship graphs.',
      whatCannotBeVerified:
        'Whether incoming messages are parsed by legitimate synchronization routines or sent off-device.',
      practicalNextAction:
        'Only grant SMS permissions if this application is your chosen default messaging client.',
      detectedAt: Date.now(),
      scoreContribution: 18,
      category: 'Privacy',
    });

    suspiciousIndicators.push({
      id: 'ind-sms-contacts',
      category: 'PERMISSION_ANOMALY',
      title: 'SMS & Contacts declared simultaneously',
      severity: 'MEDIUM',
      description: 'Broad exposure to OTP authentication tokens and contact lists.',
      impact: 'Risk of 2FA interception and social graph harvesting.',
      recommendation: 'Audit if the app is an SMS client.',
      scoreWeight: 18,
    });
  }

  // --- Rule 5: Cleartext HTTP Traffic Allowed ---
  if (manifestFlags.usesCleartextTraffic) {
    baseScore += 12;
    suspiciousIndicators.push({
      id: 'ind-cleartext-traffic',
      category: 'NETWORK_CLEARTEXT',
      title: 'Unencrypted cleartext HTTP traffic allowed',
      severity: 'MEDIUM',
      description: 'The app declares android:usesCleartextTraffic="true", permitting unencrypted HTTP connections.',
      impact: 'Vulnerable to man-in-the-middle network interception on public Wi-Fi networks.',
      recommendation: 'Ensure all network communication uses enforced HTTPS/TLS.',
      scoreWeight: 12,
    });
  }

  // --- Rule 6: Debuggable Production Build ---
  if (manifestFlags.debuggable) {
    baseScore += 15;
    suspiciousIndicators.push({
      id: 'ind-debuggable-build',
      category: 'INSECURE_CONFIGURATION',
      title: 'Debuggable flag active (android:debuggable="true")',
      severity: 'HIGH',
      description: 'The APK was built with debugging enabled, allowing external debuggers (ADB) to inspect memory.',
      impact: 'Attackers or malicious apps can attach debuggers to read in-memory variables and private files.',
      recommendation: 'Production apps must never be published with debug flags enabled.',
      scoreWeight: 15,
    });
  }

  // --- Rule 7: Legacy Target SDK (< 29) ---
  if (targetSdk < 29) {
    const isVeryOld = targetSdk < 26;
    const addedScore = isVeryOld ? 15 : 10;
    baseScore += addedScore;
    findings.push({
      id: `${packageName}-legacy-sdk`,
      packageName,
      appName,
      riskLevel: 'REVIEW_RECOMMENDED',
      title: `Legacy Target Android SDK (API ${targetSdk})`,
      evidence: [
        `Target SDK is API ${targetSdk} (Android 10 is API 29, Android 15 is API 35)`,
        'May bypass modern Android scoped storage or runtime background permission requirements',
      ],
      whyItDeservesAttention:
        'Targeting outdated Android versions can be used by developers to avoid modern privacy boundaries and security restrictions.',
      whatCannotBeVerified:
        'Whether the legacy SDK target is due to old unmaintained code or deliberate evasion of Android safeguards.',
      practicalNextAction:
        'Check if an updated version targeting modern Android is available.',
      detectedAt: Date.now(),
      scoreContribution: addedScore,
      category: 'Configuration',
    });

    suspiciousIndicators.push({
      id: 'ind-legacy-sdk',
      category: 'INSECURE_CONFIGURATION',
      title: `Outdated target SDK ${targetSdk}`,
      severity: isVeryOld ? 'HIGH' : 'MEDIUM',
      description: `Targets legacy API ${targetSdk}, which lacks modern Android privacy sandboxing.`,
      impact: 'Bypasses scoped storage and modern permission dialog gates.',
      recommendation: 'Upgrade to a build targeting Android 14+ (API 34+).',
      scoreWeight: addedScore,
    });
  }

  // --- Rule 8: Exported Components Attack Surface ---
  const exportedComponents = components.filter((c) => c.isExported);
  if (exportedComponents.length >= 5) {
    baseScore += 10;
    suspiciousIndicators.push({
      id: 'ind-exported-surface',
      category: 'EXPORTED_SURFACE',
      title: `Wide exported surface: ${exportedComponents.length} components accessible`,
      severity: 'MEDIUM',
      description: `Multiple activities, services or broadcast receivers declare exported="true" without explicit permission gates.`,
      impact: 'Other applications installed on the device can directly launch or trigger these components.',
      recommendation: 'Audit exported components and ensure sensitive entry points enforce android:permission.',
      scoreWeight: 10,
    });
  }

  // --- Rule 9: Sensitive Permissions Density ---
  if (sensitivePerms.length >= 5 && !findings.some((f) => f.id.includes('utility-sensor'))) {
    baseScore += 12;
    findings.push({
      id: `${packageName}-sensitive-density`,
      packageName,
      appName,
      riskLevel: 'REVIEW_RECOMMENDED',
      title: `Broad Sensitive Permission Footprint (${sensitivePerms.length} Sensitive Permissions)`,
      evidence: [
        `${sensitivePerms.length} dangerous/sensitive permissions requested in manifest`,
        `Includes: ${sensitivePerms.slice(0, 4).map((p) => p.simpleName).join(', ')}`,
      ],
      whyItDeservesAttention:
        'The application requests access to multiple categories of sensitive personal data or device hardware.',
      whatCannotBeVerified:
        'Whether each permission is actively requested at runtime or merely declared for optional future modules.',
      practicalNextAction:
        'Review individual permissions during initial runtime prompts and grant only those relevant to your workflow.',
      detectedAt: Date.now(),
      scoreContribution: 12,
      category: 'Permissions',
    });
  }

  // --- Rule 10: Signature & Integrity Checks ---
  if (signatureInfo) {
    if (signatureInfo.isSelfSigned && signatureInfo.signatureStatus === 'SELF_SIGNED') {
      baseScore += 8;
      suspiciousIndicators.push({
        id: 'ind-self-signed',
        category: 'INSECURE_CONFIGURATION',
        title: 'Signed with self-signed development certificate',
        severity: 'LOW',
        description: 'The APK is signed with a generic developer certificate (e.g. Android Debug Key).',
        impact: 'Does not guarantee developer identity or protection against tampering.',
        recommendation: 'Verify the source where you obtained this APK.',
        scoreWeight: 8,
      });
    }
  }

  // Mitigations for clean benign apps:
  if (sensitivePerms.length === 0 && !hasOverlay && !hasInstallPackages && baseScore === 5) {
    baseScore = 2; // Very clean app
  }

  // Clamp score between 0 and 100
  const finalScore = Math.min(Math.max(baseScore, 0), 100);
  const band = getRiskBand(finalScore);

  const level: RiskLevel =
    band === 'VERY_HIGH_RISK' || band === 'HIGH_RISK'
      ? 'HIGH_PRIORITY'
      : band === 'ELEVATED_RISK' || band === 'MODERATE_RISK'
      ? 'REVIEW_RECOMMENDED'
      : 'LOW';

  // Construct plain-English explanation of why this score was assigned
  let explanation = '';
  switch (band) {
    case 'LOWEST_RISK':
      explanation =
        'Lowest risk assessment with minimal sensitive permissions and standard Android configurations. No high-risk combinations detected.';
      break;
    case 'LOWER_RISK':
      explanation =
        'Lower risk profile with few sensitive capabilities. Standard operational access without elevated threat patterns.';
      break;
    case 'MODERATE_RISK':
      explanation =
        'Moderate risk due to sensitive capabilities (such as camera or location) or legacy target SDKs. Review permissions before granting runtime access.';
      break;
    case 'ELEVATED_RISK':
      explanation =
        'Elevated risk identified from multiple sensitive capabilities, broad exported components, or unusual permission requests for this app category.';
      break;
    case 'HIGH_RISK':
      explanation =
        'High risk identified from suspicious capability combinations, legacy sandboxing bypasses, or unusual background hardware sensor access.';
      break;
    case 'VERY_HIGH_RISK':
      explanation =
        'Very high risk indicated by high-threat permission combinations (e.g. system overlay with package installer or background sensors) that represent significant attack surface.';
      break;
  }

  // Evidence coverage percentage calculation:
  // Manifest: 30%, Components: 25%, Permissions: 25%, Signature: 10%, Online reputation: 10%
  let coverage = 30 + 25 + 25; // Local static review covers manifest, components, permissions (80%)
  if (signatureInfo && signatureInfo.signatureStatus !== 'UNVERIFIED') {
    coverage += 10;
  }
  if (onlineReputation && onlineReputation.status === 'CHECKED') {
    coverage += 10;
  }

  return {
    riskScore: finalScore,
    riskBand: band,
    riskLevel: level,
    riskScoreExplanation: explanation,
    evidenceCoveragePercent: Math.min(coverage, 100),
    findings,
    suspiciousIndicators,
  };
}

export function evaluateAppRisk(
  packageName: string,
  appName: string,
  isSystemApp: boolean,
  targetSdk: number,
  installSource: string | undefined,
  permissions: PermissionDetail[]
): { riskLevel: RiskLevel; findings: RiskFinding[] } {
  const result = calculateComprehensiveRiskScore({
    packageName,
    appName,
    targetSdk,
    minSdk: 24,
    permissions,
  });

  return {
    riskLevel: result.riskLevel,
    findings: result.findings,
  };
}
