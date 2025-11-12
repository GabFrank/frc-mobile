import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { generarConstanciaRecepcionPDF } from './pedidos-queries.graphql';

export interface ConstanciaRecepcionPDFResponse {
    pdfBase64: string;
    nombreArchivo: string;
    tamanioBytes: number;
    fechaGeneracion: string;
}

export interface GenerarConstanciaRecepcionPDFResponse {
    data: ConstanciaRecepcionPDFResponse;
}

export interface GenerarConstanciaRecepcionPDFVariables {
    recepcionId: string;
}

@Injectable({ providedIn: 'root' })
export class GenerarConstanciaRecepcionPDFQuery extends Query<
    GenerarConstanciaRecepcionPDFResponse,
    GenerarConstanciaRecepcionPDFVariables
> {
    document = generarConstanciaRecepcionPDF;
} 