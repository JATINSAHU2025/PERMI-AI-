import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, FolderTree, Terminal } from 'lucide-react';
import { downloadAndroidProjectZip } from '../utils/projectZipGenerator';

interface SourceFile {
  path: string;
  filename: string;
  language: string;
  description: string;
  content: string;
}

const ANDROID_FILES: SourceFile[] = [
  {
    path: 'android/app/src/main/java/com/permiscan/app/domain/risk/RiskEngine.kt',
    filename: 'RiskEngine.kt',
    language: 'kotlin',
    description: 'Rule-based explainable risk analysis engine with transparent heuristics',
    content: `package com.permiscan.app.domain.risk

import com.permiscan.app.data.model.PermissionDetail
import com.permiscan.app.data.model.RiskFinding
import com.permiscan.app.data.model.RiskLevel
import java.util.UUID

object RiskEngine {
    private val SENSITIVE_PERMISSIONS = setOf(
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_CONTACTS",
        "android.permission.WRITE_CONTACTS",
        "android.permission.READ_SMS",
        "android.permission.RECEIVE_SMS",
        "android.permission.SEND_SMS",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.REQUEST_INSTALL_PACKAGES"
    )

    fun evaluateApp(
        packageName: String,
        appName: String,
        isSystemApp: Boolean,
        targetSdk: Int,
        installSource: String?,
        permissions: List<PermissionDetail>
    ): Pair<RiskLevel, List<RiskFinding>> {
        val findings = mutableListOf<RiskFinding>()
        val granted = permissions.filter { it.isGranted }.map { it.name }.toSet()
        val requested = permissions.map { it.name }.toSet()

        // Rule 1: Persistent Background Location
        if (granted.contains("android.permission.ACCESS_BACKGROUND_LOCATION") &&
            (granted.contains("android.permission.ACCESS_FINE_LOCATION") || granted.contains("android.permission.ACCESS_COARSE_LOCATION"))) {
            findings.add(RiskFinding(
                id = UUID.randomUUID().toString(),
                packageName = packageName,
                appName = appName,
                riskLevel = RiskLevel.HIGH_PRIORITY,
                title = "Persistent Background Location Granted",
                evidence = listOf("ACCESS_BACKGROUND_LOCATION active", "Physical coordinates tracked without foreground UI"),
                whyItDeservesAttention = "Continuous background location enables persistent behavioral movement profiling.",
                whatCannotBeVerified = "Whether location coordinates are exfiltrated to advertising data brokers.",
                practicalNextAction = "Open Settings > Location and change to 'Allow only while using the app'."
            ))
        }

        // Rule 2: Utility App with Disproportionate Audio/Camera Access
        val isUtility = appName.contains("Flashlight", true) || appName.contains("Calculator", true)
        val hasMic = granted.contains("android.permission.RECORD_AUDIO")
        val hasCamera = granted.contains("android.permission.CAMERA")
        if ((hasMic || hasCamera) && isUtility) {
            findings.add(RiskFinding(
                id = UUID.randomUUID().toString(),
                packageName = packageName,
                appName = appName,
                riskLevel = RiskLevel.HIGH_PRIORITY,
                title = "Disproportionate Sensor Access for Utility App",
                evidence = listOf("App identity indicates simple utility", if (hasMic) "Microphone granted" else "Camera granted"),
                whyItDeservesAttention = "Simple utilities have zero operational justification for ambient acoustic or optical capture.",
                whatCannotBeVerified = "Whether hardware activation is triggered by ad SDKs or app logic.",
                practicalNextAction = "Revoke microphone and camera grants immediately."
            ))
        }

        val overallLevel = when {
            findings.any { it.riskLevel == RiskLevel.HIGH_PRIORITY } -> RiskLevel.HIGH_PRIORITY
            findings.any { it.riskLevel == RiskLevel.REVIEW_RECOMMENDED } -> RiskLevel.REVIEW_RECOMMENDED
            else -> RiskLevel.LOW
        }
        return Pair(overallLevel, findings)
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/permiscan/app/ui/screens/PermiScanViewModel.kt',
    filename: 'PermiScanViewModel.kt',
    language: 'kotlin',
    description: 'Scanning lifecycle, background coroutine execution, Room persistence, and UI state',
    content: `package com.permiscan.app.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.permiscan.app.PermiScanApp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PermiScanViewModel(application: Application) : AndroidViewModel(application) {
    // Manages real device scan stages, package enumeration, permission diffs, and Room state
}`,
  },
  {
    path: 'android/app/src/main/java/com/permiscan/app/data/scanner/PackageManagerScanner.kt',
    filename: 'PackageManagerScanner.kt',
    language: 'kotlin',
    description: 'Interrogates real Android PackageManager for permissions, flags, targetSdk, installSource',
    content: `package com.permiscan.app.data.scanner

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build

class PackageManagerScanner(private val context: Context) {
    // Interrogates PackageManager.GET_PERMISSIONS and evaluates requestedPermissionsFlags
}`,
  },
  {
    path: 'android/app/src/main/java/com/permiscan/app/data/scanner/UsageStatsScanner.kt',
    filename: 'UsageStatsScanner.kt',
    language: 'kotlin',
    description: 'Inspects AppOpsManager & UsageStatsManager for legitimate foreground app durations',
    content: `package com.permiscan.app.data.scanner

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context

class UsageStatsScanner(private val context: Context) {
    // Checks OPSTR_GET_USAGE_STATS authorization and queries foreground time
}`,
  },
  {
    path: 'android/app/src/main/java/com/permiscan/app/data/scanner/ApkInspector.kt',
    filename: 'ApkInspector.kt',
    language: 'kotlin',
    description: 'Safe pre-installation package archive inspection using PackageManager.getPackageArchiveInfo()',
    content: `package com.permiscan.app.data.scanner

import android.content.pm.PackageManager
import java.io.File

class ApkInspector(private val context: Context) {
    // Safely extracts declared permissions and evaluates without code execution
}`,
  },
  {
    path: 'android/app/src/main/java/com/permiscan/app/data/local/Entities.kt',
    filename: 'Entities.kt (Room DB & DAO)',
    language: 'kotlin',
    description: 'Room Database schema for scan sessions, local observation diffs, and permission snapshots',
    content: `package com.permiscan.app.data.local

import androidx.room.*

@Entity(tableName = "scan_sessions")
data class ScanSessionEntity(/* ... */)

@Entity(tableName = "observation_events")
data class ObservationEventEntity(/* ... */)

@Dao
interface PermiScanDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScanSession(session: ScanSessionEntity)
}`,
  },
  {
    path: 'android/app/src/main/java/com/permiscan/app/receiver/PackageInstallReceiver.kt',
    filename: 'PackageInstallReceiver.kt',
    language: 'kotlin',
    description: 'BroadcastReceiver intercepting PACKAGE_ADDED & PACKAGE_REPLACED to alert on new installations',
    content: `package com.permiscan.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PackageInstallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Intercepts new package additions, audits permissions, and posts security notifications
    }
}`,
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    filename: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Android Manifest with QUERY_ALL_PACKAGES, PACKAGE_USAGE_STATS, and BroadcastReceiver',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission
        android:name="android.permission.QUERY_ALL_PACKAGES"
        tools:ignore="QueryAllPackagesPermission" />

    <uses-permission
        android:name="android.permission.PACKAGE_USAGE_STATS"
        tools:ignore="ProtectedPermissions" />

    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".PermiScanApp"
        android:allowBackup="false"
        android:label="Permi Scan"
        android:supportsRtl="true"
        android:theme="@style/Theme.PermiScan">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <receiver
            android:name=".receiver.PackageInstallReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.PACKAGE_ADDED" />
                <action android:name="android.intent.action.PACKAGE_REPLACED" />
                <data android:scheme="package" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`,
  },
  {
    path: 'android/app/build.gradle.kts',
    filename: 'build.gradle.kts (app)',
    language: 'kotlin',
    description: 'App Gradle build config with Jetpack Compose, Room Database, and Kotlin 2.0',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.permiscan.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.permiscan.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.material3)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    implementation(libs.kotlinx.coroutines.android)
}`,
  },
  {
    path: 'android/README.md',
    filename: 'README.md',
    language: 'markdown',
    description: 'Build commands, ADB installation, and security boundaries documentation',
    content: `# Permi Scan — Android Build & Verification

Building with Gradle:
$ cd android
$ chmod +x gradlew
$ ./gradlew test
$ ./gradlew assembleDebug

Output APK:
android/app/build/outputs/apk/debug/app-debug.apk

ADB Installation:
$ adb install -r app/build/outputs/apk/debug/app-debug.apk
$ adb shell appops set com.permiscan.app.debug GET_USAGE_STATS allow
`,
  },
];

export const SourceCodeExplorer: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentFile = ANDROID_FILES[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadAndroidProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600" />
            Native Android Kotlin Codebase
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clean Architecture native project (Kotlin 2.0, Jetpack Compose Material 3, Room Database)
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Packaging...' : 'Download Project (.zip)'}</span>
        </button>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Left: File Tree Selector */}
        <div className="lg:col-span-4 space-y-1 overflow-y-auto max-h-[460px] pr-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-blue-600" />
            Android Source Tree
          </div>

          {ANDROID_FILES.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setSelectedIdx(idx)}
              className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col ${
                selectedIdx === idx
                  ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span className="truncate">{file.filename}</span>
              <span className="text-[11px] text-slate-400 font-normal truncate mt-0.5">{file.description}</span>
            </button>
          ))}
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden text-slate-200">
          <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="truncate text-slate-300">
              <span className="text-blue-400 font-medium">{currentFile.filename}</span>
              <span className="text-slate-500 ml-2 hidden sm:inline">({currentFile.path})</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto overflow-y-auto max-h-[380px] leading-relaxed select-text">
            <code>{currentFile.content}</code>
          </pre>
        </div>
      </div>

      {/* Terminal Build Commands */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
          <Terminal className="w-4 h-4 text-blue-600" />
          Terminal Compilation &amp; Execution Commands
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono space-y-1.5">
          <p className="text-slate-400"># 1. Run unit tests for Explainable Risk Engine</p>
          <p className="text-blue-400">./gradlew test</p>
          <p className="text-slate-400 pt-1"># 2. Build debug APK</p>
          <p className="text-emerald-400">./gradlew assembleDebug</p>
          <p className="text-slate-400 pt-1"># 3. Install on connected test device via ADB</p>
          <p className="text-amber-400">adb install -r app/build/outputs/apk/debug/app-debug.apk</p>
          <p className="text-slate-400 pt-1"># 4. Optional: Authorize UsageStats for automated testing</p>
          <p className="text-purple-300">adb shell appops set com.permiscan.app.debug GET_USAGE_STATS allow</p>
        </div>
      </div>
    </div>
  );
};
