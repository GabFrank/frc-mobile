import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { pedidoRecepcionProductoPorRecepcionMercaderiaQuery } from './graphql-query';
import { PageInfo } from 'src/app/app.component';
import { PedidoRecepcionProductoDto } from '../../nota-recepcion/nota-recepcion-agrupada/pedido-recepcion-producto-dto.model';

export interface Response {
  data: PageInfo<PedidoRecepcionProductoDto>;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoRecepcionProductoPorRecepcionMercaderiaGQL extends Query<Response> {
  document = pedidoRecepcionProductoPorRecepcionMercaderiaQuery;
}
