import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deletePedidoItemQuery } from './graphql-query';


interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeletePedidoItemGQL extends Mutation<Response> {
  document = deletePedidoItemQuery;
}
