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
      autorizacion
      moduloPadre
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

export const vehiculoSearchPageQuery = gql`
  query vehiculoSearchPage($texto: String, $page: Int, $size: Int) {
    data: vehiculoSearchPage(texto: $texto, page: $page, size: $size) {
      hasNext
      getContent {
        id
        chapa
        modelo {
          descripcion
          marca {
            descripcion
          }
        }
      }
    }
  }
`;

export const muebleSearchPageQuery = gql`
  query muebleSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: muebleSearchPage(texto: $texto, page: $page, size: $size) {
      hasNext
      getContent {
        id
        descripcion
      }
    }
  }
`;

export const inmuebleSearchPageQuery = gql`
  query inmuebleSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: inmuebleSearchPage(texto: $texto, page: $page, size: $size) {
      hasNext
      getContent {
        id
        nombreAsignado
      }
    }
  }
`;

export const enteByReferenciaIdQuery = gql`
  query enteByReferenciaId($tipoEnte: TipoEnte!, $referenciaId: ID!) {
    data: enteByReferenciaId(tipoEnte: $tipoEnte, referenciaId: $referenciaId) {
      id
      tipoEnte
      referenciaId
      descripcion
      activo
    }
  }
`;

export const saveEnteMutation = gql`
  mutation saveEnte($entity: EnteInput!) {
    data: saveEnte(ente: $entity) {
      id
      tipoEnte
      referenciaId
      descripcion
      activo
    }
  }
`;
