import gql from 'graphql-tag';

export const deleteRecepcionMercaderiaItemVariacion = gql`
  mutation deleteRecepcionMercaderiaItemVariacion($id: ID!) {
    data: deleteRecepcionMercaderiaItemVariacion(id: $id)
  }
`;
