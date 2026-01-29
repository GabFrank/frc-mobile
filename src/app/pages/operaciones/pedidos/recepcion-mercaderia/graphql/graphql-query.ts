import gql from 'graphql-tag';

// Query: Fetch paginated list of RecepcionMercaderia by usuarioId with filters
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
