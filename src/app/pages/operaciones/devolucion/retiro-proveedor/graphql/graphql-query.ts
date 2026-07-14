import gql from 'graphql-tag';

export const retiroProveedorConsolidadoQuery = gql`
  query retiroProveedorConsolidado($proveedorId: ID!, $sucursalId: ID) {
    data: retiroProveedorConsolidado(proveedorId: $proveedorId, sucursalId: $sucursalId) {
      proveedorId
      proveedorNombre
      fecha
      grupos {
        sucursalId
        sucursalNombre
        devolucionIds
        lineas {
          productoId
          codigo
          descripcion
          presentacion
          cantidadTotal
        }
        cajas {
          identificador
          devolucionId
          productoId
          descripcion
          cantidad
          lote
          vencimiento
        }
      }
    }
  }
`;

export const devolucionConfiguracionQuery = gql`
  query devolucionConfiguracion {
    data: devolucionConfiguracion {
      retiroPermitirSeleccionManual
    }
  }
`;

export const retirarDevolucionesEnBloqueMutation = gql`
  mutation retirarDevolucionesEnBloque($devolucionIds: [ID!]!, $usuarioId: ID) {
    data: retirarDevolucionesEnBloque(devolucionIds: $devolucionIds, usuarioId: $usuarioId) {
      resultados {
        id
        ok
        mensaje
      }
    }
  }
`;
