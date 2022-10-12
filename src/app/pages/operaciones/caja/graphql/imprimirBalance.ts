import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajaQuery, imprimirBalanceQuery } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirBalanceGQL extends Query<Response> {
  document = imprimirBalanceQuery;
}
