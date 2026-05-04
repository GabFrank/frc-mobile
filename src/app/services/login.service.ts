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
import { Injectable } from '@angular/core';
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
import { generateUUID } from '../generic/utils/string-utils';

export interface LoginResponse {
  usuario?: Usuario;
  error?: HttpErrorResponse;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class LoginService {
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
              setTimeout(() => {
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
                        let inicioSesion = new InicioSesion();
                        inicioSesion.usuario = res;
                        inicioSesion.sucursal =
                          this.mainService?.sucursalActual;
                        inicioSesion.horaInicio = new Date();
                        inicioSesion.token = localStorage.getItem('pushToken')
                        inicioSesion.creadoEn = new Date();
                        const deviceId = this.getOrCreateDeviceId();
                        inicioSesion.idDispositivo = deviceId;

                        if (
                          res?.inicioSesion != null &&
                          res?.inicioSesion?.idDispositivo == deviceId &&
                          res?.inicioSesion?.sucursal != null
                        ) {
                          console.log('Dispositivo conocido encontrado');
                        } else {
                          console.log('Nuevo disposito encontrado');
                          (
                            await this.usuarioService.onSaveInicioSesion(
                              inicioSesion.toInput()
                            )
                          ).subscribe((res) => {
                            console.log(res);
                            this.mainService.usuarioActual.inicioSesion = res;
                          });
                        }
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
              }, 500);
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
    let inicioSesion = new InicioSesion();
    Object.assign(inicioSesion, this.mainService.usuarioActual.inicioSesion);
    inicioSesion.horaFin = new Date();
    return new Promise(async (resolve, reject) => {
      if (inicioSesion != null && inicioSesion?.sucursal != null) {
        (
          await this.usuarioService.onSaveInicioSesion(inicioSesion.toInput())
        ).subscribe(
          (res) => {
            localStorage.setItem('token', null);
            localStorage.setItem('usuarioId', null);
            sessionStorage.setItem('justLoggedOut', 'true');
            this.usuarioActual = null;
            this.router.navigate(['']);
            resolve(); // Resolve the Promise
          },
          (error) => {
            console.error('Error:', error);
            reject(error); // Reject the Promise
          }
        );
      } else {
        localStorage.setItem('token', null);
        localStorage.setItem('usuarioId', null);
        sessionStorage.setItem('justLoggedOut', 'true');
        this.usuarioActual = null;
        this.router.navigate(['']);
        resolve(); // Resolve the Promise
      }
    });
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
          (res) => {
            if (res['token'] != null && res['usuarioId'] != null) {
              localStorage.setItem('token', res['token']);
              localStorage.setItem('usuarioId', res['usuarioId']);
              this.mainService.sucursalActual = res['sucursal'];

              this.usuarioService
                .onGetUsuario(res['usuarioId'])
                .pipe(untilDestroyed(this))
                .subscribe((usuarioRes) => {
                  if (usuarioRes?.id != null) {
                    this.usuarioActual = usuarioRes;
                    this.mainService.usuarioActual = this.usuarioActual;
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
