import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { preGastoPorIdQuery } from './graphql-query';
import { PreGasto } from '../models/pre-gasto.model';

export interface PreGastoPorIdResponse {
  data: PreGasto;
}

@Injectable({ providedIn: 'root' })
export class PreGastoPorIdGQL extends Query<PreGastoPorIdResponse> {
  document = preGastoPorIdQuery;
}
