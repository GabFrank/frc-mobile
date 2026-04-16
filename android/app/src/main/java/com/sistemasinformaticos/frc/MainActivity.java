package com.sistemasinformaticos.frc;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.sistemasinformaticos.frc.plugins.NativeLocationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeLocationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
