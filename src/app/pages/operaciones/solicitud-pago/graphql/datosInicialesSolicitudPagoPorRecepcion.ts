import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { datosInicialesSolicitudPagoPorRecepcionQuery } from './graphql-query';
import { NotaRecepcion } from 'src/app/pages/operaciones/pedidos/nota-recepcion/nota-recepcion.model';

export interface DatosInicialesSolicitudPago {
  notas: NotaRecepcion[];
  monedaId: number | null;
  formaPagoId: number | null;
  fechaPagoPropuesta: string | null;
}

export interface DatosInicialesSolicitudPagoPorRecepcionVariables {
  recepcionMercaderiaId: number;
}

export interface DatosInicialesSolicitudPagoPorRecepcionResponse {
  data: DatosInicialesSolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class DatosInicialesSolicitudPagoPorRecepcionGQL extends Query<
  DatosInicialesSolicitudPagoPorRecepcionResponse,
  DatosInicialesSolicitudPagoPorRecepcionVariables
> {
  document = datosInicialesSolicitudPagoPorRecepcionQuery;
}
