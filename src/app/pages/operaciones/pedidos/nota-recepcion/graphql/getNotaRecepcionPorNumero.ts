import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { findByNumeroQuery } from './graphql-query';

export interface Response {
  data: NotaRecepcion[];
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionPorNumeroGQL extends Query<Response> {
  document = findByNumeroQuery;
} 