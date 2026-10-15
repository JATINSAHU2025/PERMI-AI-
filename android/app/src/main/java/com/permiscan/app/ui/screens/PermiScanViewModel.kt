package com.permiscan.app.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.permiscan.app.PermiScanApp
import com.permiscan.app.data.local.AppPermissionSnapshotEntity
import com.permiscan.app.data.local.ObservationEventEntity
import com.permiscan.app.data.local.ScanSessionEntity
import com.permiscan.app.data.model.AppSecurityProfile
import com.permiscan.app.data.model.RiskFinding
import com.permiscan.app.data.model.RiskLevel
import com.permiscan.app.data.model.ScanSession
import com.permiscan.app.data.scanner.ApkInspector
import com.permiscan.app.data.scanner.PackageManagerScanner
import com.permiscan.app.data.scanner.UsageStatsScanner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

data class PermiScanUiState(
    val isScanning: Boolean = false,
    val scanProgress: Float = 0f,
    val scanStatusMessage: String = "Ready to audit",
    val scanErrorMessage: String? = null,
    val lastScanSession: ScanSession? = null,
    val apps: List<AppSecurityProfile> = emptyList(),
    val findings: List<RiskFinding> = emptyList(),
    val scanHistory: List<ScanSessionEntity> = emptyList(),
    val observations: List<ObservationEventEntity> = emptyList(),
    val hasUsageAccess: Boolean = false,
    val selectedApkProfile: AppSecurityProfile? = null,
    val apkErrorMessage: String? = null,
    val isApkParsing: Boolean = false,
    val currentScanDurationMs: Long = 0L,
    val filterRiskLevel: RiskLevel? = null,
    val searchQuery: String = ""
)

class PermiScanViewModel(application: Application) : AndroidViewModel(application) {

    private val packageScanner = PackageManagerScanner(application)
    private val usageScanner = UsageStatsScanner(application)
    private val apkInspector = ApkInspector(application)
    private val db = (application as PermiScanApp).database.dao()

    private val _uiState = MutableStateFlow(PermiScanUiState())
    val uiState: StateFlow<PermiScanUiState> = _uiState.asStateFlow()

    init {
        checkUsageAccess()
        loadHistory()
        scanDevice()
    }

    fun checkUsageAccess() {
        val hasAccess = usageScanner.hasUsageStatsPermission()
        _uiState.value = _uiState.value.copy(hasUsageAccess = hasAccess)
    }

    private fun loadHistory() {
        viewModelScope.launch {
            db.getAllScanSessions().collect { sessions ->
                _uiState.value = _uiState.value.copy(scanHistory = sessions)
            }
        }
        viewModelScope.launch {
            db.getRecentObservations().collect { obs ->
                _uiState.value = _uiState.value.copy(observations = obs)
            }
        }
    }

    fun scanDevice() {
        if (_uiState.value.isScanning) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isScanning = true,
                scanProgress = 0.1f,
                scanStatusMessage = "Querying installed packages...",
                scanErrorMessage = null
            )
            val startTime = System.currentTimeMillis()

            try {
                // Step 1: Query usage statistics if authorized
                _uiState.value = _uiState.value.copy(
                    scanProgress = 0.25f,
                    scanStatusMessage = "Checking usage authorizations..."
                )
                val usageStats = if (usageScanner.hasUsageStatsPermission()) {
                    usageScanner.queryUsageStats(7)
                } else {
                    emptyMap()
                }

                // Step 2: Retrieve installed packages via PackageManager
                _uiState.value = _uiState.value.copy(
                    scanProgress = 0.5f,
                    scanStatusMessage = "Auditing declared permissions..."
                )
                val scannedApps = withContext(Dispatchers.IO) {
                    packageScanner.scanAllInstalledApps(usageStats)
                }

                if (scannedApps.isEmpty()) {
                    _uiState.value = _uiState.value.copy(
                        isScanning = false,
                        scanProgress = 0f,
                        scanStatusMessage = "No packages discovered",
                        scanErrorMessage = "No packages were accessible via PackageManager. Verify QUERY_ALL_PACKAGES permissions."
                    )
                    return@launch
                }

                // Step 3: Run explainable heuristics and compute diffs
                _uiState.value = _uiState.value.copy(
                    scanProgress = 0.8f,
                    scanStatusMessage = "Evaluating permission combinations..."
                )
                val endTime = System.currentTimeMillis()
                val durationMs = endTime - startTime

                val previousSnapshots = withContext(Dispatchers.IO) {
                    db.getAllSnapshots().associateBy { "${it.packageName}:${it.permissionName}" }
                }
                val newSnapshots = mutableListOf<AppPermissionSnapshotEntity>()
                val newObservations = mutableListOf<ObservationEventEntity>()

                for (app in scannedApps) {
                    for (perm in app.permissions) {
                        val key = "${app.packageName}:${perm.name}"
                        val prev = previousSnapshots[key]
                        if (prev != null && prev.isGranted != perm.isGranted) {
                            val event = if (perm.isGranted) "PERMISSION_GRANTED" else "PERMISSION_REVOKED"
                            newObservations.add(
                                ObservationEventEntity(
                                    packageName = app.packageName,
                                    appName = app.appName,
                                    timestamp = endTime,
                                    eventType = event,
                                    detail = "${perm.simpleName} changed from ${if (prev.isGranted) "GRANTED" else "DENIED"} to ${if (perm.isGranted) "GRANTED" else "DENIED"}",
                                    permissionName = perm.name
                                )
                            )
                        }
                        newSnapshots.add(
                            AppPermissionSnapshotEntity(
                                packageName = app.packageName,
                                permissionName = perm.name,
                                isGranted = perm.isGranted,
                                isSensitive = perm.isSensitive,
                                lastObservedTime = endTime
                            )
                        )
                    }
                }

                // Save to Room DB
                withContext(Dispatchers.IO) {
                    db.saveSnapshots(newSnapshots)
                    for (obs in newObservations) {
                        db.insertObservation(obs)
                    }
                }

                val allFindings = scannedApps.flatMap { it.findings }
                val highRiskCount = scannedApps.count { it.riskLevel == RiskLevel.HIGH_PRIORITY }
                val reviewCount = scannedApps.count { it.riskLevel == RiskLevel.REVIEW_RECOMMENDED }
                val lowRiskCount = scannedApps.count { it.riskLevel == RiskLevel.LOW }
                val sensitiveCount = scannedApps.sumOf { app -> app.permissions.count { it.isGranted && it.isSensitive } }

                val session = ScanSession(
                    id = UUID.randomUUID().toString(),
                    timestamp = endTime,
                    durationMs = durationMs,
                    totalAppsScanned = scannedApps.size,
                    highRiskCount = highRiskCount,
                    reviewRecommendedCount = reviewCount,
                    lowRiskCount = lowRiskCount,
                    totalSensitivePermissionsGranted = sensitiveCount
                )

                withContext(Dispatchers.IO) {
                    db.insertScanSession(
                        ScanSessionEntity(
                            id = session.id,
                            timestamp = session.timestamp,
                            durationMs = session.durationMs,
                            totalAppsScanned = session.totalAppsScanned,
                            highRiskCount = session.highRiskCount,
                            reviewRecommendedCount = session.reviewRecommendedCount,
                            lowRiskCount = session.lowRiskCount,
                            totalSensitivePermissionsGranted = session.totalSensitivePermissionsGranted
                        )
                    )
                }

                _uiState.value = _uiState.value.copy(
                    isScanning = false,
                    scanProgress = 1f,
                    scanStatusMessage = "Audit complete",
                    scanErrorMessage = null,
                    lastScanSession = session,
                    apps = scannedApps,
                    findings = allFindings,
                    currentScanDurationMs = durationMs
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isScanning = false,
                    scanProgress = 0f,
                    scanStatusMessage = "Scan interrupted",
                    scanErrorMessage = e.message ?: "Failed to complete device scan. Tap retry to restart."
                )
            }
        }
    }

    fun inspectApk(apkFile: File) {
        _uiState.value = _uiState.value.copy(isApkParsing = true, apkErrorMessage = null)
        viewModelScope.launch {
            val result = apkInspector.inspectApkFile(apkFile)
            result.fold(
                onSuccess = { profile ->
                    _uiState.value = _uiState.value.copy(
                        selectedApkProfile = profile,
                        isApkParsing = false,
                        apkErrorMessage = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        selectedApkProfile = null,
                        isApkParsing = false,
                        apkErrorMessage = error.message ?: "Failed to inspect APK archive"
                    )
                }
            )
        }
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun setRiskFilter(level: RiskLevel?) {
        _uiState.value = _uiState.value.copy(filterRiskLevel = level)
    }
}
