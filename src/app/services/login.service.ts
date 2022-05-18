import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { serverAdress } from 'src/environments/environment';
import { Usuario } from '../domains/personas/usuario.model';
import { MainService } from './main.service';
import { UsuarioService } from './usuario.service';

export interface LoginResponse {
  usuario?: Usuario;
  error?: HttpErrorResponse;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  usuarioActual: Usuario;
  httpOptions = {
    headers: new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
  };

  constructor(
    private http: HttpClient,
    private usuarioService: UsuarioService,
    private mainService: MainService,
    private notificacionService: NotificacionService
  ) {}

  isAuthenticated(): Observable<Usuario> {
    return new Observable((obs) => {
      let isToken = localStorage.getItem('token');
      let id = localStorage.getItem('usuarioId');
      if (isToken != null && id != null) {
        this.usuarioService
          .onGetUsuario(+id)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res) {
              this.usuarioActual = res;
              this.mainService.usuarioActual = this.usuarioActual;
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

  login(nickname, password): Observable<LoginResponse> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: nickname,
        password: password,
      };
      let httpResponse = this.http
        .post(
          `http://${serverAdress.serverIp}:${serverAdress.serverPort}/login`,
          httpBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            if (res['token'] != null) {
              localStorage.setItem('token', res['token']);
              setTimeout(() => {
                if (res['usuarioId'] != null) {
                  localStorage.setItem('usuarioId', res['usuarioId']);
                  this.usuarioService
                    .onGetUsuario(res['usuarioId'])
                    .subscribe((res) => {
                      if (res?.id != null) {
                        let response: LoginResponse = {
                          usuario: res,
                          error: null,
                        };
                        this.usuarioActual = res;
                        this.mainService.usuarioActual = this.usuarioActual;
                        obs.next(response);
                      } else {
                      }
                    });
                }
              }, 500);
            }
          },
          (error) => {
            let response: LoginResponse = {
              usuario: null,
              error: error,
            };
            obs.next(error);
            this.notificacionService.open(error['message'], TipoNotificacion.DANGER, 10)
          }
        );
    });
  }

  logOut() {
    localStorage.setItem('token', null);
    localStorage.setItem('usuarioId', null);
    this.usuarioActual = null;
    window.location.href = ''
  }
}
