package com.permiscan.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Search
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
import com.permiscan.app.data.model.AppSecurityProfile
import com.permiscan.app.data.model.RiskLevel
import com.permiscan.app.ui.theme.*

@Composable
fun AppListScreen(
    viewModel: PermiScanViewModel,
    onAppClick: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    val filteredApps = state.apps.filter { app ->
        val matchesQuery = app.appName.contains(state.searchQuery, ignoreCase = true) ||
                app.packageName.contains(state.searchQuery, ignoreCase = true)
        val matchesRisk = state.filterRiskLevel == null || app.riskLevel == state.filterRiskLevel
        matchesQuery && matchesRisk
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CyberBg)
            .padding(16.dp)
    ) {
        Text(
            text = "Installed Applications",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = CyberTextPrimary
        )
        Text(
            text = "${filteredApps.size} apps visible via PackageManager",
            fontSize = 12.sp,
            color = CyberTextSecondary
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Search bar
        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = { viewModel.setSearchQuery(it) },
            placeholder = { Text("Search by name or package...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = CyberCyan) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = CyberCyan,
                unfocusedBorderColor = CyberBorder,
                focusedContainerColor = CyberSurface,
                unfocusedContainerColor = CyberSurface
            ),
            shape = RoundedCornerShape(8.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Risk filter chips
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = state.filterRiskLevel == null,
                onClick = { viewModel.setRiskFilter(null) },
                label = { Text("All (${state.apps.size})") }
            )
            FilterChip(
                selected = state.filterRiskLevel == RiskLevel.HIGH_PRIORITY,
                onClick = {
                    viewModel.setRiskFilter(
                        if (state.filterRiskLevel == RiskLevel.HIGH_PRIORITY) null else RiskLevel.HIGH_PRIORITY
                    )
                },
                label = { Text("High Priority", color = CyberRed) }
            )
            FilterChip(
                selected = state.filterRiskLevel == RiskLevel.REVIEW_RECOMMENDED,
                onClick = {
                    viewModel.setRiskFilter(
                        if (state.filterRiskLevel == RiskLevel.REVIEW_RECOMMENDED) null else RiskLevel.REVIEW_RECOMMENDED
                    )
                },
                label = { Text("Review", color = CyberAmber) }
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        if (filteredApps.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (state.apps.isEmpty()) "No apps found. Tap 'Scan Device' on dashboard." else "No apps match filter criteria.",
                    color = CyberTextSecondary,
                    fontSize = 13.sp
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredApps) { app ->
                    AppRowCard(app = app, onClick = { onAppClick(app.packageName) })
                }
            }
        }
    }
}

@Composable
fun AppRowCard(app: AppSecurityProfile, onClick: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CyberSurface),
        shape = RoundedCornerShape(8.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder)),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = app.appName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = CyberTextPrimary
                    )
                    if (app.isSystemApp) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "[SYSTEM]",
                            fontSize = 9.sp,
                            color = CyberCyan,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Text(
                    text = app.packageName,
                    fontSize = 11.sp,
                    color = CyberTextSecondary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "${app.permissions.size} perms",
                        fontSize = 10.sp,
                        color = CyberTextSecondary
                    )
                    Text(
                        text = "${app.sensitivePermissionCount} sensitive granted",
                        fontSize = 10.sp,
                        color = if (app.sensitivePermissionCount > 0) CyberAmber else CyberGreen
                    )
                    if (app.usageInfo.dataAvailable) {
                        Text(
                            text = "Used: ${app.usageInfo.formattedDuration}",
                            fontSize = 10.sp,
                            color = CyberCyan
                        )
                    }
                }
            }

            Badge(
                containerColor = when (app.riskLevel) {
                    RiskLevel.HIGH_PRIORITY -> CyberRed
                    RiskLevel.REVIEW_RECOMMENDED -> CyberAmber
                    RiskLevel.LOW -> CyberGreen
                }
            ) {
                Text(
                    text = when (app.riskLevel) {
                        RiskLevel.HIGH_PRIORITY -> "HIGH"
                        RiskLevel.REVIEW_RECOMMENDED -> "REVIEW"
                        RiskLevel.LOW -> "LOW"
                    },
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
            }
        }
    }
}
