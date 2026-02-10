import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionItemListPorNotaRecepcionIdQuery } from './graphql-query';

export interface NotaRecepcionItem {
  id: number;
  producto: {
    id: number;
    descripcion: string;
  };
  notaRecepcion?: {
    id: number;
    numero?: number;
  };
  cantidadEnNota?: number;
  cantidadRecibida?: number;
  cantidadRechazada?: number;
  cantidadPendiente?: number;
}

export interface Response {
  data: NotaRecepcionItem[];
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionItemListPorNotaRecepcionIdGQL extends Query<Response> {
  document = notaRecepcionItemListPorNotaRecepcionIdQuery;
}
