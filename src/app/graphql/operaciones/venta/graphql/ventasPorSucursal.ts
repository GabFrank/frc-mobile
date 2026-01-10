import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

export interface VentaPorSucursal {
    sucId: number;
    nombre: string;
    total: number;
}

@Injectable({
    providedIn: 'root',
})
export class VentasPorSucursalGQL extends Query<{ data: VentaPorSucursal[] }> {
    document = gql`
    query VentasPorSucursal($inicio: String!, $fin: String!) {
      data: ventasPorSucursal(inicio: $inicio, fin: $fin) {
        sucId
        nombre
        total
      }
    }
  `;
}
