import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sucursal } from '../sucursal.model';
import { sucursalesAllQuery } from './graphql-query';

export interface Response {
  data: Sucursal[];
}

@Injectable({
  providedIn: 'root',
})
export class SucursalesAllGQL extends Query<Sucursal[]> {
  document = sucursalesAllQuery;
} 