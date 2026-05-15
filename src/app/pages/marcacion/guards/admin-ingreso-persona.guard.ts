import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { MainService } from 'src/app/services/main.service';

@Injectable({ providedIn: 'root' })
export class AdminIngresoPersonaGuard implements CanActivate {

  constructor(
    private mainService: MainService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const isAdmin = this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN';
    const qUsuarioId = route.queryParamMap.get('usuarioId');
    if (isAdmin && !qUsuarioId) {
      return this.router.createUrlTree(['/marcacion/ingreso-persona']);
    }
    return true;
  }
}
