package com.permiscan.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.permiscan.app.ui.screens.AnalyticsScreen
import com.permiscan.app.ui.screens.ApkCheckScreen
import com.permiscan.app.ui.screens.AppDetailScreen
import com.permiscan.app.ui.screens.AppListScreen
import com.permiscan.app.ui.screens.DashboardScreen
import com.permiscan.app.ui.screens.FindingsScreen
import com.permiscan.app.ui.screens.HistoryScreen
import com.permiscan.app.ui.screens.PermiScanViewModel
import com.permiscan.app.ui.screens.SettingsScreen
import com.permiscan.app.ui.theme.PermiScanTheme

sealed class Screen(val route: String, val title: String) {
    object Dashboard : Screen("dashboard", "Dashboard")
    object InstalledApps : Screen("apps", "Apps")
    object Findings : Screen("findings", "Findings")
    object Analytics : Screen("analytics", "Analytics")
    object ApkCheck : Screen("apk_check", "APK Check")
    object History : Screen("history", "History")
    object Settings : Screen("settings", "Settings")
    data class AppDetail(val packageName: String) : Screen("app_detail/$packageName", "App Detail")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val directPackage = intent.getStringExtra("EXTRA_PACKAGE_NAME")

        setContent {
            PermiScanTheme {
                PermiScanMainApp(initialPackage = directPackage)
            }
        }
    }
}

@Composable
fun PermiScanMainApp(
    initialPackage: String? = null,
    viewModel: PermiScanViewModel = viewModel()
) {
    var currentScreen by remember {
        mutableStateOf<Screen>(
            if (initialPackage != null) Screen.AppDetail(initialPackage) else Screen.Dashboard
        )
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentScreen is Screen.Dashboard,
                    onClick = { currentScreen = Screen.Dashboard },
                    icon = { Icon(Icons.Default.Shield, contentDescription = "Dashboard") },
                    label = { Text("Dashboard") }
                )
                NavigationBarItem(
                    selected = currentScreen is Screen.InstalledApps,
                    onClick = { currentScreen = Screen.InstalledApps },
                    icon = { Icon(Icons.Default.Apps, contentDescription = "Apps") },
                    label = { Text("Apps") }
                )
                NavigationBarItem(
                    selected = currentScreen is Screen.Findings,
                    onClick = { currentScreen = Screen.Findings },
                    icon = { Icon(Icons.Default.Warning, contentDescription = "Findings") },
                    label = { Text("Findings") }
                )
                NavigationBarItem(
                    selected = currentScreen is Screen.Analytics,
                    onClick = { currentScreen = Screen.Analytics },
                    icon = { Icon(Icons.Default.Analytics, contentDescription = "Analytics") },
                    label = { Text("Analytics") }
                )
                NavigationBarItem(
                    selected = currentScreen is Screen.ApkCheck,
                    onClick = { currentScreen = Screen.ApkCheck },
                    icon = { Icon(Icons.Default.UploadFile, contentDescription = "APK Review") },
                    label = { Text("APK Review") }
                )
            }
        }
    ) { innerPadding ->
        androidx.compose.foundation.layout.Box(modifier = Modifier.padding(innerPadding)) {
            when (val screen = currentScreen) {
                is Screen.Dashboard -> DashboardScreen(
                    viewModel = viewModel,
                    onNavigateToApp = { pkg -> currentScreen = Screen.AppDetail(pkg) },
                    onNavigateToFindings = { currentScreen = Screen.Findings },
                    onNavigateToHistory = { currentScreen = Screen.History },
                    onNavigateToSettings = { currentScreen = Screen.Settings }
                )
                is Screen.InstalledApps -> AppListScreen(
                    viewModel = viewModel,
                    onAppClick = { pkg -> currentScreen = Screen.AppDetail(pkg) }
                )
                is Screen.AppDetail -> AppDetailScreen(
                    packageName = screen.packageName,
                    viewModel = viewModel,
                    onBack = { currentScreen = Screen.InstalledApps }
                )
                is Screen.Findings -> FindingsScreen(
                    viewModel = viewModel,
                    onAppClick = { pkg -> currentScreen = Screen.AppDetail(pkg) }
                )
                is Screen.Analytics -> AnalyticsScreen(viewModel = viewModel)
                is Screen.ApkCheck -> ApkCheckScreen(viewModel = viewModel)
                is Screen.History -> HistoryScreen(
                    viewModel = viewModel,
                    onBack = { currentScreen = Screen.Dashboard }
                )
                is Screen.Settings -> SettingsScreen(
                    viewModel = viewModel,
                    onBack = { currentScreen = Screen.Dashboard }
                )
            }
        }
    }
}
