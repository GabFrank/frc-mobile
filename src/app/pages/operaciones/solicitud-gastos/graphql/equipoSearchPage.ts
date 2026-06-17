import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Equipo } from '../models/ente.model';
import { equipoSearchPageQuery } from './graphql-query';

export interface EquipoPageResponse {
  data: {
    hasNext?: boolean;
    getContent?: Equipo[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class EquipoSearchPageGQL extends Query<
  EquipoPageResponse,
  { texto?: string; page?: number; size?: number }
> {
  document = equipoSearchPageQuery;
}
