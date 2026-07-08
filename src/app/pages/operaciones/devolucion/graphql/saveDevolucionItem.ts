import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { DevolucionItem } from '../devolucion.model';
import { saveDevolucionItemMutation } from './graphql-query';

export interface Response {
  data: DevolucionItem;
}

@Injectable({
  providedIn: 'root',
})
export class SaveDevolucionItemGQL extends Mutation<Response> {
  document = saveDevolucionItemMutation;
}
