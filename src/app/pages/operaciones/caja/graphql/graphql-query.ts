import gql from "graphql-tag";

export const cajasQuery = gql`
  query($page:Int, $size:Int, $sucId:ID){
    data: cajas(page:$page, size:$size, sucId:$sucId) {
      id
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const cajasPorUsuarioIdQuery = gql`
  query($id:ID!, $page:Int, $size:Int){
    data: cajasPorUsuarioId(id: $id, page:$page, size:$size) {
      id
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
        persona {
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

export const cajasPorFecha = gql`
  query ($inicio: String, $fin: String, $sucId:ID) {
    data: cajasPorFecha(inicio: $inicio, fin: $fin, sucId:$susId) {
      id
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const balancePorFecha = gql`
  query ($inicio: String, $fin: String,$sucId:ID) {
    data: balancePorFecha(inicio: $inicio, fin: $fin, sucId:$sucId) {
      totalVentaGs
      totalVentaRs
      totalVentaDs
      totalTarjeta
    }
  }
`;

// export const cajasSearch = gql`
//   query ($texto: String) {
//     cajas: cajasSearch(texto: $texto) {
//       id
//       responsable {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       tipoCaja {
//         id
//         descripcion
//         autorizacion
//       }
//       autorizadoPor {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       observacion
//       creadoEn
//       usuario {
//         id
//         persona {
//           id
//           nombre
//         }
//       }
//       cajaDetalleList {
//         id
//         moneda {
//           id
//           denominacion
//         }
//         cambio {
//           id
//           valorEnGs
//         }
//         cantidad
//       }
//     }
//   }
// `;

export const cajaQuery = gql`
  query ($id: ID!, $sucId:ID) {
    data: pdvCaja(id: $id, sucId:$sucId) {
      id
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      conteoApertura {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
      conteoCierre {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
      balance {
        totalGeneral
        diferenciaGs
        diferenciaRs
        diferenciaDs
      }
    }
  }
`;

export const cajaPorUsuarioIdAndAbiertoQuery = gql`
  query ($id: ID!) {
    data: cajaAbiertoPorUsuarioId(id: $id) {
      id
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      conteoApertura {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
      conteoCierre {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const cajaAbiertoPorUsuarioIdPorSucursalQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: cajaAbiertoPorUsuarioIdPorSucursal(id: $id, sucId: $sucId) {
      id
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      conteoApertura {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
      conteoCierre {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
    }
  }
`;

export const savePdvCaja = gql`
  mutation savePdvCaja($entity: PdvCajaInput!) {
    data: savePdvCaja(pdvCaja: $entity) {
      id
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      conteoApertura {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
      conteoCierre {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
    }
  }
`;

export const savePdvCajaPorSucursal = gql`
  mutation savePdvCajaPorSucursal($entity: PdvCajaInput!) {
    data: savePdvCajaPorSucursal(pdvCaja: $entity) {
      id
      descripcion
      activo
      estado
      tuvoProblema
      fechaApertura
      fechaCierre
      observacion
      maletin {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      conteoApertura {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
      conteoCierre {
        id
        observacion
        creadoEn
        conteoMonedaList {
          id
          monedaBilletes {
            id
            moneda {
              id
              denominacion
            }
            valor
          }
          cantidad
        }
      }
    }
  }
`;

export const abrirCajaDesdeServidorQuery = gql`
  mutation abrirCajaDesdeServidor($input:PdvCajaInput!, $conteoInput: ConteoInput!, $conteoMonedaInputList: [ConteoMonedaInput]) {
    abrirCajaDesdeServidor($input:input, $conteoInput: conteoInput, $conteoMonedaInputList: conteoMonedaInputList)
  }
`;

export const deleteCajaQuery = gql`
  mutation deletePdvCaja($id: ID!, $sucId: ID) {
    deletePdvCaja(id: $id, sucId:$sucId)
  }
`;

export const imprimirBalanceQuery = gql`
  query imprimirBalance(
    $id: ID!
    $printerName: String
    $local: String
    $sucId: ID
    ) {
    imprimirBalance(
      id: $id
      printerName: $printerName
      local: $local,
      sucId: $sucId
      ) {
      id
    }
  }
`;
