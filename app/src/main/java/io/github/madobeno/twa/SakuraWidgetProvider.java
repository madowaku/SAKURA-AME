package io.github.madobeno.twa;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import java.util.Random;

public class SakuraWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Construct the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        
        // Retrieve quotes array and pick a random quote
        String[] quotes = context.getResources().getStringArray(R.array.serene_quotes);
        String randomQuote = quotes[new Random().nextInt(quotes.length)];
        views.setTextViewText(R.id.widget_quote_text, randomQuote);

        // Create an Intent to launch LauncherActivity
        Intent intent = new Intent(context, LauncherActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Attach the click listener to the widget's root layout
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
