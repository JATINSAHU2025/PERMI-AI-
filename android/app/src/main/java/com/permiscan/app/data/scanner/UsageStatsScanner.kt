package com.permiscan.app.data.scanner

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import android.os.Process
import com.permiscan.app.data.model.UsageInfo
import java.util.concurrent.TimeUnit

class UsageStatsScanner(private val context: Context) {

    private val usageStatsManager: UsageStatsManager? =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager

    fun hasUsageStatsPermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun queryUsageStats(timeRangeDays: Int = 7): Map<String, UsageInfo> {
        if (!hasUsageStatsPermission() || usageStatsManager == null) {
            return emptyMap()
        }

        val endTime = System.currentTimeMillis()
        val startTime = endTime - TimeUnit.DAYS.toMillis(timeRangeDays.toLong())

        val stats: List<UsageStats> = try {
            usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            ) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }

        val aggregatedMap = mutableMapOf<String, Long>()
        val lastUsedMap = mutableMapOf<String, Long>()

        for (stat in stats) {
            val totalTime = aggregatedMap.getOrDefault(stat.packageName, 0L) + stat.totalTimeInForeground
            aggregatedMap[stat.packageName] = totalTime
            val currentLastUsed = lastUsedMap.getOrDefault(stat.packageName, 0L)
            if (stat.lastTimeUsed > currentLastUsed) {
                lastUsedMap[stat.packageName] = stat.lastTimeUsed
            }
        }

        return aggregatedMap.mapValues { (pkg, totalFgMs) ->
            UsageInfo(
                hasUsageAccess = true,
                totalForegroundTimeMs = totalFgMs,
                lastTimeUsedMs = lastUsedMap[pkg] ?: 0L,
                formattedDuration = formatDuration(totalFgMs),
                dataAvailable = totalFgMs > 0
            )
        }
    }

    private fun formatDuration(millis: Long): String {
        val hours = TimeUnit.MILLISECONDS.toHours(millis)
        val minutes = TimeUnit.MILLISECONDS.toMinutes(millis) % 60
        val seconds = TimeUnit.MILLISECONDS.toSeconds(millis) % 60
        return when {
            hours > 0 -> "${hours}h ${minutes}m"
            minutes > 0 -> "${minutes}m ${seconds}s"
            else -> "${seconds}s"
        }
    }
}
