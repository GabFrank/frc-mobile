import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import 'hammerjs'
// CapacitorUpdater.notifyAppReady()

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { App } from '@capacitor/app'
// import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { SplashScreen } from '@capacitor/splash-screen'
if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

  let version: any;
  // App.addListener('appStateChange', async (state) => {
  //   console.log('appstate change...');

  //     if (state.isActive) {
  //       // Ensure download occurs while the app is active, or download may fail
  //       console.log('bajando nueva version...');
  //       version = await CapacitorUpdater.download({
  //         url: 'https://github.com/GabFrank/frc-mobile/releases/latest/download/www.zip'
  //       })
  //     }

  //     if (!state.isActive && version) {
  //       // Activate the update when the application is sent to background
  //       SplashScreen.show()
  //       try {
  //         await CapacitorUpdater.set(version);
  //         // At this point, the new version should be active, and will need to hide the splash screen
  //       } catch (e) {
  //         SplashScreen.hide() // Hide the splash screen again if something went wrong
  //       }
  //     }
  // })
