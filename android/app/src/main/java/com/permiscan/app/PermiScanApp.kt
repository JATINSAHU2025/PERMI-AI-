package com.permiscan.app

import android.app.Application
import androidx.room.Room
import com.permiscan.app.data.local.PermiScanDatabase

class PermiScanApp : Application() {

    lateinit var database: PermiScanDatabase
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        database = Room.databaseBuilder(
            applicationContext,
            PermiScanDatabase::class.java,
            "permiscan_db"
        ).fallbackToDestructiveMigration().build()
    }

    companion object {
        lateinit var instance: PermiScanApp
            private set
    }
}
