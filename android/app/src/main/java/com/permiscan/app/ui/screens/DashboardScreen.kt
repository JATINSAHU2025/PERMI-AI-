package com.permiscan.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.permiscan.app.data.model.RiskFinding
import com.permiscan.app.data.model.RiskLevel
import com.permiscan.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: PermiScanViewModel,
    onNavigateToApp: (String) -> Unit,
    onNavigateToFindings: () -> Unit,
    onNavigateToHistory: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val session = state.lastScanSession
    val flaggedApps = state.apps.filter { it.riskLevel != RiskLevel.LOW }
    val recentApps = state.apps.sortedByDescending { it.lastUpdateTime }.take(3)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBg)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "PermiScan",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Android Security & Privacy Audit",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(onClick = onNavigateToHistory) {
                        Icon(Icons.Default.History, contentDescription = "History", tint = TextSecondary)
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = TextSecondary)
                    }
                }
            }
        }

        // Live Scan Button & Duration Banner
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                shape = RoundedCornerShape(16.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(AppBorder))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Button(
                        onClick = { viewModel.scanDevice() },
                        enabled = !state.isScanning,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PrimaryBlue,
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        if (state.isScanning) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Scanning Device...", fontWeight = FontWeight.SemiBold)
                        } else {
                            Icon(Icons.Default.Shield, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Scan Device", fontWeight = FontWeight.SemiBold)
                        }
                    }

                    if (state.isScanning) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(state.scanStatusMessage, fontSize = 11.sp, color = TextSecondary)
                                Text("${(state.scanProgress * 100).toInt()}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = { state.scanProgress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp),
                                color = PrimaryBlue,
                                trackColor = AppSurfaceVariant
                            )
                        }
                    }

                    if (state.scanErrorMessage != null) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFFEF2F2), RoundedCornerShape(8.dp))
                                .padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = StatusRed, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(state.scanErrorMessage ?: "", fontSize = 11.sp, color = StatusRed, modifier = Modifier.weight(1f))
                            TextButton(onClick = { viewModel.scanDevice() }) {
                                Text("Retry", fontSize = 11.sp, color = StatusRed, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = if (session != null) {
                                "Last scan: ${SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(session.timestamp))}"
                            } else "No scan recorded yet",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                        Text(
                            text = if (session != null) "Scan time: ${session.durationMs} ms" else "Duration: --",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = StatusGreen
                        )
                    }
                }
            }
        }

        // Metric Counters Grid
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    title = "Audited Apps",
                    value = (session?.totalAppsScanned ?: state.apps.size).toString(),
                    subtitle = "PackageManager visible",
                    color = PrimaryBlue,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Flagged for Review",
                    value = flaggedApps.size.toString(),
                    subtitle = "${flaggedApps.count { it.riskLevel == RiskLevel.HIGH_PRIORITY }} high priority",
                    color = if (flaggedApps.isNotEmpty()) StatusAmber else StatusGreen,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    title = "Sensitive Grants",
                    value = (session?.totalSensitivePermissionsGranted ?: 0).toString(),
                    subtitle = "Camera, Mic, GPS, Contacts",
                    color = StatusRed,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Usage Access",
                    value = if (state.hasUsageAccess) "Active" else "Disabled",
                    subtitle = if (state.hasUsageAccess) "UsageStats authorized" else "Requires user grant",
                    color = if (state.hasUsageAccess) StatusGreen else StatusAmber,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Recent Security Findings Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent Security Findings",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = "View All (${state.findings.size})",
                    fontSize = 12.sp,
                    color = PrimaryBlue,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.clickable { onNavigateToFindings() }
                )
            }
        }

        if (state.findings.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = AppSurface),
                    shape = RoundedCornerShape(12.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(AppBorder)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(modifier = Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "No security findings. All installed apps are within normal permission boundaries.",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        } else {
            items(state.findings.take(3)) { finding ->
                FindingItemCard(finding = finding, onClick = { onNavigateToApp(finding.packageName) })
            }
        }

        // Most Recently Updated Apps
        item {
            Text(
                text = "Recently Updated Apps",
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
        }

        items(recentApps) { app ->
            Card(
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                shape = RoundedCornerShape(12.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(AppBorder)),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToApp(app.packageName) }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = app.appName,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary,
                            fontSize = 14.sp
                        )
                        Text(
                            text = app.packageName,
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                        Text(
                            text = "Updated: ${SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(app.lastUpdateTime))}",
                            fontSize = 10.sp,
                            color = TextMuted
                        )
                    }
                    Badge(
                        containerColor = when (app.riskLevel) {
                            RiskLevel.HIGH_PRIORITY -> Color(0xFFFEE2E2)
                            RiskLevel.REVIEW_RECOMMENDED -> Color(0xFFFEF3C7)
                            RiskLevel.LOW -> Color(0xFFDCFCE7)
                        }
                    ) {
                        Text(
                            text = app.riskLevel.name.replace("_", " "),
                            fontSize = 10.sp,
                            color = when (app.riskLevel) {
                                RiskLevel.HIGH_PRIORITY -> StatusRed
                                RiskLevel.REVIEW_RECOMMENDED -> StatusAmber
                                RiskLevel.LOW -> StatusGreen
                            },
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = AppSurface),
        shape = RoundedCornerShape(12.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(AppBorder)),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(text = title, fontSize = 12.sp, color = TextSecondary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = subtitle, fontSize = 10.sp, color = TextMuted)
        }
    }
}

@Composable
fun FindingItemCard(finding: RiskFinding, onClick: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = AppSurface),
        shape = RoundedCornerShape(12.dp),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(
                when (finding.riskLevel) {
                    RiskLevel.HIGH_PRIORITY -> Color(0xFFFECACA)
                    RiskLevel.REVIEW_RECOMMENDED -> Color(0xFFFDE68A)
                    RiskLevel.LOW -> AppBorder
                }
            )
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = finding.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = finding.riskLevel.name.replace("_", " "),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = when (finding.riskLevel) {
                        RiskLevel.HIGH_PRIORITY -> StatusRed
                        RiskLevel.REVIEW_RECOMMENDED -> StatusAmber
                        RiskLevel.LOW -> StatusGreen
                    }
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${finding.appName} (${finding.packageName})",
                fontSize = 11.sp,
                color = PrimaryBlue,
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = finding.whyItDeservesAttention,
                fontSize = 12.sp,
                color = TextSecondary,
                lineHeight = 16.sp
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Action: ${finding.practicalNextAction}",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = StatusGreen
            )
        }
    }
}
