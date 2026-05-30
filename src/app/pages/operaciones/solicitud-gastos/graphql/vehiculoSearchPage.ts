import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Vehiculo } from '../models/ente.model';
import { vehiculoSearchPageQuery } from './graphql-query';

export interface VehiculoPageResponse {
  data: {
    hasNext?: boolean;
    getContent?: Vehiculo[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class VehiculoSearchPageGQL extends Query<
  VehiculoPageResponse,
  { texto?: string; page?: number; size?: number }
> {
  document = vehiculoSearchPageQuery;
}
