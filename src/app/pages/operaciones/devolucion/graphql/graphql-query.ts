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

export const devolucionConFiltrosQuery = gql`
  query devolucionConFiltros(
    $proveedorId: ID
    $sucursalId: ID
    $estado: DevolucionEstado
    $usuarioId: ID
    $page: Int
    $size: Int
  ) {
    data: devolucionConFiltros(
      proveedorId: $proveedorId
      sucursalId: $sucursalId
      estado: $estado
      usuarioId: $usuarioId
      page: $page
      size: $size
    ) {
      hasNext
      getTotalElements
      getContent {
        id
        tipo
        estado
        identificador
        fecha
        motivo
        colectadoEn
        sucursalOrigen {
          id
          nombre
        }
        sucursalUbicacion {
          id
          nombre
        }
        proveedor {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const revertirEstadoDevolucionMutation = gql`
  mutation revertirEstadoDevolucion($devolucionId: ID!, $usuarioId: ID) {
    data: revertirEstadoDevolucion(devolucionId: $devolucionId, usuarioId: $usuarioId) {
      id
      estado
    }
  }
`;

export const remitoRetiroProveedorQuery = gql`
  query remitoRetiroProveedor($devolucionIds: [ID!]!) {
    data: remitoRetiroProveedor(devolucionIds: $devolucionIds)
  }
`;

export const remitoRetiroQuery = gql`
  query remitoRetiro($retiroId: ID!) {
    data: remitoRetiro(retiroId: $retiroId)
  }
`;

export const retirosDevolucionQuery = gql`
  query retirosDevolucion($page: Int, $size: Int) {
    data: retirosDevolucion(page: $page, size: $size) {
      hasNext
      getTotalElements
      getContent {
        id
        fecha
        estado
        proveedor {
          id
          persona {
            nombre
          }
        }
        devoluciones {
          id
          identificador
          estado
          sucursalOrigen {
            nombre
          }
        }
      }
    }
  }
`;

export const colectasDevolucionQuery = gql`
  query colectasDevolucion($page: Int, $size: Int) {
    data: colectasDevolucion(page: $page, size: $size) {
      hasNext
      getTotalElements
      getContent {
        id
        fecha
        estado
        sucursalOrigen {
          id
          nombre
        }
        sucursalDestino {
          id
          nombre
        }
        devoluciones {
          id
          identificador
          estado
        }
      }
    }
  }
`;

export const revertirRetiroDevolucionMutation = gql`
  mutation revertirRetiroDevolucion($retiroId: ID!, $usuarioId: ID) {
    data: revertirRetiroDevolucion(retiroId: $retiroId, usuarioId: $usuarioId) {
      id
      estado
    }
  }
`;

export const revertirColectaDevolucionMutation = gql`
  mutation revertirColectaDevolucion($colectaId: ID!, $usuarioId: ID) {
    data: revertirColectaDevolucion(colectaId: $colectaId, usuarioId: $usuarioId) {
      id
      estado
    }
  }
`;

export const devolucionByIdQuery = gql`
  query devolucion($id: ID!) {
    data: devolucion(id: $id) {
      id
      tipo
      estado
      identificador
      fecha
      motivo
      observacion
      sucursalOrigen {
        id
        nombre
      }
      sucursalUbicacion {
        id
        nombre
      }
      proveedor {
        id
        persona {
          nombre
          documento
        }
      }
      items {
        id
        cantidad
        lote
        vencimiento
        motivo
        producto {
          id
          descripcion
        }
        presentacion {
          id
          cantidad
        }
        motivoAveria {
          id
          descripcion
        }
      }
    }
  }
`;

export const deleteDevolucionItemMutation = gql`
  mutation deleteDevolucionItem($id: ID!) {
    data: deleteDevolucionItem(id: $id)
  }
`;

export const etiquetasSeparadoPdfQuery = gql`
  query etiquetasSeparadoPdf($devolucionId: ID!) {
    data: etiquetasSeparadoPdf(devolucionId: $devolucionId)
  }
`;

export const colectarDevolucionesEnBloqueMutation = gql`
  mutation colectarDevolucionesEnBloque(
    $devolucionIds: [ID!]!
    $sucursalDestinoId: ID!
    $usuarioId: ID
  ) {
    data: colectarDevolucionesEnBloque(
      devolucionIds: $devolucionIds
      sucursalDestinoId: $sucursalDestinoId
      usuarioId: $usuarioId
    ) {
      resultados {
        id
        ok
        mensaje
      }
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
