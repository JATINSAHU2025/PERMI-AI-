package com.permiscan.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FileOpen
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
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
import com.permiscan.app.data.model.RiskLevel
import com.permiscan.app.ui.theme.*
import java.io.File
import java.io.FileOutputStream

@Composable
fun ApkCheckScreen(viewModel: PermiScanViewModel) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                val cacheFile = File(context.cacheDir, "inspect_target.apk")
                context.contentResolver.openInputStream(uri)?.use { input ->
                    FileOutputStream(cacheFile).use { output ->
                        input.copyTo(output)
                    }
                }
                viewModel.inspectApk(cacheFile)
            } catch (e: Exception) {
                // handle error
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "APK Security & Privacy Review",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Inspect standalone package archives safely before installation. Evaluates manifest declarations, digital signatures, and permission combinations.",
                fontSize = 12.sp,
                color = TextSecondary
            )
        }

        // Action card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = AppSurface),
                shape = RoundedCornerShape(12.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(AppBorder))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.FileOpen,
                        contentDescription = null,
                        tint = PrimaryBlue,
                        modifier = Modifier.size(40.dp)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Drop an APK here or choose a file",
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary,
                        fontSize = 15.sp
                    )
                    Text(
                        text = "Android Package Archive (.apk) up to 200 MB",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    Button(
                        onClick = { filePickerLauncher.launch("application/vnd.android.package-archive") },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue, contentColor = Color.White),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Browse Files", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        // Limitations Notice
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CyberSurface),
                shape = RoundedCornerShape(8.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberBorder))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "SECURITY LIMITATIONS & BOUNDARIES",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = CyberAmber,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "• Permi Scan audits declared package manifest declarations and metadata locally.\n" +
                               "• Does NOT execute code or emulate dynamic runtime bytecode.\n" +
                               "• Does NOT connect to cloud reputation networks without user consent.\n" +
                               "• Sideloaded APKs bypass Google Play Protect verification channels.",
                        fontSize = 11.sp,
                        color = CyberTextSecondary
                    )
                }
            }
        }

        // Error message if any
        if (state.apkErrorMessage != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CyberSurface),
                    shape = RoundedCornerShape(8.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CyberRed))
                ) {
                    Text(
                        text = "Inspection Error: ${state.apkErrorMessage}",
                        color = CyberRed,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        }

        // Parsed profile
        val profile = state.selectedApkProfile
        if (profile != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CyberSurface),
                    shape = RoundedCornerShape(10.dp),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(
                            when (profile.riskLevel) {
                                RiskLevel.HIGH_PRIORITY -> CyberRed
                                RiskLevel.REVIEW_RECOMMENDED -> CyberAmber
                                RiskLevel.LOW -> CyberGreen
                            }
                        )
                    )
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = profile.appName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = CyberTextPrimary
                            )
                            Badge(
                                containerColor = when (profile.riskLevel) {
                                    RiskLevel.HIGH_PRIORITY -> CyberRed
                                    RiskLevel.REVIEW_RECOMMENDED -> CyberAmber
                                    RiskLevel.LOW -> CyberGreen
                                }
                            ) {
                                Text(profile.riskLevel.name.replace("_", " "), fontSize = 10.sp, color = Color.Black)
                            }
                        }
                        Text(text = profile.packageName, fontSize = 11.sp, color = CyberTextSecondary)
                        Spacer(modifier = Modifier.height(8.dp))
                        MetadataRow("Version", "${profile.versionName} (${profile.versionCode})")
                        MetadataRow("Target SDK", "${profile.targetSdk} (Min SDK: ${profile.minSdk})")
                        MetadataRow("Declared Permissions", "${profile.permissions.size}")
                        MetadataRow("Sensitive Permissions", "${profile.sensitivePermissionCount}")
                    }
                }
            }

            if (profile.findings.isNotEmpty()) {
                item {
                    Text("Pre-Installation Risk Findings", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = CyberTextPrimary)
                }
                items(profile.findings) { finding ->
                    FindingItemCard(finding = finding, onClick = {})
                }
            }

            item {
                Text("Declared Manifest Permissions", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = CyberTextPrimary)
            }

            items(profile.permissions) { perm ->
                PermissionItemCard(perm = perm)
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
