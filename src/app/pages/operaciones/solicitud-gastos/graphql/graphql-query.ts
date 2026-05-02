import gql from 'graphql-tag';

export const savePreGastoMutation = gql`
  mutation savePreGasto($entity: PreGastoInput!) {
    data: savePreGasto(entity: $entity) {
      id
      descripcion
      estado
      creadoEn
    }
  }
`;

export const tipoGastosQuery = gql`
  query tipoGastos($page: Int, $size: Int) {
    data: tipoGastos(page: $page, size: $size) {
      id
      descripcion
      activo
    }
  }
`;

/** Lista paginada de todas las personas (para selector tipo modal). */
export const personasListQuery = gql`
  query personas($page: Int, $size: Int) {
    data: personas(page: $page, size: $size) {
      id
      nombre
      isFuncionario
    }
  }
`;

/** Lista paginada de todos los proveedores (para selector tipo modal). */
export const proveedoresListQuery = gql`
  query proveedores($page: Int, $size: Int) {
    data: proveedores(page: $page, size: $size) {
      id
      persona {
        id
        nombre
      }
    }
  }
`;
