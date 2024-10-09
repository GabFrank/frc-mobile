import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token
} from '@capacitor/push-notifications';

import { FCM } from '@capacitor-community/fcm';
import { MainService } from './main.service';
import { UsuarioService } from './usuario.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  constructor(
    private plf: Platform,
    private mainService: MainService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  initPush() {
    if (!this.plf.platforms().includes('mobileweb')) {
      this.registerPush();

      FCM.subscribeTo({ topic: 'funcionarios' })
        .then(() => console.log('Subscribed to funcionarios'))
        .catch((err) => console.error('Subscription failed: funcionarios', err));

      FCM.subscribeTo({ topic: 'clientes' })
        .then(() => console.log('Subscribed to clientes'))
        .catch((err) => console.error('Subscription failed: clientes', err));

      FCM.getToken().then((t) => {
        localStorage.setItem('pushToken', t.token);
        console.log('FCM Token:', t.token);
      });
    }
  }

  private async registerPush() {
    console.log('Initializing Push Notifications');

    // Request permission for push notifications
    const permissionResult = await PushNotifications.requestPermissions();

    if (permissionResult.receive === 'granted') {
      // Permission granted, register for push notifications
      await PushNotifications.register();
      console.log('Push Notifications permission granted');
    } else {
      console.warn('Push Notifications permission denied');
      // You may want to guide users to enable notifications in settings
      return;
    }

    // Push registration listener
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      // You might want to send the token to your backend
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Handle push notifications received while the app is open
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ' + JSON.stringify(notification));
      // You can show a toast or local notification here if needed
    });

    // Handle when a push notification is tapped by the user
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(notification));

      // Handling navigation upon push action
      if (notification.notification.data?.path) {
        this.navigateTo(notification.notification.data.path);
      }
    });
  }

  private navigateTo(path: string) {
    let attempts = 5;
    const interval = setInterval(() => {
      if (attempts === 0) {
        clearInterval(interval);
      } else if (this.mainService.usuarioActual) {
        console.log('Navigating to:', path);
        this.router.navigate([path]);
        clearInterval(interval);
      } else {
        console.log('User not available yet, retrying...');
        attempts--;
      }
    }, 1000);
  }
}
// export class PushNotificationsService {
//   constructor(
//     private plf: Platform,
//     private mainService: MainService,
//     private usuarioService: UsuarioService,
//     private router: Router
//   ) {}

//   initPush() {
//     if (!this.plf.platforms().includes('mobileweb')) {
//       this.registerPush();
//       FCM.subscribeTo({ topic: 'funcionarios' })
//         .then((r) => console.log('sub con exito a funcionarios'))
//         .catch((err) =>
//           console.log(err, 'ocurrio un problemma al sub en funcionario')
//         );
//       FCM.subscribeTo({ topic: 'clientes' })
//         .then((r) => console.log('sub con exito a clientes'))
//         .catch((err) =>
//           console.log(err, 'ocurrio un problemma al sub en funcionario')
//         );

//       FCM.getToken().then((t) => {
//         localStorage.setItem('pushToken', t.token);
//         console.log(t.token);
//       });
//     }
//   }

//   private async registerPush() {
//     console.log('Initializing HomePage');

//     // Request permission to use push notifications
//     // iOS will prompt user and return if they granted permission or not
//     // Android will just grant without prompting
//     await PushNotifications.requestPermissions().then(async (result) => {
//       if (result.receive === 'granted') {
//         // Register with Apple / Google to receive push via APNS/FCM
//         await PushNotifications.register();
//       } else {
//         // Show some error
//       }
//     });

//     // On success, we should be able to receive notifications
//     PushNotifications.addListener('registration', async (token: Token) => {
//       console.log('Push registration success, token: ' + token.value);
//     });

//     // Some issue with our setup and push will not work
//     PushNotifications.addListener('registrationError', (error: any) => {
//       console.log('Error on registration: ' + JSON.stringify(error));
//     });

//     // Show us the notification payload if the app is open on our device
//     PushNotifications.addListener(
//       'pushNotificationReceived',
//       (notification: PushNotificationSchema) => {
//         console.log('Push received: ' + JSON.stringify(notification));
//       }
//     );

//     // Method called when tapping on a notification
//     PushNotifications.addListener(
//       'pushNotificationActionPerformed',
//       (notification: ActionPerformed) => {
//         console.log('Push action performed: ' + JSON.stringify(notification));
//         let time = null;
//         let attemps = 5;
//         if (notification.notification.data?.path != null) {
//           time = setInterval(() => {
//             if (attemps == 0) clearInterval(time);
//             if (this.mainService.usuarioActual != null) {
//               console.log('usuario actual existe');
//               this.router.navigate([notification.notification.data?.path]);
//               clearInterval(time);
//             } else {
//               console.log('usuario actual no existe');
//               attemps--;
//             }
//           }, 1000);
//         }
//       }
//     );
//   }
// }
