import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from 'src/app/pages/operaciones/pedidos/nota-recepcion/nota-recepcion.model';
import { notaRecepcionDisponibleParaPagoPorNumeroQuery } from './graphql-query';

export interface NotaRecepcionDisponibleParaPagoPorNumeroVariables {
  numero: number;
  proveedorId: number;
}

export interface NotaRecepcionDisponibleParaPagoPorNumeroResponse {
  data: NotaRecepcion;
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionDisponibleParaPagoPorNumeroGQL extends Query<
  NotaRecepcionDisponibleParaPagoPorNumeroResponse,
  NotaRecepcionDisponibleParaPagoPorNumeroVariables
> {
  document = notaRecepcionDisponibleParaPagoPorNumeroQuery;
}
