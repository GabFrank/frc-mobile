import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { pedidoRecepcionProductoPorRecepcionMercaderiaAndProductoQuery } from './graphql-query';
import { PedidoRecepcionProductoDto } from '../../nota-recepcion/nota-recepcion-agrupada/pedido-recepcion-producto-dto.model';

export interface Response {
  data: PedidoRecepcionProductoDto;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoRecepcionProductoPorRecepcionMercaderiaAndProductoGQL extends Query<Response> {
  document = pedidoRecepcionProductoPorRecepcionMercaderiaAndProductoQuery;
}
