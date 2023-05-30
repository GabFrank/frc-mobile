import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.system.frc',
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
    }
	}
};

export default config;
