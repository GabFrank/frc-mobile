import gql from 'graphql-tag';

export const usuariosQuery = gql`
  {
    usuario {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const usuariosSearch = gql`
  query ($texto: String) {
    data: usuarioSearch(texto: $texto) {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const usuarioQuery = gql`
  query ($id: ID!) {
    data: usuario(id: $id) {
      id
      nickname
      persona {
        id
        nombre
        telefono
        email
        nacimiento
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      roles
      inicioSesion {
        id
        usuario {
          id
        }
        sucursal {
          id
        }
        tipoDespositivo
        idDispositivo
        token
        horaInicio
        horaFin
        creadoEn
      }
    }
  }
`;

export const usuarioPorPersonaIdQuery = gql`
  query ($id: ID!) {
    data: usuarioPorPersonaId(id: $id) {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      roles
      inicioSesion {
        id
        usuario {
          id
        }
        sucursal {
          id
        }
        tipoDespositivo
        idDispositivo
        token
        horaInicio
        horaFin
        creadoEn
      }
    }
  }
`;

export const saveUsuario = gql`
  mutation saveUsuario($entity: UsuarioInput!) {
    data: saveUsuario(usuario: $entity) {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      inicioSesion {
        id
        usuario {
          id
        }
        sucursal {
          id
        }
        tipoDespositivo
        idDispositivo
        token
        horaInicio
        horaFin
        creadoEn
      }
    }
  }
`;

export const deleteUsuarioQuery = gql`
  mutation deleteUsuario($id: ID!) {
    deleteUsuario(id: $id)
  }
`;

export const inicioSesionListPorUsuarioIdAndAbiertoGQL = gql`
  query ($id: Int!, $sucId: Int, $page: Int, $size: Int) {
    data: inicioSesionListPorUsuarioIdAndAbierto(
      id: $id
      sucId: $sucId
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        usuario {
          id
        }
        sucursal {
          id
        }
        tipoDespositivo
        idDispositivo
        token
        horaInicio
        horaFin
        creadoEn
      }
    }
  }
`;

export const saveInicioSesionGQL = gql`
  mutation saveInicioSesion($entity: InicioSesionInput!) {
    data: saveInicioSesion(entity: $entity) {
      id
      usuario {
        id
      }
      sucursal {
        id
      }
      tipoDespositivo
      idDispositivo
      token
      horaInicio
      horaFin
      creadoEn
    }
  }
`;

// usuarioPorPersonaId
