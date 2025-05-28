import gql from "graphql-tag";

export const inventariosQuery = gql`
  {
    data: inventarios {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          cantidadAnterior
          fechaVerificado
          verificado
          revisado
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const inventarioQuery = gql`
  query ($id: ID!) {
    data: inventario(id: $id) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        id
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        usuario {
          id
          persona {
            nombre
          }
        }
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
      }
    }
  }
`;

export const inventarioProItemPorInventarioProQuery = gql`
  query ($id: ID!, $page: Int, $size: Int) {
    data: inventarioProductosItemPorInventarioProducto(id: $id, page: $page, size: $size) {
      id
      inventarioProducto {
        id
      }
      presentacion {
        id
        cantidad
        descripcion
        imagenPrincipal
        producto {
          id
          descripcion
          balanza
          vencimiento
          imagenPrincipal
        }
      }
      cantidad
      cantidadFisica
      vencimiento
      estado
      cantidadAnterior
      verificado
      revisado
    }
  }
`;

export const inventarioPorUsuarioQuery = gql`
  query ($id: ID!) {
    data: inventarioPorUsuario(id: $id) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
            producto {
              id
              descripcion
              balanza
              vencimiento
            }
          }
          estado
          cantidad
          cantidadAnterior
          fechaVerificado
          verificado
          revisado
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const saveInventario = gql`
  mutation saveInventario($entity: InventarioInput!) {
    data: saveInventario(inventario: $entity) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          cantidadAnterior
          fechaVerificado
          verificado
          revisado
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const deleteInventarioQuery = gql`
  mutation deleteInventario($id: ID!) {
    deleteInventario(id: $id)
  }
`;

export const inventarioPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: inventarioPorFecha(inicio: $inicio, fin: $fin) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          cantidadAnterior
          fechaVerificado
          verificado
          revisado
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const saveInventarioProducto = gql`
  mutation saveInventarioProducto($entity: InventarioProductoInput!) {
    data: saveInventarioProducto(inventarioProducto: $entity) {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        usuario {
          id
          persona {
            nombre
          }
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          cantidadAnterior
          fechaVerificado
          verificado
          revisado
          vencimiento
          creadoEn
        }
    }
  }
`;

export const deleteInventarioProductoQuery = gql`
  mutation deleteInventarioProducto($id: ID!) {
    deleteInventarioProducto(id: $id)
  }
`;

export const saveInventarioProductoItem = gql`
  mutation saveInventarioProductoItem($entity: InventarioProductoItemInput!) {
    data: saveInventarioProductoItem(inventarioProductoItem: $entity) {
      id
      estado
      zona {
        id
        sector {
          id
          descripcion
        }
        descripcion
      }
      presentacion {
        id
        cantidad
        imagenPrincipal
        producto {
          descripcion
        }
      }
      cantidad
      cantidadFisica
      cantidadAnterior
      fechaVerificado
      verificado
      revisado
      vencimiento
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
    }
  }
`;

export const deleteInventarioProductoItemQuery = gql`
  mutation deleteInventarioProductoItem($id: ID!) {
    deleteInventarioProductoItem(id: $id)
  }
`;

// finalizarInventario
export const finalizarInventarioQuery = gql`
  mutation finalizarInventario($id: ID!) {
    data: finalizarInventario(id: $id){
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        id
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          cantidadAnterior
          fechaVerificado
          verificado
          revisado
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

// cancelarInventario
export const cancelarInventarioQuery = gql`
  mutation cancelarInventario($id: ID!) {
    cancelarInventario(id: $id)
  }
`;

export const reabrirInventarioQuery = gql`
  mutation reabrirInventario($id: ID!) {
    reabrirInventario(id: $id)
  }
`;

export const inverntarioAbiertoPorSucursalQuery = gql`
  query ($id: ID!) {
    data: inventarioAbiertoPorSucursal(sucId: $id) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido 
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          cantidadAnterior
          fechaVerificado
          verificado
          revisado
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const inventarioPorUsuarioPaginadoQuery = gql`
  query GetInventariosPorUsuarioPaginado($usuarioId: ID!, $page: Int!, $size: Int!, $sortOrder: String) {
    data: getInventariosPorUsuarioPaginado(usuarioId: $usuarioId, page: $page, size: $size, sortOrder: $sortOrder) {
      getContent {
        id
        fechaInicio
        fechaFin
        estado
        sucursal {
          id
          nombre
        }
        usuario {
          id
          persona {
            id
            nombre
          }
        }
      }
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
    }
  }
`;

export const getInventarioItemsParaRevisarQuery = gql`
  query getInventarioItemsParaRevisar(
    $inventarioId: ID!
    $filtro: String
    $page: Int!
    $size: Int!
  ) {
    getInventarioItemsParaRevisar(
      inventarioId: $inventarioId
      filtro: $filtro
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
        presentacion {
          id
          cantidad
          producto {
            id
            descripcion
            imagenPrincipal
          }
          imagenPrincipal
        }
        cantidad
        cantidadFisica
        cantidadAnterior
        verificado
        revisado
      }
    }
  }
`;

export const productosConCantidadPositivaQuery = gql`
  query getProductosConCantidadPositiva($sucursalId: ID!, $page: Int!, $size: Int!) {
    data: productosConCantidadPositiva(sucursalId: $sucursalId, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        productoId
        productoDescripcion
        sucursalId  
        saldoTotal
      }
    }
  }
`;

export const productosConCantidadNegativaQuery = gql`
  query getProductosConCantidadNegativa($sucursalId: ID!, $page: Int!, $size: Int!) {
    data: productosConCantidadNegativa(sucursalId: $sucursalId, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        productoId
        productoDescripcion
        sucursalId
        saldoTotal
      }
    }
  }
`;

export const productosFaltantesQuery = gql`
  query getProductosFaltantes($sucursalId: ID!, $fechaInicio: String!, $fechaFin: String!, $page: Int!, $size: Int!) {
    data: productosFaltantes(sucursalId: $sucursalId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        productoId
        productoDescripcion
        sucursalId
        saldoTotal
      }
    }
  }
`;
