import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Observable } from 'rxjs';
import { resumenItemsNota } from './pedidos-queries.graphql';

export interface ItemPorEstado {
  estado: string;
  count: number;
  cantidad: number;
}

export interface ResumenPorNota {
  notaId: number;
  totalItems: number;
  totalCantidad: number;
  estado: string;
}

export interface ResumenItemsNotaResponse {
  totalItems: number;
  totalCantidad: number;
  itemsPorEstado: ItemPorEstado[];
  resumenPorNota: ResumenPorNota[];
}

export interface ResumenItemsNotaVariables {
  notaIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ResumenItemsNotaQuery extends Query<ResumenItemsNotaResponse, ResumenItemsNotaVariables> {
  document = resumenItemsNota;
} 