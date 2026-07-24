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
    const cacheado = this.ventaTarjetaService.getHabilitadaCacheada();

    if (cacheado !== null) {
      // Refresco silencioso en segundo plano: actualiza el cache para la
      // próxima navegación, sin bloquear esta.
      this.ventaTarjetaService.onGetConfiguracionHabilitada()
        .pipe(catchError(() => of(null)))
        .subscribe();
      return of(this.resolverDesdeHabilitado(cacheado));
    }

    return this.ventaTarjetaService.onGetConfiguracionHabilitada().pipe(
      map(habilitado => this.resolverDesdeHabilitado(habilitado)),
      catchError(() => of(this.router.createUrlTree(['/operaciones'])))
    );
  }

  private resolverDesdeHabilitado(habilitado: boolean): boolean | UrlTree {
    if (!habilitado) {
      this.notificacionService.open(
        'La venta con tarjeta no está habilitada actualmente.',
        TipoNotificacion.DANGER,
        3
      );
      return this.router.createUrlTree(['/operaciones']);
    }
    return true;
  }
}
