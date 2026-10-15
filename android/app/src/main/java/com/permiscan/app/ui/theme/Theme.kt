package com.permiscan.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Modern Light Palette
val AppBg = Color(0xFFF8F9FA)
val AppSurface = Color(0xFFFFFFFF)
val AppSurfaceVariant = Color(0xFFF1F5F9)
val AppBorder = Color(0xFFE2E8F0)
val PrimaryBlue = Color(0xFF1A73E8)
val PrimaryBlueHover = Color(0xFF1557B0)
val PrimaryContainer = Color(0xFFE8F0FE)
val StatusGreen = Color(0xFF0F9D58)
val StatusAmber = Color(0xFFD97706)
val StatusRed = Color(0xFFDC2626)
val TextPrimary = Color(0xFF0F172A)
val TextSecondary = Color(0xFF475569)
val TextMuted = Color(0xFF94A3B8)

// Backward-compatible alias mappings to light theme
val CyberBg = AppBg
val CyberSurface = AppSurface
val CyberSurfaceVariant = AppSurfaceVariant
val CyberBorder = AppBorder
val CyberGreen = StatusGreen
val CyberCyan = PrimaryBlue
val CyberAmber = StatusAmber
val CyberRed = StatusRed
val CyberTextPrimary = TextPrimary
val CyberTextSecondary = TextSecondary

private val ModernLightColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    onPrimary = Color.White,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = PrimaryBlueHover,
    secondary = StatusGreen,
    onSecondary = Color.White,
    tertiary = StatusAmber,
    error = StatusRed,
    background = AppBg,
    surface = AppSurface,
    surfaceVariant = AppSurfaceVariant,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    outline = AppBorder
)

@Composable
fun PermiScanTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = ModernLightColorScheme,
        content = content
    )
}
