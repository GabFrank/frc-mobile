export type ModuloPadreGasto =
  | 'MUEBLE'
  | 'INMUEBLE'
  | 'PERSONAS'
  | 'VEHICULO'
  | 'EQUIPOS'
  | 'ANDE'
  | 'JUNTA_SANEAMIENTO'
  | 'IMPUESTO'
  | 'INTERNET'
  | 'SEGURIDAD'
  | 'BASURA'
  | 'SEGURO'
  | 'OTRO';

export type TipoNaturalezaGasto = 'VARIABLE' | 'CONTINUO' | 'RECURRENTE';

const MODULOS_SERVICIO_CONTINUO: ModuloPadreGasto[] = [
  'ANDE',
  'JUNTA_SANEAMIENTO',
  'IMPUESTO',
  'INTERNET',
  'SEGURIDAD',
  'BASURA',
  'SEGURO',
];

const MODULOS_PADRE_CON_CUOTAS_ACTIVO: ModuloPadreGasto[] = [
  'INMUEBLE',
  'MUEBLE',
  'VEHICULO',
  'EQUIPOS',
];

export function esModuloServicioContinuo(modulo?: ModuloPadreGasto | string | null): boolean {
  return MODULOS_SERVICIO_CONTINUO.includes(modulo as ModuloPadreGasto);
}

export function esGastoContinuoRecurrente(naturaleza?: string | null): boolean {
  return naturaleza === 'CONTINUO' || naturaleza === 'RECURRENTE';
}

export function etiquetaModuloPadre(modulo?: ModuloPadreGasto | string | null): string {
  switch (modulo) {
    case 'VEHICULO':
      return 'Vehículo';
    case 'MUEBLE':
      return 'Mueble';
    case 'INMUEBLE':
      return 'Inmueble';
    case 'EQUIPOS':
      return 'Equipo';
    case 'PERSONAS':
      return 'Persona';
    case 'ANDE':
      return 'Inmueble (ANDE)';
    case 'JUNTA_SANEAMIENTO':
      return 'Inmueble (agua)';
    case 'IMPUESTO':
      return 'Inmueble / Activo';
    case 'INTERNET':
      return 'Inmueble / Sucursal';
    case 'SEGURIDAD':
      return 'Inmueble / Sucursal';
    case 'BASURA':
      return 'Inmueble / Sucursal';
    case 'SEGURO':
      return 'Activo asegurado';
    default:
      return 'Activo';
  }
}

export function tipoEnteDesdeModuloPadre(
  modulo?: ModuloPadreGasto | string | null
): 'VEHICULO' | 'MUEBLE' | 'INMUEBLE' | 'EQUIPO' | null {
  if (modulo === 'VEHICULO' || modulo === 'MUEBLE' || modulo === 'INMUEBLE') {
    return modulo;
  }
  if (modulo === 'EQUIPOS') {
    return 'EQUIPO';
  }
  if (esModuloServicioContinuo(modulo)) {
    return 'INMUEBLE';
  }
  return null;
}

export function requiereEnteActivo(modulo?: ModuloPadreGasto | string | null): boolean {
  return tipoEnteDesdeModuloPadre(modulo) != null;
}

export function esModuloPadreConCuotasActivo(modulo?: ModuloPadreGasto | string | null): boolean {
  return MODULOS_PADRE_CON_CUOTAS_ACTIVO.includes(modulo as ModuloPadreGasto);
}

export function mostrarTarjetaCuotasActivoEnSolicitud(
  modulo?: ModuloPadreGasto | string | null,
  naturaleza?: TipoNaturalezaGasto | string | null,
  esPagoCuotaActivo?: boolean | null,
): boolean {
  if (!esModuloPadreConCuotasActivo(modulo)) {
    return false;
  }
  if (typeof esPagoCuotaActivo === 'boolean') {
    return esPagoCuotaActivo;
  }
  return esGastoContinuoRecurrente(naturaleza);
}
