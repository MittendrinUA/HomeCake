package com.mittendrinua.homecake;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: let the WebView extend behind system bars
        // so env(safe-area-inset-top) gets the correct value on all devices
        // including Pixel 10 Pro (Android 15+ forced edge-to-edge)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}


