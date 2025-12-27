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
          conteoComentarios
          data
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

export const COMENTARIOS_NOTIFICACION_QUERY = gql`
  query comentariosNotificacion($notificacionId: Int!) {
    comentariosNotificacion(notificacionId: $notificacionId) {
      id
      comentario
      creadoEn
      usuario {
        id
        nickname
        persona {
          id
          nombre
          imagenes
        }
      }
      comentarioPadre {
        id
      }
    }
  }
`;

export const CREAR_COMENTARIO_NOTIFICACION_MUTATION = gql`
  mutation crearComentarioNotificacion($notificacionId: Int!, $comentario: String!, $comentarioPadreId: Int) {
    crearComentarioNotificacion(notificacionId: $notificacionId, comentario: $comentario, comentarioPadreId: $comentarioPadreId) {
      id
      comentario
      creadoEn
      usuario {
        id
        nickname
        persona {
          id
          nombre
          imagenes
        }
      }
    }
  }
`;

export const USUARIOS_CON_ACCESO_NOTIFICACION_QUERY = gql`
  query usuariosConAccesoNotificacion($notificacionId: Int!) {
    usuariosConAccesoNotificacion(notificacionId: $notificacionId) {
      id
      nickname
      persona {
        id
        nombre
        imagenes
      }
    }
  }
`;
