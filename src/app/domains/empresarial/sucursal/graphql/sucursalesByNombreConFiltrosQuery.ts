import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sucursal } from '../sucursal.model';
import { sucursalesByNombreConFiltrosQuery } from './graphql-query';

export interface SucursalesFiltrosInput {
  nombre?: string;
  deposito?: boolean;
  activo?: boolean;
  page?: number;
  size?: number;
}

export interface Response {
  data: Sucursal[];
}

@Injectable({
  providedIn: 'root',
})
export class SucursalesByNombreConFiltrosGQL extends Query<Sucursal[], SucursalesFiltrosInput> {
  document = sucursalesByNombreConFiltrosQuery;
}
