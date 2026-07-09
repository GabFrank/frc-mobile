package com.sistemasinformaticos.frc;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.sistemasinformaticos.frc.plugins.NativeLocationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeLocationPlugin.class);
        super.onCreate(savedInstanceState);
        createDefaultNotificationChannel();
        configureNavigationBar();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Reaplicar por si el splash/transicion reseteo el color de la nav bar
        configureNavigationBar();
    }

    /** Fuerza la barra de navegacion inferior a negro con iconos claros. */
    private void configureNavigationBar() {
        getWindow().setNavigationBarColor(Color.BLACK);
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightNavigationBars(false);
        }
    }

    private void createDefaultNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
            "fcm_default_channel",
            "Notificaciones",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Notificaciones del sistema FRC");
        channel.enableVibration(true);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }
}
