import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveRecepcionMercaderiaItemMutation } from './graphql-query';
import { RecepcionMercaderiaItem } from '../recepcion-mercaderia-item.model';

export interface Response {
  data: RecepcionMercaderiaItem;
}

@Injectable({
  providedIn: 'root',
})
export class SaveRecepcionMercaderiaItemGQL extends Mutation<Response> {
  document = saveRecepcionMercaderiaItemMutation;
}
