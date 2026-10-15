package com.permiscan.app

import com.permiscan.app.data.model.PermissionDetail
import com.permiscan.app.data.model.RiskLevel
import com.permiscan.app.domain.risk.RiskEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RiskEngineTest {

    @Test
    fun flashlight_with_microphone_and_camera_flags_high_priority() {
        val permissions = listOf(
            PermissionDetail(
                name = "android.permission.RECORD_AUDIO",
                simpleName = "RECORD_AUDIO",
                isGranted = true,
                isSensitive = true,
                category = "MICROPHONE",
                description = "Record audio",
                whyDangerous = "Eavesdropping risk"
            ),
            PermissionDetail(
                name = "android.permission.INTERNET",
                simpleName = "INTERNET",
                isGranted = true,
                isSensitive = false,
                category = "SYSTEM",
                description = "Internet access",
                whyDangerous = ""
            )
        )

        val (riskLevel, findings) = RiskEngine.evaluateApp(
            packageName = "com.sample.flashlight",
            appName = "Flashlight Torch Pro",
            isSystemApp = false,
            targetSdk = 34,
            installSource = "com.android.vending",
            permissions = permissions
        )

        assertEquals(RiskLevel.HIGH_PRIORITY, riskLevel)
        assertTrue(findings.any { it.title.contains("Disproportionate Sensor Access") })
    }

    @Test
    fun background_location_flags_high_priority() {
        val permissions = listOf(
            PermissionDetail(
                name = "android.permission.ACCESS_FINE_LOCATION",
                simpleName = "ACCESS_FINE_LOCATION",
                isGranted = true,
                isSensitive = true,
                category = "LOCATION",
                description = "Fine location",
                whyDangerous = "Tracking"
            ),
            PermissionDetail(
                name = "android.permission.ACCESS_BACKGROUND_LOCATION",
                simpleName = "ACCESS_BACKGROUND_LOCATION",
                isGranted = true,
                isSensitive = true,
                category = "LOCATION",
                description = "Background location",
                whyDangerous = "Persistent tracking"
            )
        )

        val (riskLevel, findings) = RiskEngine.evaluateApp(
            packageName = "com.sample.tracker",
            appName = "Location Helper",
            isSystemApp = false,
            targetSdk = 34,
            installSource = "com.android.vending",
            permissions = permissions
        )

        assertEquals(RiskLevel.HIGH_PRIORITY, riskLevel)
        assertTrue(findings.any { it.title.contains("Background Location") })
    }

    @Test
    fun benign_calculator_flags_low_risk() {
        val permissions = listOf(
            PermissionDetail(
                name = "android.permission.VIBRATE",
                simpleName = "VIBRATE",
                isGranted = true,
                isSensitive = false,
                category = "SYSTEM",
                description = "Vibrate on keypress",
                whyDangerous = ""
            )
        )

        val (riskLevel, findings) = RiskEngine.evaluateApp(
            packageName = "com.sample.calculator",
            appName = "Calculator",
            isSystemApp = false,
            targetSdk = 34,
            installSource = "com.android.vending",
            permissions = permissions
        )

        assertEquals(RiskLevel.LOW, riskLevel)
    }
}
