import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { findNotasDisponiblesParaRecepcionQuery } from './graphql-query';

export interface Response {
  data: NotaRecepcion[];
}

@Injectable({
  providedIn: 'root',
})
export class NotasDisponiblesParaRecepcionGQL extends Query<Response> {
  document = findNotasDisponiblesParaRecepcionQuery;
}