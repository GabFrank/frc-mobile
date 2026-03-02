import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Jornada } from '../models/marcacion.model';

@Injectable({
    providedIn: 'root',
})
export class GetJornadasPorUsuarioGQL extends Query<{ data: Jornada[] }> {
    document = gql`
    query ($usuarioId: ID!, $fechaInicio: String, $fechaFin: String) {
      data: jornadasPorUsuario(usuarioId: $usuarioId, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
        id
        sucursalId
        fecha
        marcacionEntrada {
          id
          tipo
          fechaEntrada
          fechaSalida
        }
        marcacionSalidaAlmuerzo {
          id
          tipo
          fechaEntrada
          fechaSalida
        }
        marcacionEntradaAlmuerzo {
          id
          tipo
          fechaEntrada
          fechaSalida
        }
        marcacionSalida {
          id
          tipo
          fechaEntrada
          fechaSalida
        }
        estado
      }
    }
  `;
}
