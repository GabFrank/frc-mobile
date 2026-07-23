import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { VentaTarjeta, VentaTarjetaInput } from './venta-tarjeta.model';
import { SaveVentaTarjetaGQL } from './graphql/saveVentaTarjeta';
import { UpdateVentaTarjetaGQL } from './graphql/updateVentaTarjeta';
import { VentasTarjetaPorCajaGQL } from './graphql/ventasTarjetaPorCaja';
import { VentaTarjetaPorVentaIdGQL } from './graphql/ventaTarjetaPorVentaId';
import { VentaTarjetaPorIdGQL } from './graphql/ventaTarjetaPorId';
import { CountVentasTarjetaSinRegistrarGQL } from './graphql/countVentasTarjetaSinRegistrar';
import { GetConfiguracionVentaTarjetaGQL } from './graphql/getConfiguracionVentaTarjeta';

@Injectable({ providedIn: 'root' })
export class VentaTarjetaService {

  /**
   * Cache en memoria de la última lista de ventas con tarjeta traída por caja.
   * Permite renderizar de inmediato (stale-while-revalidate) al reingresar a la
   * pantalla mientras se refresca en segundo plano, evitando el spinner de
   * pantalla completa que generaba el proxy lento central→filial.
   */
  private listaCacheada: { cajaId: number; items: VentaTarjeta[] } | null = null;

  get listaCacheadaActual(): { cajaId: number; items: VentaTarjeta[] } | null {
    return this.listaCacheada;
  }

  constructor(
    private saveVentaTarjetaGQL: SaveVentaTarjetaGQL,
    private updateVentaTarjetaGQL: UpdateVentaTarjetaGQL,
    private ventasTarjetaPorCajaGQL: VentasTarjetaPorCajaGQL,
    private ventaTarjetaPorVentaIdGQL: VentaTarjetaPorVentaIdGQL,
    private ventaTarjetaPorIdGQL: VentaTarjetaPorIdGQL,
    private countVentasTarjetaSinRegistrarGQL: CountVentasTarjetaSinRegistrarGQL,
    private getConfiguracionVentaTarjetaGQL: GetConfiguracionVentaTarjetaGQL
  ) {}

  /**
   * Consulta en vivo (sin cache) si el flujo de venta con tarjeta (escaneo QR +
   * registro) está habilitado globalmente. Configurable desde el desktop.
   */
  onGetConfiguracionHabilitada(): Observable<boolean> {
    return this.getConfiguracionVentaTarjetaGQL
      .fetch({}, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(map(res => res.data?.['data']?.habilitado === true));
  }

  onSave(input: VentaTarjetaInput): Observable<VentaTarjeta> {
    return this.saveVentaTarjetaGQL
      .mutate({ entity: input }, { errorPolicy: 'all' })
      .pipe(map(res => res.data?.['data']));
  }

  onUpdate(input: VentaTarjetaInput): Observable<VentaTarjeta> {
    return this.updateVentaTarjetaGQL
      .mutate({ entity: input }, { errorPolicy: 'all' })
      .pipe(map(res => res.data?.['data']));
  }

  onGetPorId(id: number, sucId: number): Observable<VentaTarjeta> {
    return this.ventaTarjetaPorIdGQL
      .fetch({ id, sucId }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(map(res => res.data?.['data']));
  }

  onGetPorVentaId(ventaId: number, sucId: number): Observable<VentaTarjeta> {
    return this.ventaTarjetaPorVentaIdGQL
      .fetch({ ventaId, sucId }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(map(res => res.data?.['data']));
  }

  onGetPorCaja(cajaId: number, sucId: number): Observable<VentaTarjeta[]> {
    return this.ventasTarjetaPorCajaGQL
      .fetch({ id: cajaId, sucId }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(
        map(res => res.data?.['data'] ?? []),
        tap(items => {
          this.listaCacheada = { cajaId, items };
        })
      );
  }

  onCountSinRegistrar(cajaId: number, sucId: number): Observable<number> {
    return this.countVentasTarjetaSinRegistrarGQL
      .fetch({ id: cajaId, sucId }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(map(res => res.data?.['data'] ?? 0));
  }
}
