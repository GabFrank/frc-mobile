import gql from 'graphql-tag';

// Query: Fetch paginated list of PedidoRecepcionProductoDto by RecepcionMercaderia ID
export const pedidoRecepcionProductoPorRecepcionMercaderiaQuery = gql`
  query ($recepcionMercaderiaId: ID!, $estado: PedidoRecepcionProductoEstado, $page: Int, $size: Int) {
    data: pedidoRecepcionProductoPorRecepcionMercaderia(
      recepcionMercaderiaId: $recepcionMercaderiaId,
      estado: $estado,
      page: $page,
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
        producto {
          id
          descripcion
          presentaciones {
            id
            cantidad
          }
        }
        totalCantidadARecibirPorUnidad
        totalCantidadRecibidaPorUnidad
        totalCantidadRechazadaPorUnidad
        estado
      }
    }
  }
`;

// Query: Fetch a single PedidoRecepcionProductoDto by RecepcionMercaderia ID and Producto ID
export const pedidoRecepcionProductoPorRecepcionMercaderiaAndProductoQuery = gql`
  query ($recepcionMercaderiaId: ID!, $productoId: ID!, $estado: PedidoRecepcionProductoEstado) {
    data: pedidoRecepcionProductoPorRecepcionMercaderiaAndProducto(
      recepcionMercaderiaId: $recepcionMercaderiaId,
      productoId: $productoId,
      estado: $estado
    ) {
      producto {
        id
        descripcion
        presentaciones {
          id
          cantidad
        }
      }
      totalCantidadARecibirPorUnidad
      totalCantidadRecibidaPorUnidad
      totalCantidadRechazadaPorUnidad
      estado
    }
  }
`;

// Query: Get RecepcionMercaderia by ID
export const recepcionMercaderiaPorIdQuery = gql`
  query ($id: ID!) {
    data: recepcionMercaderia(id: $id) {
      id
      proveedor {
        id
        persona {
          nombre
        }
      }
      sucursalRecepcion {
        id
        nombre
      }
      fecha
      estado
      usuario {
        id
        persona {
          nombre
        }
      }
      notas {
        id
      }
    }
  }
`;

// Query: Get NotaRecepcionItem list by NotaRecepcion ID
export const notaRecepcionItemListPorNotaRecepcionIdQuery = gql`
  query ($id: ID!) {
    data: notaRecepcionItemListPorNotaRecepcionId(id: $id) {
      id
      producto {
        id
        descripcion
      }
    }
  }
`;

// Mutation: Save RecepcionMercaderiaItem
export const saveRecepcionMercaderiaItemMutation = gql`
  mutation saveRecepcionMercaderiaItem($entity: RecepcionMercaderiaItemInput!) {
    data: saveRecepcionMercaderiaItem(entity: $entity) {
      id
      recepcionMercaderiaId
      producto {
        id
        descripcion
      }
      cantidadRecibida
      cantidadRechazada
    }
  }
`;

// Mutation: Finalizar RecepcionMercaderia
export const finalizarRecepcionMercaderiaMutation = gql`
  mutation finalizarRecepcionMercaderia($recepcionId: ID!) {
    data: finalizarRecepcionMercaderia(recepcionId: $recepcionId) {
      id
      estado
      proveedor {
        id
        persona {
          nombre
        }
      }
      sucursalRecepcion {
        id
        nombre
      }
      fecha
      usuario {
        id
      }
    }
  }
`;

// Mutation: Reabrir RecepcionMercaderia
export const reabrirRecepcionMercaderiaMutation = gql`
  mutation reabrirRecepcionMercaderia($recepcionId: ID!) {
    data: reabrirRecepcionMercaderia(recepcionId: $recepcionId) {
      id
      estado
      proveedor {
        id
        persona {
          nombre
        }
      }
      sucursalRecepcion {
        id
        nombre
      }
      fecha
      usuario {
        id
      }
    }
  }
`;

// Mutation: Iniciar RecepcionMercaderia (crea recepción, asocia notas y pre-crea items)
export const iniciarRecepcionMutation = gql`
  mutation iniciarRecepcion(
    $sucursalId: ID!
    $notaRecepcionIds: [ID!]!
    $proveedorId: ID!
    $monedaId: ID!
    $usuarioId: ID!
    $cotizacion: Float
  ) {
    data: iniciarRecepcion(
      sucursalId: $sucursalId
      notaRecepcionIds: $notaRecepcionIds
      proveedorId: $proveedorId
      monedaId: $monedaId
      usuarioId: $usuarioId
      cotizacion: $cotizacion
    ) {
      id
      proveedor {
        id
        persona {
          nombre
        }
      }
      sucursalRecepcion {
        id
        nombre
      }
      fecha
      estado
      usuario {
        id
        persona {
          nombre
        }
      }
      notas {
        id
      }
    }
  }
`;

// Query: Fetch paginated list of RecepcionMercaderia with filters
export const recepcionMercaderiaConFiltrosQuery = gql`
  query ($usuarioId: ID, $page: Int, $size: Int) {
    data: recepcionMercaderiaConFiltros(
      usuarioId: $usuarioId,
      page: $page,
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
        proveedor {
          id
          persona {
            nombre
          }
        }
        sucursalRecepcion {
          id
          nombre
        }
        fecha
        estado
        usuario {
          id
          persona {
            nombre
          }
        }
        notas {
          id
        }
      }
    }
  }
`;

// Query: Verificar si existe una recepción activa para una nota en una sucursal
export const verificarRecepcionActivaPorNotaYSucursalQuery = gql`
  query ($notaRecepcionId: ID!, $sucursalRecepcionId: ID!) {
    data: verificarRecepcionActivaPorNotaYSucursal(
      notaRecepcionId: $notaRecepcionId,
      sucursalRecepcionId: $sucursalRecepcionId
    ) {
      id
      estado
      sucursalRecepcion {
        id
        nombre
      }
    }
  }
`;
