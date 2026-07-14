import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { VentaTarjetaService } from '../venta-tarjeta.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';

@Injectable({ providedIn: 'root' })
export class VentaTarjetaHabilitadaGuard implements CanActivate {

  constructor(
    private ventaTarjetaService: VentaTarjetaService,
    private router: Router,
    private notificacionService: NotificacionService
  ) { }

  canActivate(): Observable<boolean | UrlTree> {
    return this.ventaTarjetaService.onGetConfiguracionHabilitada().pipe(
      map(habilitado => {
        if (!habilitado) {
          this.notificacionService.open(
            'La venta con tarjeta no está habilitada actualmente.',
            TipoNotificacion.DANGER,
            3
          );
          return this.router.createUrlTree(['/operaciones']);
        }
        return true;
      }),
      catchError(() => of(this.router.createUrlTree(['/operaciones'])))
    );
  }
}
