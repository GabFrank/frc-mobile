import { Injectable, isDevMode } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { Usuario } from '../domains/personas/usuario.model';
import { Sucursal } from '../domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from '../domains/empresarial/sucursal/sucursal.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class MainService {

  usuarioActual: Usuario;
  sucursalActual: Sucursal;
  private pushToken = null;
  pushToken$ = new BehaviorSubject<string | null>(null);
  isDev = false;
  authenticationSub = new BehaviorSubject<boolean>(null);

  constructor() {
    this.isDev = isDevMode();
  }

  async load() {
    // ...
  }

  setPushToken(token: string | null): void {
    this.pushToken = token;
    this.pushToken$.next(token);
  }

  getPushToken(): string | null {
    return this.pushToken;
  }
}
