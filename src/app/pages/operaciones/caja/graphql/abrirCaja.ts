import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { abrirCajaDesdeServidorQuery } from './graphql-query';

export interface Response {
  data: Boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AbrirCajaGQL extends Mutation<boolean> {
  document = abrirCajaDesdeServidorQuery;
}
