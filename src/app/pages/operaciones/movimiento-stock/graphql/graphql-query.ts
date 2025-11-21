import gql from 'graphql-tag';

export const stockPorProductoQuery = gql`
  query stockPorProducto($id: ID!, $sucId: ID) {
    data: stockPorProducto(id: $id, sucId: $sucId)
  }
`;

export const saveMovimientoStockMutation = gql`
  mutation saveMovimientoStock($movimientoStock: MovimientoStockInput!) {
    data: saveMovimientoStock(movimientoStock: $movimientoStock) {
      id
      sucursalId
      cantidad
      tipoMovimiento
      referencia
      estado
      creadoEn
      producto {
        id
        descripcion
      }
      sucursal {
        id
        nombre
      }
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

