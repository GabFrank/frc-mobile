import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sistemasinformaticos.frc',
  appName: 'Bodega Franco',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    'cleartext': true
  },
  plugins: {
		CapacitorUpdater: {
			autoUpdate: true
		},
    Camera: {
      "androidSource": "both"
    },
    Filesystem: {
      "androidStorage": "external"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      "backgroundColor": "#b40000",
      "launchAutoHide": true,
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    }
	}
};

export default config;
