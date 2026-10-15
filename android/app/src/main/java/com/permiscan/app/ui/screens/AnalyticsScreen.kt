package com.permiscan.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.permiscan.app.data.model.RiskLevel
import com.permiscan.app.ui.theme.*

@Composable
fun AnalyticsScreen(viewModel: PermiScanViewModel) {
    val state by viewModel.uiState.collectAsState()

    val appsWithUsage = state.apps.filter { it.usageInfo.hasUsageAccess && it.usageInfo.totalForegroundTimeMs > 0 }
        .sortedByDescending { it.usageInfo.totalForegroundTimeMs }
        .take(5)

    val appsWithMostSensitive = state.apps.sortedByDescending { it.sensitivePermissionCount }
        .take(5)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CyberBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Behavior & Permission Analytics",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = CyberTextPrimary
            )
            Text(
                text = "Ground-truth system metrics derived from PackageManager and UsageStatsManager.",
                fontSize = 12.sp,
                color = CyberTextSecondary
            )
        }

        // Section 1: Top Foreground Usage
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(10.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "TOP APPS BY MEASURED FOREGROUND USAGE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberCyan,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "Source: Android UsageStatsManager (Last 7 Days)",
                        fontSize = 10.sp,
                        color = CyberTextSecondary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    if (!state.hasUsageAccess) {
                        Text(
                            text = "Usage Access is currently disabled. Grant Usage Access in Android Settings to visualize real application screen time.",
                            fontSize = 12.sp,
                            color = CyberAmber
                        )
                    } else if (appsWithUsage.isEmpty()) {
                        Text(
                            text = "No foreground usage logged in the last 7 days.",
                            fontSize = 12.sp,
                            color = CyberTextSecondary
                        )
                    } else {
                        val maxTime = appsWithUsage.first().usageInfo.totalForegroundTimeMs.toFloat()
                        appsWithUsage.forEach { app ->
                            val progress = if (maxTime > 0) app.usageInfo.totalForegroundTimeMs / maxTime else 0f
                            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = app.appName, fontSize = 12.sp, color = CyberTextPrimary)
                                    Text(text = app.usageInfo.formattedDuration, fontSize = 12.sp, color = CyberCyan, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                LinearProgressIndicator(
                                    progress = { progress },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp),
                                    color = CyberCyan,
                                    trackColor = CyberSurfaceVariant
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Note: Foreground usage reflects active user engagement. It does not imply background audio, camera, or sensor capture.",
                        fontSize = 10.sp,
                        color = CyberTextSecondary
                    )
                }
            }
        }

        // Section 2: Sensitive Permission Concentration
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(10.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "SENSITIVE PERMISSION CONCENTRATION",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberAmber,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "Source: Live PackageManager Inspection (Current State)",
                        fontSize = 10.sp,
                        color = CyberTextSecondary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    if (appsWithMostSensitive.isEmpty()) {
                        Text("No installed apps scanned yet.", color = CyberTextSecondary, fontSize = 12.sp)
                    } else {
                        val maxPerms = appsWithMostSensitive.first().sensitivePermissionCount.coerceAtLeast(1).toFloat()
                        appsWithMostSensitive.forEach { app ->
                            val progress = (app.sensitivePermissionCount / maxPerms).coerceIn(0f, 1f)
                            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = app.appName, fontSize = 12.sp, color = CyberTextPrimary)
                                    Text(
                                        text = "${app.sensitivePermissionCount} sensitive",
                                        fontSize = 12.sp,
                                        color = if (app.sensitivePermissionCount > 0) CyberAmber else CyberGreen,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                LinearProgressIndicator(
                                    progress = { progress },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp),
                                    color = if (app.sensitivePermissionCount >= 4) CyberRed else CyberAmber,
                                    trackColor = CyberSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        // Section 3: Risk Level Distribution
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(10.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "SECURITY RISK LEVEL DISTRIBUTION",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberGreen,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "Heuristic classification based on verified permission combinations",
                        fontSize = 10.sp,
                        color = CyberTextSecondary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    val highCount = state.apps.count { it.riskLevel == RiskLevel.HIGH_PRIORITY }
                    val reviewCount = state.apps.count { it.riskLevel == RiskLevel.REVIEW_RECOMMENDED }
                    val lowCount = state.apps.count { it.riskLevel == RiskLevel.LOW }
                    val total = (highCount + reviewCount + lowCount).coerceAtLeast(1)

                    DistributionRow("High Review Priority", highCount, total, CyberRed)
                    DistributionRow("Review Recommended", reviewCount, total, CyberAmber)
                    DistributionRow("Low / Standard", lowCount, total, CyberGreen)
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun DistributionRow(label: String, count: Int, total: Int, color: Color) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = label, fontSize = 12.sp, color = CyberTextPrimary)
            Text(text = "$count (${(count * 100 / total)}%)", fontSize = 12.sp, color = color, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { count.toFloat() / total },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp),
            color = color,
            trackColor = CyberSurfaceVariant
        )
    }
}
