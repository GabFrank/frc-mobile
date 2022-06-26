import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sucursal } from '../sucursal.model';
import { sucursalActualQuery, sucursalQuery } from './graphql-query';

export interface Response {
  data: Sucursal;
}

@Injectable({
  providedIn: 'root',
})
export class SucursalActualGQL extends Query<Response> {
  document = sucursalActualQuery;
}
