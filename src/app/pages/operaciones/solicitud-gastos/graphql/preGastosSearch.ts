import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class FilterPreGastosGQL extends Query<any> {
  document = gql`
    query filterPreGastos(
      $id: ID
      $cajaId: ID
      $estado: String
      $estados: [String]
      $inicio: String
      $fin: String
      $page: Int
      $size: Int
    ) {
      data: filterPreGastos(
        id: $id
        cajaId: $cajaId
        estado: $estado
        estados: $estados
        inicio: $inicio
        fin: $fin
        page: $page
        size: $size
      ) {
        getTotalPages
        getTotalElements
        getNumberOfElements
        isFirst
        isLast
        hasNext
        hasPrevious
        getContent {
          id
          sucursalId
          descripcion
          estado
          montoSolicitado
          montoRetirado
          montoGastado
          moneda {
            id
            simbolo
            denominacion
          }
          sucursalCaja {
            id
            nombre
          }
          creadoEn
          estadoEtiqueta
          estadoColor
          estadoIcono
        }
      }
    }
  `;
}
