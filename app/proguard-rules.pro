# Keep the home-screen widget provider and the launcher activity it targets.
-keep class io.github.madobeno.twa.SakuraWidgetProvider { <init>(); *; }
-keepnames class io.github.madobeno.twa.SakuraWidgetProvider
-keep class * extends android.appwidget.AppWidgetProvider { <init>(); *; }
-keep class * extends android.content.BroadcastReceiver { <init>(); }
-keep class io.github.madobeno.twa.LauncherActivity { <init>(); *; }
