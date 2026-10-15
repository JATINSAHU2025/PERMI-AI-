package com.permiscan.app.receiver

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.permiscan.app.MainActivity
import com.permiscan.app.data.local.ObservationEventEntity
import com.permiscan.app.data.local.PermiScanDatabase
import com.permiscan.app.data.scanner.PackageManagerScanner
import com.permiscan.app.domain.risk.RiskLevel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import androidx.room.Room

class PackageInstallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val packageName = intent.data?.schemeSpecificPart ?: return

        // Skip our own package events
        if (packageName == context.packageName) return

        val isReplaced = intent.getBooleanExtra(Intent.EXTRA_REPLACING, false)
        val eventType = if (isReplaced || action == Intent.ACTION_PACKAGE_REPLACED) "APP_UPDATED" else "NEW_INSTALL"

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val scanner = PackageManagerScanner(context)
                val packageInfo = try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        context.packageManager.getPackageInfo(
                            packageName,
                            PackageManager.PackageInfoFlags.of((PackageManager.GET_PERMISSIONS or PackageManager.GET_META_DATA).toLong())
                        )
                    } else {
                        @Suppress("DEPRECATION")
                        context.packageManager.getPackageInfo(
                            packageName,
                            PackageManager.GET_PERMISSIONS or PackageManager.GET_META_DATA
                        )
                    }
                } catch (e: Exception) {
                    null
                } ?: return@launch

                val profile = scanner.inspectPackage(packageInfo)

                // Log observation locally in Room
                val db = Room.databaseBuilder(
                    context.applicationContext,
                    PermiScanDatabase::class.java,
                    "permiscan.db"
                ).build()

                db.dao().insertObservation(
                    ObservationEventEntity(
                        packageName = packageName,
                        appName = profile.appName,
                        timestamp = System.currentTimeMillis(),
                        eventType = eventType,
                        detail = "Detected ${if (eventType == "NEW_INSTALL") "new installation" else "package update"}. Stated risk: ${profile.riskLevel.name} with ${profile.sensitivePermissionCount} sensitive permissions.",
                        permissionName = null
                    )
                )

                // Post standard Android notification if Review Recommended or High Priority
                if (profile.riskLevel != RiskLevel.LOW) {
                    postNotification(context, profile.appName, packageName, profile.riskLevel)
                }
            } catch (e: Exception) {
                // Log and gracefully handle
            }
        }
    }

    private fun postNotification(
        context: Context,
        appName: String,
        packageName: String,
        riskLevel: RiskLevel
    ) {
        val channelId = "permiscan_security_alerts"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Permi Scan Security Alerts",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Alerts for newly installed apps with sensitive permission profiles"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("EXTRA_PACKAGE_NAME", packageName)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            packageName.hashCode(),
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = if (riskLevel == RiskLevel.HIGH_PRIORITY) {
            "⚠️ High Risk Review: $appName"
        } else {
            "🔍 Permission Review: $appName"
        }

        val message = "Newly detected application requests sensitive capabilities. Tap to audit its security profile."

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(message)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        notificationManager.notify(packageName.hashCode(), notification)
    }
}
