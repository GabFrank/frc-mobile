import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteDevolucionItemMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteDevolucionItemGQL extends Mutation<Response> {
  document = deleteDevolucionItemMutation;
}
