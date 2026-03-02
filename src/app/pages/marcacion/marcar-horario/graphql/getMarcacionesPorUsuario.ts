import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Marcacion } from '../models/marcacion.model';

@Injectable({
    providedIn: 'root',
})
export class GetMarcacionesPorUsuarioGQL extends Query<{ data: { getContent: Marcacion[] } }> {
    document = gql`
    query ($usuarioId: ID!, $fechaInicio: String, $fechaFin: String, $page: Int, $size: Int) {
      data: marcacionesPorUsuario(usuarioId: $usuarioId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
        getContent {
          id
          sucursalId
          tipo
          fechaEntrada
          fechaSalida
        }
      }
    }
  `;
}
