import gql from 'graphql-tag';

// Query: Fetch NotaRecepcionAgrupada by notaRecepcionId
export const notaRecepcionAgrupadaPorProveedorIdQuery = gql`
  query ($id: ID!, $page: Int!, $size: Int!) {
    data: notaRecepcionListPorProveedorId(id: $id, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        estado
        proveedor {
          id
          persona {
            nombre
          }
        }
        cantNotas
        sucursal {
          id
          nombre
        }
        creadoEn
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

// Query: Fetch paginated list of NotaRecepcionAgrupada by usuarioId
export const notaRecepcionListPorUsuarioIdQuery = gql`
  query ($id: ID!, $page: Int!, $size: Int!) {
    data: notaRecepcionListPorUsuarioId(id: $id, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        estado
        proveedor {
          id
          persona {
            nombre
          }
        }
        cantNotas
        sucursal {
          id
          nombre
        }
        creadoEn
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

// Mutation: Save NotaRecepcionAgrupada
export const saveNotaRecepcionAgrupadaMutation = gql`
  mutation saveNotaRecepcionAgrupada($entity: NotaRecepcionAgrupadaInput!) {
    data: saveNotaRecepcionAgrupada(entity: $entity) {
      id
      estado
      proveedor {
        id
        persona {
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;
