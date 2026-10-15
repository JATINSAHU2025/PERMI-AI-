import { AppSecurityProfile } from '../types';
import { getPermissionMetadata } from './androidPermissions';
import { evaluateAppRisk } from '../utils/riskEngine';

interface RawAppDefinition {
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
  permissionNames: { name: string; isGranted: boolean }[];
  foregroundTimeMs: number;
}

const now = Date.now();
const day = 86400000;

const RAW_APPS: RawAppDefinition[] = [
  {
    packageName: 'com.android.chrome',
    appName: 'Chrome Browser',
    versionName: '130.0.6723.86',
    versionCode: 672308633,
    targetSdk: 35,
    minSdk: 26,
    isSystemApp: true,
    installSource: 'com.android.vending',
    firstInstallTime: now - 90 * day,
    lastUpdateTime: now - 3 * day,
    foregroundTimeMs: 14200000, // ~3.9 hours
    permissionNames: [
      { name: 'android.permission.INTERNET', isGranted: true },
      { name: 'android.permission.ACCESS_FINE_LOCATION', isGranted: true },
      { name: 'android.permission.CAMERA', isGranted: true },
      { name: 'android.permission.RECORD_AUDIO', isGranted: false },
      { name: 'android.permission.POST_NOTIFICATIONS', isGranted: true },
    ],
  },
  {
    packageName: 'com.simpleutility.flashlight.torch',
    appName: 'Flashlight Ultra Bright',
    versionName: '2.4.1',
    versionCode: 24,
    targetSdk: 33,
    minSdk: 21,
    isSystemApp: false,
    installSource: 'com.android.vending',
    firstInstallTime: now - 14 * day,
    lastUpdateTime: now - 14 * day,
    foregroundTimeMs: 180000, // 3 mins
    permissionNames: [
      { name: 'android.permission.CAMERA', isGranted: true },
      { name: 'android.permission.RECORD_AUDIO', isGranted: true },
      { name: 'android.permission.ACCESS_FINE_LOCATION', isGranted: true },
      { name: 'android.permission.INTERNET', isGranted: true },
      { name: 'android.permission.ACCESS_NETWORK_STATE', isGranted: true },
    ],
  },
  {
    packageName: 'com.social.chatconnect',
    appName: 'ChatConnect Messenger',
    versionName: '5.18.2',
    versionCode: 5182,
    targetSdk: 34,
    minSdk: 24,
    isSystemApp: false,
    installSource: 'com.android.vending',
    firstInstallTime: now - 45 * day,
    lastUpdateTime: now - 5 * day,
    foregroundTimeMs: 25400000, // ~7 hours
    permissionNames: [
      { name: 'android.permission.INTERNET', isGranted: true },
      { name: 'android.permission.READ_CONTACTS', isGranted: true },
      { name: 'android.permission.WRITE_CONTACTS', isGranted: true },
      { name: 'android.permission.READ_SMS', isGranted: true },
      { name: 'android.permission.RECEIVE_SMS', isGranted: true },
      { name: 'android.permission.CAMERA', isGranted: true },
      { name: 'android.permission.RECORD_AUDIO', isGranted: true },
      { name: 'android.permission.POST_NOTIFICATIONS', isGranted: true },
    ],
  },
  {
    packageName: 'org.securetools.calcpro',
    appName: 'Scientific Calculator',
    versionName: '1.8.0',
    versionCode: 18,
    targetSdk: 34,
    minSdk: 21,
    isSystemApp: false,
    installSource: 'com.android.vending',
    firstInstallTime: now - 60 * day,
    lastUpdateTime: now - 20 * day,
    foregroundTimeMs: 1200000, // 20 mins
    permissionNames: [
      { name: 'android.permission.VIBRATE', isGranted: true },
    ],
  },
  {
    packageName: 'com.fitnesstrack.georunner',
    appName: 'GeoRunner Fitness Tracker',
    versionName: '3.10.4',
    versionCode: 310,
    targetSdk: 34,
    minSdk: 26,
    isSystemApp: false,
    installSource: 'com.android.vending',
    firstInstallTime: now - 30 * day,
    lastUpdateTime: now - 2 * day,
    foregroundTimeMs: 7800000, // ~2.1 hours
    permissionNames: [
      { name: 'android.permission.ACCESS_FINE_LOCATION', isGranted: true },
      { name: 'android.permission.ACCESS_COARSE_LOCATION', isGranted: true },
      { name: 'android.permission.ACCESS_BACKGROUND_LOCATION', isGranted: true },
      { name: 'android.permission.POST_NOTIFICATIONS', isGranted: true },
      { name: 'android.permission.INTERNET', isGranted: true },
    ],
  },
  {
    packageName: 'com.freepatch.adfilterplus',
    appName: 'AdFilter Pro Plus',
    versionName: '1.0.3',
    versionCode: 103,
    targetSdk: 28, // Legacy target SDK!
    minSdk: 21,
    isSystemApp: false,
    installSource: 'Sideloaded/Direct APK',
    firstInstallTime: now - 6 * day,
    lastUpdateTime: now - 6 * day,
    foregroundTimeMs: 340000,
    permissionNames: [
      { name: 'android.permission.SYSTEM_ALERT_WINDOW', isGranted: true },
      { name: 'android.permission.REQUEST_INSTALL_PACKAGES', isGranted: true },
      { name: 'android.permission.INTERNET', isGranted: true },
      { name: 'android.permission.READ_EXTERNAL_STORAGE', isGranted: true },
    ],
  },
  {
    packageName: 'com.google.android.apps.photos',
    appName: 'Google Photos',
    versionName: '6.95.0',
    versionCode: 695000,
    targetSdk: 35,
    minSdk: 26,
    isSystemApp: true,
    installSource: 'com.android.vending',
    firstInstallTime: now - 180 * day,
    lastUpdateTime: now - 8 * day,
    foregroundTimeMs: 4600000,
    permissionNames: [
      { name: 'android.permission.INTERNET', isGranted: true },
      { name: 'android.permission.READ_EXTERNAL_STORAGE', isGranted: true },
      { name: 'android.permission.ACCESS_FINE_LOCATION', isGranted: true },
      { name: 'android.permission.POST_NOTIFICATIONS', isGranted: true },
    ],
  },
  {
    packageName: 'com.quicknotes.privatevault',
    appName: 'Offline Private Notes',
    versionName: '2.0.1',
    versionCode: 201,
    targetSdk: 34,
    minSdk: 26,
    isSystemApp: false,
    installSource: 'com.android.vending',
    firstInstallTime: now - 25 * day,
    lastUpdateTime: now - 12 * day,
    foregroundTimeMs: 3100000,
    permissionNames: [
      { name: 'android.permission.VIBRATE', isGranted: true },
    ],
  },
];

export function buildInitialApps(hasUsageAccess: boolean = true): AppSecurityProfile[] {
  return RAW_APPS.map((raw) => {
    const permissions = raw.permissionNames.map((p) => {
      const meta = getPermissionMetadata(p.name);
      return {
        ...meta,
        isGranted: p.isGranted,
      };
    });

    const sensitiveCount = permissions.filter((p) => p.isGranted && p.isSensitive).length;

    const hours = Math.floor(raw.foregroundTimeMs / 3600000);
    const minutes = Math.floor((raw.foregroundTimeMs % 3600000) / 60000);
    const formattedDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const usageInfo = {
      hasUsageAccess,
      totalForegroundTimeMs: hasUsageAccess ? raw.foregroundTimeMs : 0,
      lastTimeUsedMs: now - 1000 * 60 * 30,
      formattedDuration: hasUsageAccess ? formattedDuration : 'Usage access not granted',
      dataAvailable: hasUsageAccess && raw.foregroundTimeMs > 0,
    };

    const { riskLevel, findings } = evaluateAppRisk(
      raw.packageName,
      raw.appName,
      raw.isSystemApp,
      raw.targetSdk,
      raw.installSource,
      permissions
    );

    return {
      packageName: raw.packageName,
      appName: raw.appName,
      versionName: raw.versionName,
      versionCode: raw.versionCode,
      targetSdk: raw.targetSdk,
      minSdk: raw.minSdk,
      isSystemApp: raw.isSystemApp,
      installSource: raw.installSource,
      firstInstallTime: raw.firstInstallTime,
      lastUpdateTime: raw.lastUpdateTime,
      permissions,
      sensitivePermissionCount: sensitiveCount,
      usageInfo,
      riskLevel,
      findings,
    };
  });
}
