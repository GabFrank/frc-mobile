import { Injectable, isDevMode } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { Usuario } from '../domains/personas/usuario.model';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class MainService {

  usuarioActual: Usuario;

  isDev = false;

  authenticationSub = new BehaviorSubject<boolean>(null);

  constructor() {
    this.isDev = isDevMode();
   }

  async load() {

  }
}
