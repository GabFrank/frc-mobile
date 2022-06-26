import { Router } from '@angular/router';
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
import { ModalService } from './modal.service';
import { CambiarContrasenhaDialogComponent } from '../dialog/login/cambiar-contrasenha-dialog/cambiar-contrasenha-dialog.component';
import { PopOverService, PopoverSize } from './pop-over.service';
import { CargandoService } from './cargando.service';

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
    private notificacionService: NotificacionService,
    private router: Router,
    private popverService: PopOverService,
    private cargandoService: CargandoService
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

  async login(nickname, password): Promise<Observable<LoginResponse>> {
    let loading = await this.cargandoService.open("Entrando al sistema....")
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
            this.cargandoService.close(loading)
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
                        if(password=='123'){
                          this.popverService.open(CambiarContrasenhaDialogComponent, this.usuarioActual, PopoverSize.XS).then(res2 => {
                            if(res2!=null){
                              response.usuario = res2;
                              this.usuarioActual = res2;
                              obs.next(response);
                            }
                          })
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
            this.cargandoService.close(loading)
            let response: LoginResponse = {
              usuario: null,
              error: error,
            };
            obs.next(error);
          }
        );
    });
  }

  logOut() {
    localStorage.setItem('token', null);
    localStorage.setItem('usuarioId', null);
    this.usuarioActual = null;
    this.router.navigate([''])
  }
}
