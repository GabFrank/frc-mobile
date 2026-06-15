import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cerrarCajaDesdeServidorQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CerrarCajaGQL extends Mutation<boolean> {
  document = cerrarCajaDesdeServidorQuery;
}
