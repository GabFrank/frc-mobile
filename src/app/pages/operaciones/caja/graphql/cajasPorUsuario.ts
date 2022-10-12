import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajasPorUsuarioIdQuery } from './graphql-query';

export interface Response {
  data: PdvCaja[];
}

@Injectable({
  providedIn: 'root',
})
export class CajasPorUsuarioIdGQL extends Query<Response> {
  document = cajasPorUsuarioIdQuery;
}
