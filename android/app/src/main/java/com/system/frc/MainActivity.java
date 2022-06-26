package com.system.frc;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import com.getcapacitor.community.nativemarket.NativeMarket;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Initializes the bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {
      {
        add(NativeMarket.class);
      }
    });
  }

}
