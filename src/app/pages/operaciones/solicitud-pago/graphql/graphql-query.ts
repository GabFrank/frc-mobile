import gql from "graphql-tag";

export const solicitudPagoQuery = gql`
  query ($id: ID!) {
    data: solicitudPago(id: $id) {
      id
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
      estado
    }
  }
`;

export const solicitudPagoPorUsuarioIdQuery = gql`
  query ($id: ID!) {
    data: solicitudPagoPorUsuarioId(id: $id) {
      id
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
      estado
    }
  }
`;

export const saveSolicitudPagoMutation = gql`
  mutation saveSolicitudPago($entity: SolicitudPagoInput!) {
    data: saveSolicitudPago(entity: $entity) {
      id
      usuario {
        id
      }
      creadoEn
      estado
    }
  }
`; 