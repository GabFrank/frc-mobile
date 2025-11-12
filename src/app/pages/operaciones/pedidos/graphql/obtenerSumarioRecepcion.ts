import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ObtenerSumarioRecepcionResponse, obtenerSumarioRecepcion } from './pedidos-queries.graphql';

@Injectable({
  providedIn: 'root'
})
export class ObtenerSumarioRecepcionQuery extends Query<ObtenerSumarioRecepcionResponse> {
  document = obtenerSumarioRecepcion;
}
