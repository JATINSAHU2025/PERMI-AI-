package com.permiscan.app.data.model

enum class RiskLevel {
    LOW,
    REVIEW_RECOMMENDED,
    HIGH_PRIORITY
}

data class PermissionDetail(
    val name: String,
    val simpleName: String,
    val isGranted: Boolean,
    val isSensitive: Boolean,
    val category: String, // CAMERA, MICROPHONE, LOCATION, CONTACTS, STORAGE, SMS, PHONE, SYSTEM
    val description: String,
    val whyDangerous: String
)

data class UsageInfo(
    val hasUsageAccess: Boolean,
    val totalForegroundTimeMs: Long,
    val lastTimeUsedMs: Long,
    val formattedDuration: String,
    val dataAvailable: Boolean
)

data class RiskFinding(
    val id: String,
    val packageName: String,
    val appName: String,
    val riskLevel: RiskLevel,
    val title: String,
    val evidence: List<String>,
    val whyItDeservesAttention: String,
    val whatCannotBeVerified: String,
    val practicalNextAction: String,
    val detectedAt: Long = System.currentTimeMillis()
)

data class AppSecurityProfile(
    val packageName: String,
    val appName: String,
    val versionName: String,
    val versionCode: Long,
    val targetSdk: Int,
    val minSdk: Int,
    val isSystemApp: Boolean,
    val installSource: String?, // e.g. "com.android.vending" or "Sideloaded/Unknown"
    val firstInstallTime: Long,
    val lastUpdateTime: Long,
    val permissions: List<PermissionDetail>,
    val sensitivePermissionCount: Int,
    val usageInfo: UsageInfo,
    val riskLevel: RiskLevel,
    val findings: List<RiskFinding>
)

data class ScanSession(
    val id: String,
    val timestamp: Long,
    val durationMs: Long,
    val totalAppsScanned: Int,
    val highRiskCount: Int,
    val reviewRecommendedCount: Int,
    val lowRiskCount: Int,
    val totalSensitivePermissionsGranted: Int
)

data class ObservationEvent(
    val id: Long = 0,
    val packageName: String,
    val appName: String,
    val timestamp: Long,
    val eventType: String, // "INITIAL_SCAN", "PERMISSION_GRANTED", "PERMISSION_REVOKED", "APP_UPDATED", "NEW_INSTALL"
    val detail: String,
    val permissionName: String? = null
)
