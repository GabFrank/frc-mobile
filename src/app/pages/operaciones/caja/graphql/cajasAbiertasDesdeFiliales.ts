import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajasAbiertasDesdeFilialesQuery } from './graphql-query';

export interface Response {
  data: PdvCaja[];
}

@Injectable({
  providedIn: 'root',
})
export class CajasAbiertasDesdeFilialesGQL extends Query<Response> {
  document = cajasAbiertasDesdeFilialesQuery;
}
