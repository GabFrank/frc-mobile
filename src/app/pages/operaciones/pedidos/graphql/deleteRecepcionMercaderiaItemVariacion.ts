import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteRecepcionMercaderiaItemVariacion } from '../recepcion-mercaderia-item-variacion/graphql/graphql-query';

export interface DeleteRecepcionMercaderiaItemVariacionResponse {
  data: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeleteRecepcionMercaderiaItemVariacionMutation extends Mutation<DeleteRecepcionMercaderiaItemVariacionResponse> {
  override document = deleteRecepcionMercaderiaItemVariacion;
}
