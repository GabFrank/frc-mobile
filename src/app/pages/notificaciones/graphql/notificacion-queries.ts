import { gql } from 'apollo-angular';

export const NOTIFICACIONES_USUARIO_QUERY = gql`
  query notificacionesUsuario($leidas: Boolean, $page: Int, $size: Int, $estadoTablero: String, $fechaInicio: String, $fechaFin: String) {
    notificacionesUsuario(leidas: $leidas, page: $page, size: $size, estadoTablero: $estadoTablero, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      content {
        id
        leida
        fechaLeida
        fechaEntrega
        creadoEn
        notificacion {
          id
          titulo
          mensaje
          tipo
          creadoEn
        }
      }
      totalElements
      totalPages
      pageNumber
      pageSize
    }
  }
`;

export const MARCAR_NOTIFICACION_LEIDA_MUTATION = gql`
  mutation marcarNotificacionLeida($notificacionId: Int!) {
    marcarNotificacionLeida(notificacionId: $notificacionId)
  }
`;

export const CONTEO_NOTIFICACIONES_NO_LEIDAS_QUERY = gql`
  query conteoNotificacionesNoLeidas {
    conteoNotificacionesNoLeidas
  }
`;
