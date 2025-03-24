import gql from "graphql-tag";

export const pagoQuery = gql`
  query ($id: ID!) {
    data: pago(id: $id) {
      id
      usuario {
        id
        persona {
          nombre
        }
      }
      autorizadoPor {
        id
        persona {
          nombre
        }
      }
      solicitudPago {
        id
        estado
      }
      creadoEn
      estado
      programado
    }
  }
`;

export const savePagoMutation = gql`
  mutation savePago($entity: PagoInput!) {
    data: savePago(entity: $entity) {
      id
      usuario {
        id
      }
      autorizadoPor {
        id
      }
      solicitudPago {
        id
      }
      creadoEn
      estado
      programado
    }
  }
`; 