import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { pdvCajaDesdeFilialQuery } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class PdvCajaDesdeFilialGQL extends Query<Response> {
  document = pdvCajaDesdeFilialQuery;
}
