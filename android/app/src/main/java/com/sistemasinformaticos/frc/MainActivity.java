package com.sistemasinformaticos.frc;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.sistemasinformaticos.frc.plugins.NativeLocationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeLocationPlugin.class);
        super.onCreate(savedInstanceState);
        createDefaultNotificationChannel();
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
