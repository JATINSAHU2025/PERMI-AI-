package com.permiscan.app.domain.risk

import com.permiscan.app.data.model.AppSecurityProfile
import com.permiscan.app.data.model.PermissionDetail
import com.permiscan.app.data.model.RiskFinding
import com.permiscan.app.data.model.RiskLevel
import java.util.UUID

object RiskEngine {

    private val SENSITIVE_PERMISSIONS = setOf(
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_CONTACTS",
        "android.permission.WRITE_CONTACTS",
        "android.permission.READ_SMS",
        "android.permission.RECEIVE_SMS",
        "android.permission.SEND_SMS",
        "android.permission.READ_CALL_LOG",
        "android.permission.WRITE_CALL_LOG",
        "android.permission.READ_PHONE_STATE",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.MANAGE_EXTERNAL_STORAGE",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.REQUEST_INSTALL_PACKAGES"
    )

    fun isSensitive(permissionName: String): Boolean {
        return SENSITIVE_PERMISSIONS.contains(permissionName)
    }

    fun evaluateApp(
        packageName: String,
        appName: String,
        isSystemApp: Boolean,
        targetSdk: Int,
        installSource: String?,
        permissions: List<PermissionDetail>,
        observedChangesCount: Int = 0
    ): Pair<RiskLevel, List<RiskFinding>> {
        val findings = mutableListOf<RiskFinding>()
        val grantedPermissions = permissions.filter { it.isGranted }.map { it.name }.toSet()
        val requestedPermissions = permissions.map { it.name }.toSet()

        // Rule 1: High Priority - Background Location combined with sensitive telemetry
        if (grantedPermissions.contains("android.permission.ACCESS_BACKGROUND_LOCATION") &&
            (grantedPermissions.contains("android.permission.ACCESS_FINE_LOCATION") || grantedPermissions.contains("android.permission.ACCESS_COARSE_LOCATION"))
        ) {
            findings.add(
                RiskFinding(
                    id = UUID.randomUUID().toString(),
                    packageName = packageName,
                    appName = appName,
                    riskLevel = RiskLevel.HIGH_PRIORITY,
                    title = "Persistent Background Location Granted",
                    evidence = listOf(
                        "ACCESS_BACKGROUND_LOCATION is actively granted",
                        "App can track physical coordinates without foreground UI presence"
                    ),
                    whyItDeservesAttention = "Continuous background location enables perpetual behavioral profiling and precise physical movement tracking.",
                    whatCannotBeVerified = "Local permission inspection cannot verify whether location data is buffered locally, transmitted off-device, or shared with third-party SDK ad brokers.",
                    practicalNextAction = "Open Android Settings > App Permissions > Location and change setting to 'Allow only while using the app'."
                )
            )
        }

        // Rule 2: High Priority - Audio Recording + Network + Background Capability
        val hasMic = grantedPermissions.contains("android.permission.RECORD_AUDIO")
        val hasNet = requestedPermissions.contains("android.permission.INTERNET")
        val hasCamera = grantedPermissions.contains("android.permission.CAMERA")
        val isUtilityOrSimple = appName.contains("Flashlight", ignoreCase = true) ||
                appName.contains("Calculator", ignoreCase = true) ||
                appName.contains("Compass", ignoreCase = true) ||
                appName.contains("Torch", ignoreCase = true)

        if ((hasMic || hasCamera) && isUtilityOrSimple) {
            findings.add(
                RiskFinding(
                    id = UUID.randomUUID().toString(),
                    packageName = packageName,
                    appName = appName,
                    riskLevel = RiskLevel.HIGH_PRIORITY,
                    title = "Disproportionate Sensor Access for Utility App",
                    evidence = listOf(
                        "App name implies single utility ($appName)",
                        if (hasMic) "Microphone (RECORD_AUDIO) is granted" else "",
                        if (hasCamera) "Camera is granted" else "",
                        "Internet capability declared"
                    ).filter { it.isNotBlank() },
                    whyItDeservesAttention = "Simple utility tools have no legitimate operational requirement for ambient acoustic or optical capture.",
                    whatCannotBeVerified = "Whether hardware sensor activation is triggered by an embedded advertising SDK or intentional app feature.",
                    practicalNextAction = "Revoke Camera and Audio access in system settings or uninstall if alternative open-source utility is available."
                )
            )
        }

        // Rule 3: Review Recommended - Contacts & SMS Access (Communication privacy)
        val hasContacts = grantedPermissions.contains("android.permission.READ_CONTACTS")
        val hasSms = grantedPermissions.contains("android.permission.READ_SMS") || grantedPermissions.contains("android.permission.RECEIVE_SMS")
        if (hasContacts && hasSms) {
            findings.add(
                RiskFinding(
                    id = UUID.randomUUID().toString(),
                    packageName = packageName,
                    appName = appName,
                    riskLevel = RiskLevel.REVIEW_RECOMMENDED,
                    title = "Combined Address Book & SMS Messaging Access",
                    evidence = listOf(
                        "READ_CONTACTS is granted",
                        "SMS reading/receiving capability granted",
                        "Can access two-factor verification OTP codes and social address graph"
                    ),
                    whyItDeservesAttention = "Simultaneous access to messaging and contacts exposes SMS-based 2FA tokens and full personal contact networks.",
                    whatCannotBeVerified = "Actual runtime inspection cannot inspect the memory stream to confirm whether incoming SMS messages are read by SMS sync services.",
                    practicalNextAction = "Review whether this app is your designated default SMS/phone client. If not, revoke SMS permissions."
                )
            )
        }

        // Rule 4: Sideloaded / Unknown Package Source with High-Risk Permissions
        val isSideloaded = installSource == null || installSource.contains("packageinstaller", ignoreCase = true) || installSource == "Sideloaded/Unknown"
        val sensitiveCount = permissions.count { it.isGranted && it.isSensitive }
        if (!isSystemApp && isSideloaded && sensitiveCount >= 3) {
            findings.add(
                RiskFinding(
                    id = UUID.randomUUID().toString(),
                    packageName = packageName,
                    appName = appName,
                    riskLevel = RiskLevel.REVIEW_RECOMMENDED,
                    title = "Non-Store Sideloaded App with Multiple Sensitive Grants",
                    evidence = listOf(
                        "Installed outside certified app store (installer: ${installSource ?: "Manual/Unknown"})",
                        "$sensitiveCount sensitive permissions currently active"
                    ),
                    whyItDeservesAttention = "Sideloaded packages bypass centralized app store malware vetting, automated vulnerability checks, and policy enforcement.",
                    whatCannotBeVerified = "Authenticity of the developer signature cannot be verified against official publisher keys without an external authority.",
                    practicalNextAction = "Verify the original download origin and consider running an offline hash verification against known publisher checksums."
                )
            )
        }

        // Rule 5: Outdated Target SDK (Bypassing Modern Permission Restrictions)
        if (targetSdk < 29 && !isSystemApp) {
            findings.add(
                RiskFinding(
                    id = UUID.randomUUID().toString(),
                    packageName = packageName,
                    appName = appName,
                    riskLevel = RiskLevel.REVIEW_RECOMMENDED,
                    title = "Legacy Target SDK ($targetSdk)",
                    evidence = listOf(
                        "Target SDK is $targetSdk (Android 10 is API 29, Android 14 is API 34)",
                        "May circumvent modern runtime scoped storage or granular background location restrictions"
                    ),
                    whyItDeservesAttention = "Targeting older Android versions can be used by developers to avoid modern privacy safeguards and fine-grained runtime gates.",
                    whatCannotBeVerified = "Whether outdated SDK targeting is technical debt or deliberate privacy circumvention.",
                    practicalNextAction = "Check if an updated version is available that targets current Android API versions."
                )
            )
        }

        // Rule 6: Overlay / Install Packages Capability
        val hasOverlay = grantedPermissions.contains("android.permission.SYSTEM_ALERT_WINDOW")
        val canInstall = requestedPermissions.contains("android.permission.REQUEST_INSTALL_PACKAGES")
        if (hasOverlay && canInstall && !isSystemApp) {
            findings.add(
                RiskFinding(
                    id = UUID.randomUUID().toString(),
                    packageName = packageName,
                    appName = appName,
                    riskLevel = RiskLevel.HIGH_PRIORITY,
                    title = "Screen Overlay & Arbitrary Package Installation Capability",
                    evidence = listOf(
                        "SYSTEM_ALERT_WINDOW (Draw over other apps) granted",
                        "REQUEST_INSTALL_PACKAGES capability declared"
                    ),
                    whyItDeservesAttention = "The combination of drawing overlays and requesting APK installations is a classic vector for tapjacking and deceptive payload delivery.",
                    whatCannotBeVerified = "Whether overlay surfaces active during user authentication dialogues.",
                    practicalNextAction = "Revoke 'Display over other apps' in Android Special App Access settings."
                )
            )
        }

        // Rule 7: Low Risk Baseline if sensitive permissions exist but are standard
        if (findings.isEmpty() && sensitiveCount > 0) {
            findings.add(
                RiskFinding(
                    id = UUID.randomUUID().toString(),
                    packageName = packageName,
                    appName = appName,
                    riskLevel = RiskLevel.LOW,
                    title = "Standard Sensitive Permission Footprint",
                    evidence = listOf(
                        "$sensitiveCount sensitive permission(s) granted",
                        "No anomalous or suspicious multi-permission combinations detected"
                    ),
                    whyItDeservesAttention = "Even conventional sensitive permissions should be audited periodically to ensure they remain relevant to your daily workflow.",
                    whatCannotBeVerified = "Data handling policies on remote developer servers.",
                    practicalNextAction = "No urgent action required. Review permissions during regular maintenance cycles."
                )
            )
        }

        // Determine aggregate risk level
        val overallLevel = when {
            findings.any { it.riskLevel == RiskLevel.HIGH_PRIORITY } -> RiskLevel.HIGH_PRIORITY
            findings.any { it.riskLevel == RiskLevel.REVIEW_RECOMMENDED } -> RiskLevel.REVIEW_RECOMMENDED
            else -> RiskLevel.LOW
        }

        return Pair(overallLevel, findings)
    }
}
