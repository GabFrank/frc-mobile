import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { tipoGastosQuery } from './graphql-query';
import { TipoGasto } from '../models/tipo-gasto.model';

export interface TipoGastosResponse {
  data: TipoGasto[];
}

@Injectable({
  providedIn: 'root',
})
export class TipoGastosGQL extends Query<TipoGastosResponse, { page?: number; size?: number }> {
  document = tipoGastosQuery;
}
