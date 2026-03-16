package io.github.madobeno.twa;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class SakuraWidgetProvider extends AppWidgetProvider {
    private static final String WIDGET_LAUNCH_PATH = "/SAKURA-AME/";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, buildRemoteViews(context));
        }
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        refreshAll(context);
    }

    static void refreshAll(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, SakuraWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);
        for (int appWidgetId : appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, buildRemoteViews(context));
        }
    }

    private static RemoteViews buildRemoteViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_sakura_2x1);
        views.setOnClickPendingIntent(R.id.widget_root, createLaunchPendingIntent(context));
        return views;
    }

    private static PendingIntent createLaunchPendingIntent(Context context) {
        Intent intent = new Intent(context, LauncherActivity.class);
        intent.putExtra(LauncherActivity.EXTRA_LAUNCH_PATH, WIDGET_LAUNCH_PATH);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        return PendingIntent.getActivity(
                context,
                2001,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
