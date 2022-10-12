import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajaPorUsuarioIdAndAbiertoQuery, cajaQuery } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class CajaPorUsuarioIdAndAbiertoGQL extends Query<Response> {
  document = cajaPorUsuarioIdAndAbiertoQuery;
}
