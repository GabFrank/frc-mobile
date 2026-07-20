import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
      .pipe(map(res => res.data?.['data'] ?? []));
  }

  onCountSinRegistrar(cajaId: number, sucId: number): Observable<number> {
    return this.countVentasTarjetaSinRegistrarGQL
      .fetch({ id: cajaId, sucId }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(map(res => res.data?.['data'] ?? 0));
  }
}
