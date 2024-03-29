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
        producto {
          id
          descripcion
          balanza
          vencimiento
        }
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
        producto {
          id
          descripcion
          balanza
          vencimiento
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
      zona {
        id
      }
      presentacion {
        id
        cantidad
        producto {
          descripcion
          balanza
        }
      }
      cantidad
      cantidadFisica
      vencimiento
      estado
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
        producto {
          id
          descripcion
          balanza
          vencimiento
        }
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
        producto {
          id
          descripcion
          balanza
          vencimiento
        }
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
        producto {
          id
          descripcion
          balanza
          vencimiento
        }
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
        producto {
          id
          descripcion
          balanza
          vencimiento
        }
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
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        producto {
          id
          descripcion
          balanza
          vencimiento
        }
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
        producto {
          id
          descripcion
        }
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
          vencimiento
          creadoEn
        }
      }
    }
  }
`;
