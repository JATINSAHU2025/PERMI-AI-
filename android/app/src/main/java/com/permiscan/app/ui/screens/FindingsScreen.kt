package com.permiscan.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.permiscan.app.data.model.RiskLevel
import com.permiscan.app.ui.theme.*

@Composable
fun FindingsScreen(
    viewModel: PermiScanViewModel,
    onAppClick: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CyberBg)
            .padding(16.dp)
    ) {
        Text(
            text = "Security Findings",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = CyberTextPrimary
        )
        Text(
            text = "${state.findings.size} findings detected by explainable rule engine.",
            fontSize = 12.sp,
            color = CyberTextSecondary
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Transparency callout
        Card(
            colors = CardDefaults.cardColors(containerColor = CyberSurface),
            shape = RoundedCornerShape(8.dp),
            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = "HEURISTIC RISK ASSESSMENT DISCLAIMER",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = CyberCyan
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Findings indicate sensitive permission exposure and potential attack surface. They do not constitute conclusive evidence of malicious code or active surveillance.",
                    fontSize = 11.sp,
                    color = CyberTextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (state.findings.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No security findings. Perform a scan or audit individual apps.",
                    color = CyberTextSecondary,
                    fontSize = 13.sp
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(state.findings.sortedByDescending { it.riskLevel }) { finding ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CyberSurface),
                        shape = RoundedCornerShape(8.dp),
                        border = CardDefaults.outlinedCardBorder().copy(
                            brush = androidx.compose.ui.graphics.SolidColor(
                                when (finding.riskLevel) {
                                    RiskLevel.HIGH_PRIORITY -> CyberRed
                                    RiskLevel.REVIEW_RECOMMENDED -> CyberAmber
                                    RiskLevel.LOW -> CyberBorder
                                }
                            )
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onAppClick(finding.packageName) }
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = finding.title,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = CyberTextPrimary,
                                    modifier = Modifier.weight(1f)
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

                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "App: ${finding.appName} • ${finding.packageName}",
                                fontSize = 11.sp,
                                color = CyberCyan
                            )

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = "Evidence:", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = CyberTextPrimary)
                            finding.evidence.forEach { ev ->
                                Text(text = "• $ev", fontSize = 11.sp, color = CyberTextSecondary)
                            }

                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "Why it matters:", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = CyberAmber)
                            Text(text = finding.whyItDeservesAttention, fontSize = 11.sp, color = CyberTextSecondary)

                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "What cannot be verified:", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = CyberTextSecondary)
                            Text(text = finding.whatCannotBeVerified, fontSize = 10.sp, color = CyberTextSecondary)

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Recommended Action: ${finding.practicalNextAction}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = CyberGreen
                            )
                        }
                    }
                }
            }
        }
    }
}
