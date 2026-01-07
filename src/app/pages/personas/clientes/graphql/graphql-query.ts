import gql from 'graphql-tag';

export const clientesQuery = gql`
  query ($page: Int, $size: Int) {
    data: clientes(page: $page, size: $size) {
      id
      tipo
      credito
      codigo
      persona {
        id
        nombre
        documento
        direccion
        telefono
      }
    }
  }
`;

export const clientePorPersona = gql`
  query ($texto: String) {
    data: clientePorPersona(texto: $texto) {
      id
      tipo
      credito
      codigo
      persona {
        id
        nombre
        documento
        direccion
      }
    }
  }
`;

export const clientePorId = gql`
  query ($id: ID!) {
     data: cliente(id: $id) {
        id
        tipo
        credito
        codigo
        persona {
            id
            nombre
            documento
            direccion
            telefono
            ciudad {
                id
                nombre
            }
        }
        sucursal {
            id
            nombre
        }
    }
  }
`;


export const saveCliente = gql`
  mutation saveCliente($entity: ClienteInput!) {
    data: saveCliente(cliente: $entity) {
        id
        tipo
        credito
        persona {
            id
            nombre
        }
    }
  }
`;

export const savePersona = gql`
  mutation savePersona($persona: PersonaInput!) {
    data: savePersona(persona: $persona) {
      id
      nombre
      documento
    }
  }
`;
