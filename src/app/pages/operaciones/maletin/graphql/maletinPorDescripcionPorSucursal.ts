import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Maletin } from '../maletin.model';
import { maletinPorDescripcionPorSucursalQuery } from './graphql-query';

export interface Response {
  data: Maletin;
}

@Injectable({
  providedIn: 'root',
})
export class MaletinPorDescripcionPorSucursalGQL extends Query<Response> {
  document = maletinPorDescripcionPorSucursalQuery;
}
