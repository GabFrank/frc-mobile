import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { generarConstanciaRecepcionPDFQuery } from './graphql-query';

export interface ConstanciaRecepcionPDFResult {
  pdfBase64: string;
  nombreArchivo: string;
  tamanioBytes: number;
  fechaGeneracion: string;
}

export interface Response {
  data: ConstanciaRecepcionPDFResult;
}

@Injectable({
  providedIn: 'root',
})
export class GenerarConstanciaRecepcionPDFGQL extends Query<Response> {
  document = generarConstanciaRecepcionPDFQuery;
}
