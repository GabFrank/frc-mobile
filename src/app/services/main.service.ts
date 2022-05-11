import { Injectable } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { LoginComponent } from '../dialog/login/login.component';
import { Usuario } from '../domains/personas/usuario.model';
import { LoginService } from './login.service';
import { UsuarioService } from './usuario.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class MainService {

  usuarioActual: Usuario;

  authenticationSub = new BehaviorSubject<boolean>(null);

  constructor() { }

  async load() {
    // console.log('Iniciando app');
    // console.log('Verificando autenticacion');
    // this.loginService
    //   .isAuthenticated()
    //   .pipe(untilDestroyed(this))
    //   .subscribe(async (res) => {
    //     if (res != null) {
    //       console.log('Usuario encontrado: ' + res?.persona?.nombre);
    //       this.usuarioActual = res;
    //       this.authenticationSub.next(true);
    //     } else {
    //       console.log('Usuario no encontrado');
    //       this.authenticationSub.next(false);
    //     }
    //   });
  }
}
