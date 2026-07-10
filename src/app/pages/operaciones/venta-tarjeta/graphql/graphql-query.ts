import gql from 'graphql-tag';

const ventaTarjetaFields = `
  id
  sucursalId
  codigoAutorizacion
  numeroBoleta
  monto
  montoEscaneado
  imagenUrl
  estado
  creadoEn
  venta { 
    id 
    totalGs 
    creadoEn 
    usuario { 
      id 
      nickname
    } 
  }
  terminalPos {
    id
    codigo
    descripcion
    moneda { id simbolo denominacion }
  }
  caja { 
    id 
  }
  usuario { 
    id 
    nickname 
  }
`;

export const saveVentaTarjetaMutation = gql`
  mutation saveVentaTarjeta($entity: VentaTarjetaInput!) {
    data: saveVentaTarjeta(ventaTarjeta: $entity) {
      ${ventaTarjetaFields}
    }
  }
`;

export const updateVentaTarjetaMutation = gql`
  mutation updateVentaTarjeta($entity: VentaTarjetaInput!) {
    data: updateVentaTarjeta(ventaTarjeta: $entity) {
      ${ventaTarjetaFields}
    }
  }
`;

export const ventasTarjetaPorCajaQuery = gql`
  query ventasTarjetaPorCaja($id: ID!, $sucId: ID!) {
    data: ventasTarjetaPorCaja(cajaId: $id, sucId: $sucId) {
      ${ventaTarjetaFields}
    }
  }
`;

export const ventaTarjetaPorIdQuery = gql`
  query ventaTarjetaPorId($id: ID!, $sucId: ID!) {
    data: ventaTarjetaPorId(id: $id, sucId: $sucId) {
      ${ventaTarjetaFields}
    }
  }
`;

export const ventaTarjetaPorVentaIdQuery = gql`
  query ventaTarjetaPorVentaId($ventaId: ID!, $sucId: ID!) {
    data: ventaTarjetaPorVentaId(ventaId: $ventaId, sucId: $sucId) {
      ${ventaTarjetaFields}
    }
  }
`;

export const countVentasTarjetaSinRegistrarQuery = gql`
  query countVentasTarjetaSinRegistrar($id: ID!, $sucId: ID!) {
    data: countVentasTarjetaSinRegistrar(cajaId: $id, sucId: $sucId)
  }
`;
