package com.permiscan.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
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
import com.permiscan.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HistoryScreen(
    viewModel: PermiScanViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CyberBg)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = CyberCyan)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "Scan & Observation History",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = CyberTextPrimary
                )
                Text(
                    text = "Chronological record of scans and detected permission changes.",
                    fontSize = 11.sp,
                    color = CyberTextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (state.scanHistory.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No previous scans recorded. Trigger 'Scan Device' from the dashboard.",
                    color = CyberTextSecondary,
                    fontSize = 13.sp
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(state.scanHistory) { session ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CyberSurface),
                        shape = RoundedCornerShape(8.dp),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date(session.timestamp)),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = CyberCyan,
                                    fontFamily = FontFamily.Monospace
                                )
                                Text(
                                    text = "${session.durationMs} ms",
                                    fontSize = 12.sp,
                                    color = CyberGreen,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(text = "${session.totalAppsScanned} apps", fontSize = 11.sp, color = CyberTextPrimary)
                                Text(text = "${session.highRiskCount} High", fontSize = 11.sp, color = CyberRed, fontWeight = FontWeight.Bold)
                                Text(text = "${session.reviewRecommendedCount} Review", fontSize = 11.sp, color = CyberAmber, fontWeight = FontWeight.Bold)
                                Text(text = "${session.totalSensitivePermissionsGranted} sensitive granted", fontSize = 11.sp, color = CyberTextSecondary)
                            }
                        }
                    }
                }
            }
        }
    }
}
