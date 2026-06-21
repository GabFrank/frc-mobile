import { Router } from '@angular/router';
import {
  NotificacionService,
  TipoNotificacion
} from 'src/app/services/notificacion.service';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { Usuario } from '../domains/personas/usuario.model';
import { MainService } from './main.service';
import { UsuarioService } from './usuario.service';
import { CambiarContrasenhaDialogComponent } from '../dialog/login/cambiar-contrasenha-dialog/cambiar-contrasenha-dialog.component';
import { PopOverService, PopoverSize } from './pop-over.service';
import { CargandoService } from './cargando.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { InicioSesion } from '../domains/configuracion/inicio-sesion.model';
import { TipoDispositivo } from '../domains/configuracion/enums/tipo-dispositivo.model';
import { generateUUID } from '../generic/utils/string-utils';
import { MarcacionService } from '../pages/marcacion/marcar-horario/service/marcacion.service';
import { PushNotificationsService } from './push-notifications.service';

export interface LoginResponse {
  usuario?: Usuario;
  error?: HttpErrorResponse;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly marcacionService = inject(MarcacionService);
  private readonly pushNotificationsService = inject(PushNotificationsService);

  usuarioActual: Usuario;
  pushToken = null;
  httpOptions = {
    headers: new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    private usuarioService: UsuarioService,
    private mainService: MainService,
    private notificacionService: NotificacionService,
    private router: Router,
    private popverService: PopOverService,
    private cargandoService: CargandoService,
    private deviceDetector: DeviceDetectorService
  ) {
    this.mainService.pushToken$.subscribe((token) => {
      this.pushToken = token;
    });
  }

  isAuthenticated(): Observable<Usuario> {
    return new Observable((obs) => {
      let isToken = localStorage.getItem('token');
      let id = localStorage.getItem('usuarioId');
      if (id != null) {
        this.usuarioService
          .onGetUsuario(+id)
          .pipe(untilDestroyed(this))
          .subscribe(async (res) => {
            if (res) {
              this.mainService.sucursalActual = res['sucursal'];
              this.usuarioActual = res;
              this.mainService.usuarioActual = this.usuarioActual;
              console.log(res);

              this.mainService.authenticationSub.next(true);
              obs.next(res);
            } else {
              obs.next(null);
            }
          });
      } else {
        obs.next(null);
      }
    });
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (deviceId == null) {
      const uuid = generateUUID();
      localStorage.setItem('deviceId', uuid);
      deviceId = uuid;
    }
    return deviceId;
  }

  private resolveTipoDispositivo(): TipoDispositivo {
    return this.deviceDetector.os === 'iOS'
      ? TipoDispositivo.IOS
      : TipoDispositivo.ANDROID;
  }

  private async registrarSesionActiva(usuario: Usuario): Promise<void> {
    const deviceId = this.getOrCreateDeviceId();
    const inicioSesion = new InicioSesion();
    inicioSesion.usuario = usuario;
    inicioSesion.sucursal = this.mainService?.sucursalActual;
    inicioSesion.idDispositivo = deviceId;
    inicioSesion.token = localStorage.getItem('pushToken');
    inicioSesion.tipoDespositivo = this.resolveTipoDispositivo();
    inicioSesion.creadoEn = new Date();

    const sesionExistente = usuario?.inicioSesion;
    if (sesionExistente?.idDispositivo === deviceId && sesionExistente?.id) {
      inicioSesion.id = sesionExistente.id;
      inicioSesion.horaInicio = sesionExistente.horaInicio
        ? new Date(sesionExistente.horaInicio)
        : new Date();
    } else {
      inicioSesion.horaInicio = new Date();
    }

    (
      await this.usuarioService.onSaveInicioSesion(inicioSesion.toInput())
    ).subscribe(async (res) => {
      this.mainService.usuarioActual.inicioSesion = res;
      await this.pushNotificationsService.syncTokenToBackend();
    });
  }

  async cerrarSesionActiva(): Promise<void> {
    const sesionActual = this.mainService.usuarioActual?.inicioSesion;
    if (!sesionActual?.id || !sesionActual?.sucursal) {
      return;
    }

    const inicioSesion = new InicioSesion();
    Object.assign(inicioSesion, sesionActual);
    inicioSesion.horaFin = new Date();
    inicioSesion.token = null;

    return new Promise(async (resolve) => {
      (
        await this.usuarioService.onSaveInicioSesion(inicioSesion.toInput())
      ).subscribe({
        next: () => resolve(),
        error: () => resolve()
      });
    });
  }

  async login(nickname, password): Promise<Observable<LoginResponse>> {
    let loading = await this.cargandoService.open('Entrando al sistema....');
    return new Observable((obs) => {
      let httpBody = {
        nickname: nickname,
        password: password
      };
      let httpResponse = this.http
        .post(
          `http://${localStorage.getItem('serverIp')}:${localStorage.getItem(
            'serverPort'
          )}/login`,
          httpBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            this.cargandoService.close(loading);
            if (res['token'] != null) {
              localStorage.setItem('token', res['token']);
              this.mainService.sucursalActual = res['sucursal'];
              if (res['usuarioId'] != null) {
                localStorage.setItem('usuarioId', res['usuarioId']);
                this.usuarioService
                  .onGetUsuario(res['usuarioId'])
                  .subscribe(async (res) => {
                    if (res?.id != null) {
                      let response: LoginResponse = {
                        usuario: res,
                        error: null
                      };
                      this.usuarioActual = res;
                      this.mainService.usuarioActual = this.usuarioActual;
                      this.mainService.authenticationSub.next(true);
                      await this.registrarSesionActiva(res);

                      if (password == '123') {
                        this.popverService
                          .open(
                            CambiarContrasenhaDialogComponent,
                            this.usuarioActual,
                            PopoverSize.XS
                          )
                          .then((res2) => {
                            if (res2?.data?.id != null) {
                              response.usuario = res2.data;
                              this.usuarioActual = res2.data;
                              window.location.reload();
                            } else {
                              obs.next(response);
                            }
                          });
                      } else {
                        obs.next(response);
                      }
                    } else {
                    }
                  });
              }
            }
          },
          (error) => {
            this.cargandoService.close(loading);
            let response: LoginResponse = {
              usuario: null,
              error: error
            };
            obs.next(error);
          }
        );
    });
  }

  async logOut(): Promise<void> {
    await this.cerrarSesionActiva();
    localStorage.setItem('token', null);
    localStorage.setItem('usuarioId', null);
    this.marcacionService.limpiarSucursalPersistida();
    sessionStorage.setItem('justLoggedOut', 'true');
    this.usuarioActual = null;
    this.mainService.usuarioActual = null;
    this.mainService.authenticationSub.next(false);
    this.router.navigate(['']);
  }

  async biometricLogin(
    biometricToken: string
  ): Promise<Observable<LoginResponse>> {
    return new Observable((obs) => {
      const httpBody = {
        biometricToken,
        idDispositivo: this.getOrCreateDeviceId()
      };

      this.http
        .post(
          `http://${localStorage.getItem('serverIp')}:${localStorage.getItem(
            'serverPort'
          )}/login/biometric`,
          httpBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          async (res) => {
            if (res['token'] != null && res['usuarioId'] != null) {
              localStorage.setItem('token', res['token']);
              localStorage.setItem('usuarioId', res['usuarioId']);
              this.mainService.sucursalActual = res['sucursal'];

              this.usuarioService
                .onGetUsuario(res['usuarioId'])
                .pipe(untilDestroyed(this))
                .subscribe(async (usuarioRes) => {
                  if (usuarioRes?.id != null) {
                    this.usuarioActual = usuarioRes;
                    this.mainService.usuarioActual = this.usuarioActual;
                    this.mainService.authenticationSub.next(true);
                    await this.registrarSesionActiva(usuarioRes);
                    obs.next({ usuario: usuarioRes, error: null });
                  } else {
                    obs.next({ usuario: null, error: null });
                  }
                });
            } else {
              obs.next({ usuario: null, error: null });
            }
          },
          (error) => {
            obs.next({ usuario: null, error });
          }
        );
    });
  }

  async getBiometricOwnerUserId(): Promise<number | null> {
    return new Promise((resolve) => {
      this.http
        .get<number>(
          `http://${localStorage.getItem('serverIp')}:${localStorage.getItem(
            'serverPort'
          )}/login/biometric-owner/${this.getOrCreateDeviceId()}`,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => resolve(res),
          () => resolve(null)
        );
    });
  }
}
