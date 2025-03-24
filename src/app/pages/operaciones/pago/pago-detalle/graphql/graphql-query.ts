import gql from "graphql-tag";

export const pagoDetalleQuery = gql`
  query ($id: ID!) {
    data: pagoDetalle(id: $id) {
      id
      pago {
        id
        estado
      }
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
      moneda {
        id
        denominacion
        simbolo
      }
      formaPago {
        id
        descripcion
      }
      total
      sucursal {
        id
        nombre
      }
      caja {
        id
        descripcion
      }
      activo
      fechaProgramado
    }
  }
`;

export const savePagoDetalleMutation = gql`
  mutation savePagoDetalle($entity: PagoDetalleInput!) {
    data: savePagoDetalle(entity: $entity) {
      id
      pago {
        id
      }
      usuario {
        id
      }
      creadoEn
      moneda {
        id
      }
      formaPago {
        id
      }
      total
      sucursal {
        id
      }
      caja {
        id
      }
      activo
      fechaProgramado
    }
  }
`; 