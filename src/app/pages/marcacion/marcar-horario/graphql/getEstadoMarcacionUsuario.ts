import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { EstadoMarcacionUsuario } from '../models/marcacion.model';

@Injectable({
    providedIn: 'root',
})
export class GetEstadoMarcacionUsuarioGQL extends Query<{ data: EstadoMarcacionUsuario }> {
    document = gql`
    query ($usuarioId: ID!) {
      data: estadoMarcacionUsuario(usuarioId: $usuarioId) {
        accionPendiente
        puedeMarcarEntrada
        puedeMarcarSalida
        puedeMarcarSalidaAlmuerzo
        puedeMarcarEntradaAlmuerzo
        estaEnJornada
        jornadaRelevante {
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
          turno
          estado
        }
      }
    }
  `;
}
