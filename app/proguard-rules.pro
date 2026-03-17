# Keep the app widget provider and its launcher entry points in release builds.
-keep class io.github.madobeno.twa.SakuraWidgetProvider { <init>(); *; }
-keepnames class io.github.madobeno.twa.SakuraWidgetProvider
-keep class * extends android.appwidget.AppWidgetProvider { <init>(); *; }

# The widget launches the TWA via LauncherActivity extra lookup.
-keep class io.github.madobeno.twa.LauncherActivity { <init>(); *; }
