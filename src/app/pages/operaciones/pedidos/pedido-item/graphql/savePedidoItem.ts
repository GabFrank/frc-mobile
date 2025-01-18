import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { savePedidoItem } from './graphql-query';
import { PedidoItem } from '../pedido-item.model';


interface Response {
  data: PedidoItem;
}

@Injectable({
  providedIn: 'root',
})
export class SavePedidoItemGQL extends Mutation<Response> {
  document = savePedidoItem;
}
