package com.permiscan.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.permiscan.app.data.model.PermissionDetail
import com.permiscan.app.data.model.RiskLevel
import com.permiscan.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AppDetailScreen(
    packageName: String,
    viewModel: PermiScanViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val app = state.apps.find { it.packageName == packageName }

    if (app == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(CyberBg),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("App profile not found in scan cache.", color = CyberTextSecondary)
                Spacer(modifier = Modifier.height(8.dp))
                Button(onClick = onBack) { Text("Back to App List") }
            }
        }
        return
    }

    val appObservations = state.observations.filter { it.packageName == packageName }

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
                        text = app.appName,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberTextPrimary
                    )
                    Text(
                        text = app.packageName,
                        fontSize = 11.sp,
                        color = CyberTextSecondary
                    )
                }
            }
        }

        // Package Identity Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(10.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "PACKAGE METADATA & INTEGRITY",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberCyan,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    MetadataRow("Version", "${app.versionName} (${app.versionCode})")
                    MetadataRow("Target SDK", "${app.targetSdk} (Min SDK: ${app.minSdk})")
                    MetadataRow("Installer Source", app.installSource ?: "Sideloaded / Direct APK")
                    MetadataRow("System Application", if (app.isSystemApp) "Yes (Pre-installed)" else "No (User Installed)")
                    MetadataRow("First Installed", SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date(app.firstInstallTime)))
                    MetadataRow("Last Updated", SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date(app.lastUpdateTime)))
                }
            }
        }

        // Usage Access Box
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(10.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "FOREGROUND USAGE STATISTICS",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = CyberGreen,
                            fontFamily = FontFamily.Monospace
                        )
                        Badge(containerColor = if (app.usageInfo.hasUsageAccess) CyberGreen else CyberAmber) {
                            Text(
                                if (app.usageInfo.hasUsageAccess) "UsageAccess Enabled" else "Access Required",
                                fontSize = 9.sp,
                                color = Color.Black
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    if (app.usageInfo.hasUsageAccess && app.usageInfo.dataAvailable) {
                        Text(
                            text = "Total Foreground Time: ${app.usageInfo.formattedDuration}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = CyberTextPrimary
                        )
                        if (app.usageInfo.lastTimeUsedMs > 0) {
                            Text(
                                text = "Last active: ${SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date(app.usageInfo.lastTimeUsedMs))}",
                                fontSize = 11.sp,
                                color = CyberTextSecondary
                            )
                        }
                    } else {
                        Text(
                            text = "Usage statistics require special 'Usage Access' permission in Android Settings > Apps > Special App Access > Usage Access.",
                            fontSize = 11.sp,
                            color = CyberTextSecondary
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Notice: Android UsageStatsManager tracks foreground screen duration only. It does NOT prove or measure background microphone, camera, or sensor invocations.",
                        fontSize = 10.sp,
                        color = CyberAmber
                    )
                }
            }
        }

        // Risk Findings for this app
        if (app.findings.isNotEmpty()) {
            item {
                Text(
                    text = "Risk Findings (${app.findings.size})",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = CyberTextPrimary
                )
            }
            items(app.findings) { finding ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = CyberSurface),
                    shape = RoundedCornerShape(8.dp),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(
                            when (finding.riskLevel) {
                                RiskLevel.HIGH_PRIORITY -> CyberRed
                                RiskLevel.REVIEW_RECOMMENDED -> CyberAmber
                                RiskLevel.LOW -> CyberGreen
                            }
                        )
                    )
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = finding.title,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = CyberTextPrimary
                            )
                            Badge(
                                containerColor = when (finding.riskLevel) {
                                    RiskLevel.HIGH_PRIORITY -> CyberRed
                                    RiskLevel.REVIEW_RECOMMENDED -> CyberAmber
                                    RiskLevel.LOW -> CyberGreen
                                }
                            ) {
                                Text(finding.riskLevel.name.replace("_", " "), fontSize = 9.sp, color = Color.Black)
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Evidence:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = CyberCyan
                        )
                        for (ev in finding.evidence) {
                            Text(text = "• $ev", fontSize = 11.sp, color = CyberTextSecondary)
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Why it deserves attention:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = CyberAmber
                        )
                        Text(text = finding.whyItDeservesAttention, fontSize = 11.sp, color = CyberTextSecondary)

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "What cannot be verified:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = CyberTextSecondary
                        )
                        Text(text = finding.whatCannotBeVerified, fontSize = 10.sp, color = CyberTextSecondary)

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Action: ${finding.practicalNextAction}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = CyberGreen
                        )
                    }
                }
            }
        }

        // Permissions List (Requested vs Granted)
        item {
            Text(
                text = "Permissions (${app.permissions.size} total, ${app.sensitivePermissionCount} sensitive)",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = CyberTextPrimary
            )
        }

        items(app.permissions.sortedByDescending { it.isSensitive }) { perm ->
            PermissionItemCard(perm = perm)
        }

        // Observation History Timeline
        item {
            Text(
                text = "Observation History & Timeline",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = CyberTextPrimary
            )
        }

        if (appObservations.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CyberSurface),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Data collection began with your first scan. Future permission revocations, grants, or updates will appear on this timeline.",
                            fontSize = 11.sp,
                            color = CyberTextSecondary
                        )
                    }
                }
            }
        } else {
            items(appObservations) { obs ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = CyberSurface),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = obs.eventType,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = CyberCyan
                            )
                            Text(
                                text = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date(obs.timestamp)),
                                fontSize = 10.sp,
                                color = CyberTextSecondary
                            )
                        }
                        Text(text = obs.detail, fontSize = 11.sp, color = CyberTextPrimary)
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun MetadataRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 11.sp, color = CyberTextSecondary)
        Text(text = value, fontSize = 11.sp, color = CyberTextPrimary, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun PermissionItemCard(perm: PermissionDetail) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CyberSurface),
        shape = RoundedCornerShape(8.dp),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(
                if (perm.isSensitive) CyberAmber else CyberBorder
            )
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = perm.simpleName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = if (perm.isSensitive) CyberAmber else CyberTextPrimary
                    )
                    Text(
                        text = perm.name,
                        fontSize = 10.sp,
                        color = CyberTextSecondary
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (perm.isGranted) {
                        Icon(Icons.Default.CheckCircle, contentDescription = "Granted", tint = CyberGreen, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("GRANTED", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = CyberGreen)
                    } else {
                        Icon(Icons.Default.Close, contentDescription = "Denied", tint = CyberTextSecondary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("DENIED", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = CyberTextSecondary)
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(text = perm.description, fontSize = 11.sp, color = CyberTextSecondary)
            if (perm.isSensitive) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Security impact: ${perm.whyDangerous}",
                    fontSize = 10.sp,
                    color = CyberAmber
                )
            }
        }
    }
}
