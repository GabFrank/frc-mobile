import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Observable } from 'rxjs';
import { itemsNotaPaginados } from './pedidos-queries.graphql';

export interface NotaRecepcionItemPaginado {
  id: number;
  producto: {
    id: number;
    nombre: string;
    codigo: string;
    descripcion: string;
  };
  presentacion: {
    id: number;
    nombre: string;
    codigo: string;
    factorConversion: number;
  };
  cantidad: number;
  estado: string;
  precioUnitario: number;
  moneda: {
    id: number;
    nombre: string;
    simbolo: string;
  };
}

export interface ItemsNotaPaginadosResponse {
  content: NotaRecepcionItemPaginado[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface ItemsNotaPaginadosVariables {
  notaId: string;
  page: number;
  size: number;
  sort?: string;
  direction?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItemsNotaPaginadosQuery extends Query<ItemsNotaPaginadosResponse, ItemsNotaPaginadosVariables> {
  document = itemsNotaPaginados;
} 