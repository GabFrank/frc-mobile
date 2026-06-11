import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Ente, TipoEnte } from '../models/ente.model';
import { enteByReferenciaIdQuery } from './graphql-query';

export interface EnteByReferenciaIdResponse {
  data: Ente;
}

@Injectable({
  providedIn: 'root',
})
export class EnteByReferenciaIdGQL extends Query<
  EnteByReferenciaIdResponse,
  { tipoEnte: TipoEnte; referenciaId: number }
> {
  document = enteByReferenciaIdQuery;
}
