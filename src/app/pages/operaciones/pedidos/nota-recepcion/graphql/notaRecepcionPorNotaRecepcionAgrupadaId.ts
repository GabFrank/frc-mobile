import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notaRecepcionPorNotaRecepcionAgrupadaIdQuery } from './graphql-query';

export interface Response {
  data: NotaRecepcion[];
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionPorNotaRecepcionAgrupadaIdGQL extends Query<Response> {
  document = notaRecepcionPorNotaRecepcionAgrupadaIdQuery;
} 