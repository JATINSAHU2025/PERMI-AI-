package com.permiscan.app.data.local

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "scan_sessions")
data class ScanSessionEntity(
    @PrimaryKey val id: String,
    val timestamp: Long,
    val durationMs: Long,
    val totalAppsScanned: Int,
    val highRiskCount: Int,
    val reviewRecommendedCount: Int,
    val lowRiskCount: Int,
    val totalSensitivePermissionsGranted: Int
)

@Entity(tableName = "observation_events")
data class ObservationEventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val packageName: String,
    val appName: String,
    val timestamp: Long,
    val eventType: String,
    val detail: String,
    val permissionName: String?
)

@Entity(tableName = "app_permission_snapshots", primaryKeys = ["packageName", "permissionName"])
data class AppPermissionSnapshotEntity(
    val packageName: String,
    val permissionName: String,
    val isGranted: Boolean,
    val isSensitive: Boolean,
    val lastObservedTime: Long
)

@Dao
interface PermiScanDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScanSession(session: ScanSessionEntity)

    @Query("SELECT * FROM scan_sessions ORDER BY timestamp DESC")
    fun getAllScanSessions(): Flow<List<ScanSessionEntity>>

    @Insert
    suspend fun insertObservation(event: ObservationEventEntity)

    @Query("SELECT * FROM observation_events WHERE packageName = :packageName ORDER BY timestamp DESC")
    fun getObservationsForApp(packageName: String): Flow<List<ObservationEventEntity>>

    @Query("SELECT * FROM observation_events ORDER BY timestamp DESC LIMIT 100")
    fun getRecentObservations(): Flow<List<ObservationEventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSnapshots(snapshots: List<AppPermissionSnapshotEntity>)

    @Query("SELECT * FROM app_permission_snapshots WHERE packageName = :packageName")
    suspend fun getSnapshotsForPackage(packageName: String): List<AppPermissionSnapshotEntity>

    @Query("SELECT * FROM app_permission_snapshots")
    suspend fun getAllSnapshots(): List<AppPermissionSnapshotEntity>
}

@Database(
    entities = [
        ScanSessionEntity::class,
        ObservationEventEntity::class,
        AppPermissionSnapshotEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class PermiScanDatabase : RoomDatabase() {
    abstract fun dao(): PermiScanDao
}
