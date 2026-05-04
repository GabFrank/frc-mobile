package com.sistemasinformaticos.frc.plugins;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(
    name = "NativeLocation",
    permissions = {
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION }, alias = "location"),
        @Permission(strings = { Manifest.permission.ACCESS_COARSE_LOCATION }, alias = "coarseLocation")
    }
)
public class NativeLocationPlugin extends Plugin {

    private FusedLocationProviderClient fusedClient;
    private LocationCallback activeCallback;

    @Override
    public void load() {
        fusedClient = LocationServices.getFusedLocationProviderClient(getActivity());
    }

    @PluginMethod
    public void getCurrentPosition(PluginCall call) {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            requestAllPermissions(call, "locationPermsCallback");
            return;
        }

        startLocationCollection(call);
    }

    private void startLocationCollection(PluginCall call) {
        int warmupMs = call.getInt("warmupMs", 2000);
        int maxTimeMs = call.getInt("maxTimeMs", 8000);
        double maxAccuracy = call.getDouble("maxAccuracy", 20.0);

        List<Location> readings = new ArrayList<>();
        long startTime = System.currentTimeMillis();
        final boolean[] resolved = { false };

        LocationRequest request = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 500)
            .setMinUpdateIntervalMillis(300)
            .setMaxUpdateDelayMillis(800)
            .setMinUpdateDistanceMeters(0)
            .build();

        activeCallback = new LocationCallback() {
            @Override
            public void onLocationResult(@NonNull LocationResult locationResult) {
                if (resolved[0] || call.isReleased()) return;

                Location loc = locationResult.getLastLocation();
                if (loc == null) return;

                long elapsed = System.currentTimeMillis() - startTime;

                if (elapsed < warmupMs) return;

                if (loc.getAccuracy() <= 80) {
                    readings.add(loc);
                }

                if (loc.getAccuracy() <= maxAccuracy && readings.size() >= 3) {
                    resolved[0] = true;
                    stopAndResolve(call, readings);
                }
            }
        };

        try {
            fusedClient.requestLocationUpdates(request, activeCallback, Looper.getMainLooper());
        } catch (SecurityException e) {
            call.reject("Permiso de ubicación denegado", e);
            return;
        }

        int totalTimeout = warmupMs + maxTimeMs;
        getActivity().getWindow().getDecorView().postDelayed(() -> {
            if (resolved[0] || call.isReleased()) return;
            resolved[0] = true;

            if (!readings.isEmpty()) {
                stopAndResolve(call, readings);
            } else {
                stopUpdates();
                call.reject("No se pudo obtener ubicación. Verifique GPS activo con ubicación precisa.");
            }
        }, totalTimeout);
    }

    private void stopAndResolve(PluginCall call, List<Location> readings) {
        stopUpdates();
        if (call.isReleased()) return;

        List<Location> sorted = new ArrayList<>(readings);
        sorted.sort((a, b) -> Float.compare(a.getAccuracy(), b.getAccuracy()));

        int count = Math.min(sorted.size(), Math.max(3, (int) Math.ceil(sorted.size() * 0.6)));
        List<Location> best = sorted.subList(0, count);

        double sumLat = 0, sumLng = 0, sumAcc = 0;
        for (Location l : best) {
            sumLat += l.getLatitude();
            sumLng += l.getLongitude();
            sumAcc += l.getAccuracy();
        }

        JSObject result = new JSObject();
        result.put("latitude", sumLat / count);
        result.put("longitude", sumLng / count);
        result.put("accuracy", sumAcc / count);
        result.put("readingsUsed", readings.size());
        call.resolve(result);
    }

    private void stopUpdates() {
        if (activeCallback != null && fusedClient != null) {
            fusedClient.removeLocationUpdates(activeCallback);
            activeCallback = null;
        }
    }

    @PluginMethod
    public void locationPermsCallback(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            startLocationCollection(call);
        } else {
            call.reject("Permiso de ubicación denegado");
        }
    }
}
