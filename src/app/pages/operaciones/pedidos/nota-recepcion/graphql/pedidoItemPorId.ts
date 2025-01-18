import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { pedidoItemQuery } from '../../pedido-item/graphql/graphql-query';
import { PedidoItem } from '../../pedido-item/pedido-item.model';

export interface Response {
  data: PedidoItem;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItemPorIdGQL extends Query<Response> {
  document = pedidoItemQuery;
}
