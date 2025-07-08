import gql from "graphql-tag";

export const notaRecepcionsQuery = gql`
  {
    id
    pedido {
      id
    }
    compra {
      id
    }
    documento {
      id
      descripcion
      activo
    }
    valor
    descuento
    pagado
    numero
    timbrado
    creadoEn
    usuario {
      id
    }
  }
`;

export const notaRecepcionQuery = gql`
  query ($id: ID!) {
    data: notaRecepcion(id: $id) {
      id
      pedido {
        id
      }
      compra {
        id
      }
      documento {
        id
        descripcion
        activo
      }
      valor
      descuento
      pagado
      numero
      timbrado
      creadoEn
      cantidadItensVerificadoRecepcionMercaderia
      usuario {
        id
      }
    }
  }
`;

export const findByProveedorAndNumeroQuery = gql`
  query ($id: ID!, $numero: Int!) {
    data: findByProveedorAndNumero(id: $id, numero: $numero) {
      id
      pedido {
        id
        estado
      }
      compra {
        id
      }
      documento {
        id
        descripcion
        activo
      }
      valor
      descuento
      pagado
      numero
      fecha
      timbrado
      creadoEn
      cantidadItensVerificadoRecepcionMercaderia
      usuario {
        id
      }
      notaRecepcionAgrupada {
        id
        usuario {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const findByNumeroQuery = gql`
  query ($numero: Int!) {
    data: findByNumero(numero: $numero) {
      id
      pedido {
        id
        estado
        proveedor {
          id
          persona {
            nombre
          }
        }
      }
      compra {
        id
      }
      documento {
        id
        descripcion
        activo
      }
      valor
      descuento
      pagado
      numero
      fecha
      timbrado
      creadoEn
      cantidadItensVerificadoRecepcionMercaderia
      usuario {
        id
      }
      notaRecepcionAgrupada {
        id
        usuario {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const findNotasDisponiblesParaRecepcionQuery = gql`
  query ($numero: Int, $proveedorId: ID, $sucursalId: ID) {
    data: findNotasDisponiblesParaRecepcion(numero: $numero, proveedorId: $proveedorId, sucursalId: $sucursalId) {
      id
      pedido {
        id
        estado
        proveedor {
          id
          persona {
            nombre
            apodo
            documento
          }
        }
      }
      compra {
        id
      }
      documento {
        id
        descripcion
        activo
      }
      valor
      descuento
      pagado
      numero
      fecha
      timbrado
      creadoEn
      cantidadItensVerificadoRecepcionMercaderia
      usuario {
        id
      }
      notaRecepcionAgrupada {
        id
        usuario {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const notaRecepcionPorPedidoIdQuery = gql`
  query ($id: ID!) {
    data: notaRecepcionPorPedidoId(id: $id) {
      id
      pedido {
        id
      }
      compra {
        id
      }
      documento {
        id
        descripcion
      }
      valor
      descuento
      tipoBoleta
      pagado
      numero
      timbrado
      creadoEn
      cantidadItensVerificadoRecepcionMercaderia
      usuario {
        id
        persona {
          nombre
        }
      }
      cantidadItens
      fecha
    }
  }
`;

export const saveNotaRecepcion = gql`
  mutation saveNotaRecepcion($entity: NotaRecepcionInput!) {
    data: saveNotaRecepcion(entity: $entity) {
      id
      valor
    }
  }
`;

export const deleteNotaRecepcionQuery = gql`
  mutation deleteNotaRecepcion($id: ID!) {
    deleteNotaRecepcion(id: $id)
  }
`;

export const notaRecepcionPorPedidoIdAndNumeroQuery = gql`
  query ($id: ID!, $numero: Int, $page: Int, $size: Int) {
    data: notaRecepcionPorPedidoIdAndNumero(
      id: $id
      numero: $numero
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
        pedido {
          id
        }
        compra {
          id
        }
        documento {
          id
          descripcion
        }
        valor
        descuento
        tipoBoleta
        pagado
        numero
        timbrado
        creadoEn
        cantidadItensVerificadoRecepcionMercaderia
        usuario {
          id
          persona {
            nombre
          }
        }
        cantidadItens
        fecha
      }
    }
  }
`;

export const countNotaRecepcionPorPedidoId = gql`
  query ($id: ID!) {
    data: countNotaRecepcionPorPedidoId(id: $id)
  }
`;

export const notaRecepcionPorNotaRecepcionAgrupadaIdQuery = gql`
  query ($id: ID!) {
    data: notaRecepcionPorNotaRecepcionAgrupadaId(id: $id) {
      id
      pedido {
        id
        formaPago {
          id
          descripcion
        }
        moneda {
          id
          denominacion
          simbolo
        }

      }
      compra {
        id
      }
      documento {
        id
        descripcion
        activo
      }
      valor
      descuento
      pagado
      numero
      timbrado
      tipoBoleta
      creadoEn
      fecha
      cantidadItensVerificadoRecepcionMercaderia
      usuario {
        id
        persona {
          nombre
        }
      }
      cantidadItens
      notaRecepcionAgrupada {
        id
      }
    }
  }
`;
