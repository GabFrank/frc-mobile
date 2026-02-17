import gql from "graphql-tag";

export const solicitudPagoQuery = gql`
  query solicitudPago($id: ID!) {
    data: solicitudPago(id: $id) {
      id
      proveedor { id persona { nombre } }
      numeroSolicitud
      fechaSolicitud
      fechaPagoPropuesta
      montoTotal
      moneda { id denominacion simbolo }
      formaPago { id descripcion }
      estado
      observaciones
      creadoEn
      usuario { id persona { nombre } }
      notasRecepcion {
        id
        notaRecepcion { id numero valorTotal fecha }
        montoIncluido
      }
    }
  }
`;

export const solicitudesPagoPaginatedQuery = gql`
  query solicitudesPagoPaginated($page: Int, $size: Int, $proveedorId: ID, $estado: SolicitudPagoEstado) {
    data: solicitudesPagoPaginated(page: $page, size: $size, proveedorId: $proveedorId, estado: $estado) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        proveedor { id persona { nombre } }
        numeroSolicitud
        fechaSolicitud
        montoTotal
        moneda { id denominacion simbolo }
        formaPago { id descripcion }
        estado
        notasRecepcion { id }
      }
    }
  }
`;

export const notaRecepcionDisponibleParaPagoPorNumeroQuery = gql`
  query notaRecepcionDisponibleParaPagoPorNumero($numero: Int!, $proveedorId: ID!) {
    data: notaRecepcionDisponibleParaPagoPorNumero(numero: $numero, proveedorId: $proveedorId) {
      id
      numero
      valorTotal
      fecha
      estado
      pedido { id proveedor { id persona { nombre } } }
    }
  }
`;

export const saveSolicitudPagoMutation = gql`
  mutation saveSolicitudPago($entity: SolicitudPagoInput!) {
    data: saveSolicitudPago(entity: $entity) {
      id
      proveedor { id persona { nombre } }
      numeroSolicitud
      fechaSolicitud
      montoTotal
      moneda { id denominacion }
      formaPago { id descripcion }
      estado
      creadoEn
    }
  }
`;

export const imprimirSolicitudPagoPDFMutation = gql`
  mutation imprimirSolicitudPagoPDF($solicitudPagoId: ID!) {
    data: imprimirSolicitudPagoPDF(solicitudPagoId: $solicitudPagoId)
  }
`;

export const datosInicialesSolicitudPagoPorRecepcionQuery = gql`
  query datosInicialesSolicitudPagoPorRecepcion($recepcionMercaderiaId: ID!) {
    data: datosInicialesSolicitudPagoPorRecepcion(recepcionMercaderiaId: $recepcionMercaderiaId) {
      notas {
        id
        numero
        valorTotal
        fecha
      }
      monedaId
      formaPagoId
      fechaPagoPropuesta
    }
  }
`; 