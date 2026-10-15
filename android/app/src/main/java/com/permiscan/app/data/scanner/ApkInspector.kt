package com.permiscan.app.data.scanner

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import com.permiscan.app.data.model.AppSecurityProfile
import com.permiscan.app.data.model.PermissionDetail
import com.permiscan.app.data.model.UsageInfo
import com.permiscan.app.domain.risk.RiskEngine
import java.io.File

class ApkInspector(private val context: Context) {

    private val packageManager: PackageManager = context.packageManager

    fun inspectApkFile(apkFile: File): Result<AppSecurityProfile> {
        return try {
            if (!apkFile.exists() || !apkFile.canRead()) {
                return Result.failure(IllegalArgumentException("File does not exist or cannot be read: ${apkFile.absolutePath}"))
            }

            val flags = PackageManager.GET_PERMISSIONS or PackageManager.GET_META_DATA
            val packageInfo: PackageInfo? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageArchiveInfo(apkFile.absolutePath, PackageManager.PackageInfoFlags.of(flags.toLong()))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getPackageArchiveInfo(apkFile.absolutePath, flags)
            }

            if (packageInfo == null) {
                return Result.failure(IllegalStateException("Could not parse APK archive. The file may be corrupt or invalid."))
            }

            // Assign archive file paths for label extraction
            packageInfo.applicationInfo?.sourceDir = apkFile.absolutePath
            packageInfo.applicationInfo?.publicSourceDir = apkFile.absolutePath

            val appName = try {
                packageInfo.applicationInfo?.let { packageManager.getApplicationLabel(it).toString() } ?: packageInfo.packageName
            } catch (e: Exception) {
                packageInfo.packageName
            }

            val appInfo = packageInfo.applicationInfo
            val targetSdk = appInfo?.targetSdkVersion ?: 0
            val minSdk = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                appInfo?.minSdkVersion ?: 21
            } else 21

            val requestedPermissions = packageInfo.requestedPermissions ?: emptyArray()
            val permissions = requestedPermissions.map { permName ->
                val isSensitive = RiskEngine.isSensitive(permName)
                val simpleName = permName.substringAfterLast(".")
                PermissionDetail(
                    name = permName,
                    simpleName = simpleName,
                    isGranted = false, // Not installed yet; grant state can only be verified post-install
                    isSensitive = isSensitive,
                    category = categorizePermission(permName),
                    description = "Declared in APK manifest.",
                    whyDangerous = "Pre-installation assessment capability."
                )
            }

            val (riskLevel, findings) = RiskEngine.evaluateApp(
                packageName = packageInfo.packageName,
                appName = appName,
                isSystemApp = false,
                targetSdk = targetSdk,
                installSource = "Pre-installation APK Inspection",
                permissions = permissions
            )

            val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode.toLong()
            }

            val profile = AppSecurityProfile(
                packageName = packageInfo.packageName,
                appName = appName,
                versionName = packageInfo.versionName ?: "1.0",
                versionCode = versionCode,
                targetSdk = targetSdk,
                minSdk = minSdk,
                isSystemApp = false,
                installSource = "Pre-install APK file: ${apkFile.name}",
                firstInstallTime = 0L,
                lastUpdateTime = apkFile.lastModified(),
                permissions = permissions,
                sensitivePermissionCount = permissions.count { it.isSensitive },
                usageInfo = UsageInfo(
                    hasUsageAccess = false,
                    totalForegroundTimeMs = 0L,
                    lastTimeUsedMs = 0L,
                    formattedDuration = "N/A (Uninstalled file)",
                    dataAvailable = false
                ),
                riskLevel = riskLevel,
                findings = findings
            )

            Result.success(profile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun categorizePermission(name: String): String = when {
        name.contains("LOCATION") -> "LOCATION"
        name.contains("CAMERA") -> "CAMERA"
        name.contains("AUDIO") || name.contains("RECORD") -> "MICROPHONE"
        name.contains("CONTACTS") -> "CONTACTS"
        name.contains("SMS") -> "SMS"
        name.contains("PHONE") -> "PHONE"
        name.contains("STORAGE") -> "STORAGE"
        else -> "SYSTEM"
    }
}
