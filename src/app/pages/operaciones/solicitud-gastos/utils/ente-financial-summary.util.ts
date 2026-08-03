export interface EnteFinancialSummaryResponse {
  enteId?: number;
  descripcion?: string;
  montoTotal?: number;
  montoYaPagado?: number;
  montoPendiente?: number;
  cuotasTotales?: number;
  cuotasPagadas?: number;
  cuotasFaltantes?: number;
  diaVencimiento?: number;
  diasParaVencer?: number;
  estadoCuota?: string;
  monedaSimbolo?: string;
  monedaId?: number;
  proveedorNombre?: string;
  proveedorId?: number;
  situacionPago?: string;
  porcentajePagado?: number;
  montoSugerido?: number;
  descripcionSugerida?: string;
  autocompletarMonto?: boolean;
  numeroCuotaActual?: number;
  fechaVencimientoSugerida?: string;
}

export interface ResumenFinancieroEnteVista {
  titulo: string;
  descripcion: string;
  montoTotalTexto: string;
  montoPendienteTexto: string;
  cuotaTexto: string;
  cuotasFaltantesTexto: string;
  montoCuotaTexto: string;
  vencimientoTexto: string;
  notificacion: string | null;
  mostrarCuotas: boolean;
  proveedorTexto: string;
}

export function construirNotificacionVencimiento(diasParaVencer?: number | null): string | null {
  if (diasParaVencer == null) {
    return null;
  }
  if (diasParaVencer < 0) {
    return `Cuota vencida hace ${Math.abs(diasParaVencer)} días`;
  }
  if (diasParaVencer <= 10) {
    return `Vence en ${diasParaVencer} días`;
  }
  return `Próximo vencimiento en ${diasParaVencer} días`;
}

export function construirVistaResumenFinanciero(
  summary: EnteFinancialSummaryResponse
): ResumenFinancieroEnteVista {
  const moneda = summary.monedaSimbolo || '₲';
  const mostrarCuotas = (summary.cuotasTotales ?? 0) > 0;
  const cuotaActual = summary.numeroCuotaActual ?? ((summary.cuotasPagadas ?? 0) + 1);

  const cuotasFaltantes = summary.cuotasFaltantes ?? 0;
  const montoCuota = summary.montoSugerido ?? 0;

  return {
    titulo: summary.descripcion || 'Activo vinculado',
    descripcion: summary.descripcionSugerida || summary.descripcion || '',
    montoTotalTexto: `${moneda} ${Math.round(summary.montoTotal ?? 0).toLocaleString('es-PY')}`,
    montoPendienteTexto: `${moneda} ${Math.round(summary.montoPendiente ?? 0).toLocaleString('es-PY')}`,
    cuotaTexto: mostrarCuotas
      ? `Cuota ${cuotaActual}/${summary.cuotasTotales}`
      : summary.estadoCuota || 'Sin cuotas',
    cuotasFaltantesTexto: mostrarCuotas
      ? `${cuotasFaltantes} cuota${cuotasFaltantes === 1 ? '' : 's'} pendiente${cuotasFaltantes === 1 ? '' : 's'}`
      : '',
    montoCuotaTexto: mostrarCuotas && montoCuota > 0
      ? `${moneda} ${Math.round(montoCuota).toLocaleString('es-PY')}`
      : '',
    vencimientoTexto: summary.diaVencimiento
      ? `Día ${summary.diaVencimiento} del mes`
      : 'Sin día fijo',
    notificacion: construirNotificacionVencimiento(summary.diasParaVencer),
    mostrarCuotas,
    proveedorTexto: summary.proveedorNombre || '',
  };
}

export function parsearFechaVencimientoSugerida(
  fecha: string | null | undefined
): string {
  if (!fecha) {
    return '';
  }
  return fecha.length >= 10 ? fecha.substring(0, 10) : fecha;
}
