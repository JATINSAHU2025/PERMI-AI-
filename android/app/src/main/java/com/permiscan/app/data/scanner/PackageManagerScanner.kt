package com.permiscan.app.data.scanner

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import com.permiscan.app.data.model.AppSecurityProfile
import com.permiscan.app.data.model.PermissionDetail
import com.permiscan.app.data.model.UsageInfo
import com.permiscan.app.domain.risk.RiskEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PackageManagerScanner(private val context: Context) {

    private val packageManager: PackageManager = context.packageManager

    suspend fun scanAllInstalledApps(
        usageStatsMap: Map<String, UsageInfo> = emptyMap()
    ): List<AppSecurityProfile> = withContext(Dispatchers.IO) {
        val flags = PackageManager.GET_PERMISSIONS or PackageManager.GET_META_DATA
        val installedPackages: List<PackageInfo> = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getInstalledPackages(PackageManager.PackageInfoFlags.of(flags.toLong()))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getInstalledPackages(flags)
            }
        } catch (e: Exception) {
            emptyList()
        }

        installedPackages.mapNotNull { packageInfo ->
            try {
                inspectPackage(packageInfo, usageStatsMap[packageInfo.packageName])
            } catch (e: Exception) {
                null
            }
        }
    }

    fun inspectPackage(
        packageInfo: PackageInfo,
        usageInfo: UsageInfo? = null
    ): AppSecurityProfile {
        val appInfo = packageInfo.applicationInfo
        val appName = try {
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            packageInfo.packageName
        }

        val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
        val targetSdk = appInfo.targetSdkVersion
        val minSdk = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) appInfo.minSdkVersion else 21

        val installerPackageName = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                packageManager.getInstallSourceInfo(packageInfo.packageName).installingPackageName
            } else {
                @Suppress("DEPRECATION")
                packageManager.getInstallerPackageName(packageInfo.packageName)
            }
        } catch (e: Exception) {
            null
        }

        val permissions = extractPermissions(packageInfo)
        val sensitiveCount = permissions.count { it.isGranted && it.isSensitive }

        val finalUsage = usageInfo ?: UsageInfo(
            hasUsageAccess = false,
            totalForegroundTimeMs = 0L,
            lastTimeUsedMs = 0L,
            formattedDuration = "Usage access not granted or unavailable",
            dataAvailable = false
        )

        val (riskLevel, findings) = RiskEngine.evaluateApp(
            packageName = packageInfo.packageName,
            appName = appName,
            isSystemApp = isSystem,
            targetSdk = targetSdk,
            installSource = installerPackageName,
            permissions = permissions
        )

        val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            packageInfo.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            packageInfo.versionCode.toLong()
        }

        return AppSecurityProfile(
            packageName = packageInfo.packageName,
            appName = appName,
            versionName = packageInfo.versionName ?: "1.0",
            versionCode = versionCode,
            targetSdk = targetSdk,
            minSdk = minSdk,
            isSystemApp = isSystem,
            installSource = installerPackageName ?: "Sideloaded/Unknown",
            firstInstallTime = packageInfo.firstInstallTime,
            lastUpdateTime = packageInfo.lastUpdateTime,
            permissions = permissions,
            sensitivePermissionCount = sensitiveCount,
            usageInfo = finalUsage,
            riskLevel = riskLevel,
            findings = findings
        )
    }

    private fun extractPermissions(packageInfo: PackageInfo): List<PermissionDetail> {
        val requested = packageInfo.requestedPermissions ?: return emptyList()
        val flags = packageInfo.requestedPermissionsFlags ?: IntArray(requested.size)

        return requested.indices.map { i ->
            val permName = requested[i]
            val isGranted = (flags[i] and PackageInfo.REQUESTED_PERMISSION_GRANTED) != 0
            val isSensitive = RiskEngine.isSensitive(permName)
            val simpleName = permName.substringAfterLast(".")
            val category = categorizePermission(permName)

            PermissionDetail(
                name = permName,
                simpleName = simpleName,
                isGranted = isGranted,
                isSensitive = isSensitive,
                category = category,
                description = describePermission(permName),
                whyDangerous = explainDanger(permName)
            )
        }
    }

    private fun categorizePermission(name: String): String = when {
        name.contains("LOCATION") -> "LOCATION"
        name.contains("CAMERA") -> "CAMERA"
        name.contains("AUDIO") || name.contains("RECORD") -> "MICROPHONE"
        name.contains("CONTACTS") -> "CONTACTS"
        name.contains("SMS") -> "SMS"
        name.contains("PHONE") || name.contains("CALL") -> "PHONE"
        name.contains("STORAGE") -> "STORAGE"
        else -> "SYSTEM"
    }

    private fun describePermission(name: String): String = when (name) {
        "android.permission.ACCESS_FINE_LOCATION" -> "Access precise GPS and network location."
        "android.permission.ACCESS_COARSE_LOCATION" -> "Access approximate network-derived location."
        "android.permission.ACCESS_BACKGROUND_LOCATION" -> "Access location in the background without UI visible."
        "android.permission.CAMERA" -> "Direct access to optical camera sensor for photos and video."
        "android.permission.RECORD_AUDIO" -> "Record microphone audio streams without prompt."
        "android.permission.READ_CONTACTS" -> "Read user contact records and address book entries."
        "android.permission.READ_SMS" -> "Read stored and received SMS text messages."
        "android.permission.SEND_SMS" -> "Dispatch SMS messages potentially incurring billing."
        "android.permission.SYSTEM_ALERT_WINDOW" -> "Draw interactive surfaces over other running apps."
        "android.permission.REQUEST_INSTALL_PACKAGES" -> "Request installation of downloaded APK packages."
        else -> "Standard Android platform capability."
    }

    private fun explainDanger(name: String): String = when (name) {
        "android.permission.ACCESS_FINE_LOCATION" -> "Exposes physical whereabouts, residence, and daily transit patterns."
        "android.permission.ACCESS_BACKGROUND_LOCATION" -> "Enables persistent round-the-clock behavioral tracing without user awareness."
        "android.permission.CAMERA" -> "Can capture optical environment and private physical spaces."
        "android.permission.RECORD_AUDIO" -> "Can capture ambient conversations, private meetings, and voice data."
        "android.permission.READ_CONTACTS" -> "Exposes personal graph, phone numbers, and identity of associates."
        "android.permission.READ_SMS" -> "High risk for reading sensitive one-time password (OTP) verification codes."
        "android.permission.SYSTEM_ALERT_WINDOW" -> "Can construct clickjacking/tapjacking deceptive overlays over legitimate login dialogues."
        else -> "General capability requiring periodic review."
    }
}
