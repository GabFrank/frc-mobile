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
import { Router } from '@angular/router';
import { NotificacionService as NotificacionesUsuarioService } from '../pages/notificaciones/notificacion.service';
import { GenericCrudService } from '../generic/generic-crud.service';
import { ActualizarTokenFcmGQL } from '../graphql/personas/usuario/graphql/actualizarTokenFcm';
import { SaveInicioSesionGQL } from '../graphql/personas/usuario/graphql/saveInicioSesion';
import { TipoDispositivo } from '../domains/configuracion/enums/tipo-dispositivo.model';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private syncingToken = false;

  constructor(
    private plf: Platform,
    private mainService: MainService,
    private router: Router,
    private notificacionesUsuarioService: NotificacionesUsuarioService,
    private genericService: GenericCrudService,
    private actualizarTokenFcmGQL: ActualizarTokenFcmGQL,
    private saveInicioSesionGQL: SaveInicioSesionGQL
  ) {
    this.mainService.authenticationSub.subscribe((auth) => {
      if (auth) {
        void this.syncTokenToBackend();
      }
    });
  }

  initPush() {
    if (!this.plf.platforms().includes('mobileweb')) {
      this.registerPush();

      FCM.subscribeTo({ topic: 'funcionarios' })
        .then(() => console.log('Subscribed to funcionarios'))
        .catch((err) => console.error('Subscription failed: funcionarios', err));

      FCM.subscribeTo({ topic: 'clientes' })
        .then(() => console.log('Subscribed to clientes'))
        .catch((err) => console.error('Subscription failed: clientes', err));

      void this.refreshFcmToken();
    }
  }

  async syncTokenToBackend(): Promise<void> {
    if (this.syncingToken || this.plf.platforms().includes('mobileweb')) {
      return;
    }
    if (!localStorage.getItem('token')) {
      return;
    }

    this.syncingToken = true;
    try {
      const fcmToken = await this.refreshFcmToken();
      if (!fcmToken) {
        return;
      }

      const usuario = this.mainService.usuarioActual;
      const deviceId = localStorage.getItem('deviceId');

      await this.runMutation(
        this.genericService.onCustomSave(
          this.actualizarTokenFcmGQL,
          { tokenFcm: fcmToken, idDispositivo: deviceId },
          false
        )
      );

      if (usuario?.inicioSesion?.id) {
        const inicioSesionInput = {
          id: usuario.inicioSesion.id,
          usuarioId: usuario.id,
          sucursalId: usuario.inicioSesion.sucursal?.id,
          idDispositivo: usuario.inicioSesion.idDispositivo ?? deviceId,
          tipoDespositivo:
            usuario.inicioSesion.tipoDespositivo ??
            (this.plf.is('ios') ? TipoDispositivo.IOS : TipoDispositivo.ANDROID),
          token: fcmToken
        };

        const sesionActualizada = await this.runMutation(
          this.genericService.onCustomSave(
            this.saveInicioSesionGQL,
            { entity: inicioSesionInput },
            false
          )
        );
        usuario.inicioSesion = sesionActualizada;
      }
    } catch (err) {
      console.error('Failed to sync push token in backend', err);
    } finally {
      this.syncingToken = false;
    }
  }

  private runMutation<T>(observablePromise: Promise<import('rxjs').Observable<T>>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        const observable = await observablePromise;
        observable.subscribe({
          next: (value) => resolve(value),
          error: (err) => reject(err)
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private async refreshFcmToken(): Promise<string | null> {
    try {
      const result = await FCM.getToken();
      const token = result?.token;
      if (!token) {
        return null;
      }
      localStorage.setItem('pushToken', token);
      this.mainService.setPushToken(token);
      return token;
    } catch (err) {
      console.error('Failed to obtain FCM token', err);
      return localStorage.getItem('pushToken');
    }
  }

  private async registerPush() {
    console.log('Initializing Push Notifications');

    const permissionResult = await PushNotifications.requestPermissions();

    if (permissionResult.receive === 'granted') {
      await PushNotifications.register();
      console.log('Push Notifications permission granted');
    } else {
      console.warn('Push Notifications permission denied');
      return;
    }

    PushNotifications.addListener('registration', (_token: Token) => {
      void this.syncTokenToBackend();
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received: ' + JSON.stringify(notification));
        this.notificacionesUsuarioService.refrescarConteoNoLeidas();
      }
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        if (notification.notification.data?.path) {
          this.navigateTo(notification.notification.data.path);
        }
      }
    );
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
        attempts--;
      }
    }, 1000);
  }
}
