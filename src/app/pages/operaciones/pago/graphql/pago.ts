import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Pago } from '../pago.model';
import { pagoQuery } from './graphql-query';

export interface Response {
  data: Pago;
}

@Injectable({
  providedIn: 'root',
})
export class PagoGQL extends Query<Response> {
  document = pagoQuery;
} 