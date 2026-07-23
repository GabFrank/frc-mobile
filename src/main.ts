import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import 'hammerjs'
// CapacitorUpdater.notifyAppReady()
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import { environment } from './environments/environment';
import { App } from '@capacitor/app'
// import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { SplashScreen } from '@capacitor/splash-screen'
import { Preferences } from '@capacitor/preferences';
if (environment.production) {
  enableProdMode();
}

// IMPORTANTE: app.module.ts lee localStorage.getItem('serverIp') a nivel de
// modulo (fuera de cualquier clase) y resetea al default si es null/''/'null'.
// El WebView de Android puede evictar localStorage, perdiendo la config de
// servidor guardada por el usuario. Por eso restauramos desde
// @capacitor/preferences (almacenamiento nativo no-evictable) ANTES de
// bootstrapear Angular. Un import estatico de AppModule se ejecutaria antes
// de este restore, asi que el import tiene que ser dinamico.
(async () => {
  try {
    for (const key of ['serverIp', 'serverPort']) {
      const actual = localStorage.getItem(key);
      if (actual === null || actual === '' || actual === 'null') {
        const { value } = await Preferences.get({ key });
        if (value) {
          localStorage.setItem(key, value);
        }
      }
    }
  } catch (e) {
    console.error('No se pudo restaurar config de servidor', e);
  }

  const { AppModule } = await import('./app/app.module');
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
})();

defineCustomElements(window);

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
