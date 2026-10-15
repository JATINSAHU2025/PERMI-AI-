package com.permiscan.app.ui.screens

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.permiscan.app.ui.theme.*

@Composable
fun SettingsScreen(
    viewModel: PermiScanViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CyberBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = CyberCyan)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "Settings & Privacy Constitution",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberTextPrimary
                    )
                    Text(
                        text = "Security policies, special permissions, and transparency.",
                        fontSize = 11.sp,
                        color = CyberTextSecondary
                    )
                }
            }
        }

        // Privacy Guarantee Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(10.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = CyberGreen, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "ZERO-EXFILTRATION PRIVACY GUARANTEE",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = CyberGreen,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "• 100% On-Device Processing: Scans, manifests, and usage data never leave this device.\n" +
                               "• No Telemetry: Permi Scan contains zero analytics trackers, third-party advertising SDKs, or cloud telemetry.\n" +
                               "• No Cloud Reputation Server: Risk scores are derived strictly from local deterministic rules.\n" +
                               "• No Network Transmission: Permi Scan will not upload your package inventory or installed app list.",
                        fontSize = 11.sp,
                        color = CyberTextSecondary,
                        lineHeight = 18.sp
                    )
                }
            }
        }

        // System Permissions & Special Access
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(10.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "SPECIAL SYSTEM ACCESS",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberCyan,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Usage Access (UsageStatsManager)", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = CyberTextPrimary)
                            Text(
                                if (state.hasUsageAccess) "Permission active: Foreground duration enabled" else "Required for app foreground screen time statistics",
                                fontSize = 10.sp,
                                color = if (state.hasUsageAccess) CyberGreen else CyberAmber
                            )
                        }
                        Button(
                            onClick = {
                                try {
                                    context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    })
                                } catch (e: Exception) {
                                    // fallback
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (state.hasUsageAccess) CyberSurfaceVariant else CyberCyan,
                                contentColor = if (state.hasUsageAccess) CyberTextPrimary else Color.Black
                            ),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(if (state.hasUsageAccess) "Configure" else "Enable", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // Android Platform Boundaries
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(10.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "ANDROID PLATFORM BOUNDARIES",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberAmber,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "1. Background Sensor Invocations: Ordinary third-party apps cannot intercept or observe real-time microphone or camera activations by other processes. Permi Scan does not pretend to monitor background camera/audio streams.\n" +
                               "2. Foreground vs Background: UsageStatsManager provides aggregate foreground time. High foreground time does not prove malicious background execution.\n" +
                               "3. Pre-install Interception: On non-rooted devices, third-party apps cannot replace the Android system package installer dialog. Permi Scan provides dedicated pre-install APK file inspection.",
                        fontSize = 11.sp,
                        color = CyberTextSecondary,
                        lineHeight = 17.sp
                    )
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
