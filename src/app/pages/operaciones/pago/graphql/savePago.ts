import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Pago } from '../pago.model';
import { savePagoMutation } from './graphql-query';

export interface Response {
  data: Pago;
}

@Injectable({
  providedIn: 'root',
})
export class SavePagoGQL extends Mutation<Response> {
  document = savePagoMutation;
}
