import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Observable } from 'rxjs';
import { notasPendientes, notasPendientesPage, recepcionesVigentes, notasPorRecepcion, recepcionMercaderiaItemsPorRecepcion, recepcionMercaderiaItemsPorRecepcionPaginados, recepcionMercaderiaPorId, findPendienteRecepcionItemPorProducto } from './pedidos-queries.graphql';
import { NotaRecepcion } from '../../../../domains/operaciones/pedido/nota-recepcion.model';
import { RecepcionMercaderiaItem } from '../../../../domains/operaciones/pedido/recepcion-mercaderia-item.model';
import { RecepcionMercaderiaItemsPorRecepcionResponse, RecepcionMercaderiaItemsPorRecepcionPaginadosResponse, FindPendienteRecepcionItemPorProductoResponse } from './pedidos-queries.graphql';
import { RecepcionMercaderiaPorIdResponse } from './pedidos-queries.graphql';


export interface RecepcionMercaderiaNota {
  id: number;
  notaRecepcion: NotaRecepcion;
}

@Injectable({
  providedIn: 'root'
})
export class NotasPendientesQuery extends Query<{ data: NotaRecepcion[] }> {
  override document = notasPendientes;
}

@Injectable({
  providedIn: 'root'
})
export class NotasPendientesPageQuery extends Query<{ data: any }> {
  override document = notasPendientesPage;
}

@Injectable({
  providedIn: 'root'
})
export class RecepcionesVigentesQuery extends Query<{ data: any }> {
  override document = recepcionesVigentes;
}

@Injectable({
  providedIn: 'root'
})
export class NotasPorRecepcionQuery extends Query<{ data: RecepcionMercaderiaNota[] }> {
  override document = notasPorRecepcion;
}

@Injectable({
  providedIn: 'root'
})
export class RecepcionMercaderiaItemsPorRecepcionQuery extends Query<RecepcionMercaderiaItemsPorRecepcionResponse> {
  document = recepcionMercaderiaItemsPorRecepcion;
}

@Injectable({
  providedIn: 'root'
})
export class RecepcionMercaderiaItemsPorRecepcionPaginadosQuery extends Query<RecepcionMercaderiaItemsPorRecepcionPaginadosResponse> {
  document = recepcionMercaderiaItemsPorRecepcionPaginados;
}

@Injectable({
  providedIn: 'root'
})
export class RecepcionMercaderiaPorIdQuery extends Query<RecepcionMercaderiaPorIdResponse> {
  document = recepcionMercaderiaPorId;
}

@Injectable({
  providedIn: 'root'
})
export class FindPendienteRecepcionItemPorProductoQuery extends Query<FindPendienteRecepcionItemPorProductoResponse> {
  document = findPendienteRecepcionItemPorProducto;
}
