# Keep the widget provider visible to the launcher picker in release builds.
-keep class io.github.madobeno.twa.SakuraWidgetProvider { <init>(); *; }
-keepnames class io.github.madobeno.twa.SakuraWidgetProvider
-keep class * extends android.appwidget.AppWidgetProvider { <init>(); *; }
-keep class * extends android.content.BroadcastReceiver { <init>(); }
-keep class io.github.madobeno.twa.LauncherActivity { <init>(); *; }
