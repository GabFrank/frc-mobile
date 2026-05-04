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

export const personaSearchPageQuery = gql`
  query personaSearchPage($texto: String, $page: Int, $size: Int) {
    data: personaSearchPage(texto: $texto, page: $page, size: $size) {
      hasNext
      getContent {
        id
        nombre
        isFuncionario
      }
    }
  }
`;

export const proveedorSearchByPersonaPageQuery = gql`
  query proveedorSearchByPersonaPage($texto: String, $page: Int, $size: Int) {
    data: proveedorSearchByPersonaPage(texto: $texto, page: $page, size: $size) {
      hasNext
      getContent {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;
