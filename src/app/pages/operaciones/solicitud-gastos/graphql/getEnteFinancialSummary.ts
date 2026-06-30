import gql from 'graphql-tag';

export const getEnteFinancialSummaryQuery = gql`
  query getEnteFinancialSummary($enteId: ID!, $tipoGastoId: ID) {
    data: getEnteFinancialSummary(enteId: $enteId, tipoGastoId: $tipoGastoId) {
      enteId
      descripcion
      montoTotal
      montoYaPagado
      montoPendiente
      cuotasTotales
      cuotasPagadas
      cuotasFaltantes
      diaVencimiento
      diasParaVencer
      estadoCuota
      monedaSimbolo
      monedaId
      proveedorNombre
      proveedorId
      situacionPago
      porcentajePagado
      montoSugerido
      descripcionSugerida
      autocompletarMonto
      numeroCuotaActual
      fechaVencimientoSugerida
    }
  }
`;
