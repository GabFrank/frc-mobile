import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Zona } from '../zona.model';
import { zonaQuery } from './graphql-query';

export interface Response {
  data: Zona;
}

@Injectable({
  providedIn: 'root',
})
export class ZonaByIdGQL extends Query<Response> {
  document = zonaQuery;
}
