import gql from 'graphql-tag';

export const saveDevolucionMutation = gql`
  mutation saveDevolucion($entity: DevolucionInput!) {
    data: saveDevolucion(entity: $entity) {
      id
      tipo
      estado
      fecha
      motivo
      observacion
    }
  }
`;

export const saveDevolucionItemMutation = gql`
  mutation saveDevolucionItem($entity: DevolucionItemInput!) {
    data: saveDevolucionItem(entity: $entity) {
      id
      cantidad
      lote
      vencimiento
      motivo
    }
  }
`;

export const avanzarEstadoDevolucionMutation = gql`
  mutation avanzarEstadoDevolucion(
    $devolucionId: ID!
    $estado: DevolucionEstado!
    $usuarioId: ID
  ) {
    data: avanzarEstadoDevolucion(
      devolucionId: $devolucionId
      estado: $estado
      usuarioId: $usuarioId
    ) {
      id
      estado
    }
  }
`;

export const motivosAveriaActivosQuery = gql`
  query motivosAveriaActivos {
    data: motivosAveriaActivos {
      id
      descripcion
      activo
      generaGasto
      aplicaProveedor
    }
  }
`;
