import { OpcionSeleccion } from 'src/app/components/selector-generico/selector-generico.component';

/**
 * Utilidades compartidas para parseo, formato y precisión de montos según la moneda.
 *
 * Antes esta lógica estaba duplicada en `nuevo-solicitud-gastos.component`,
 * `agregar-rendicion-gasto.component` y `solicitud-gastos.service`.
 * Centralizarla evita divergencias y facilita el mantenimiento.
 */

export const PRECISION_GUARANI = 0;
export const PRECISION_DECIMAL = 2;

/** Determina si el texto de una moneda corresponde al Guaraní (sin decimales). */
export function esMonedaGuaraniPorTexto(texto: string | null | undefined): boolean {
  const normalizado = (texto || '').toUpperCase();
  return (
    normalizado.includes('GUARANI') ||
    normalizado.includes('GUARANÍ') ||
    normalizado.includes('₲') ||
    normalizado.includes('GS.')
  );
}

/** Precisión decimal a partir del texto de la moneda (0 para guaraníes, 2 para el resto). */
export function precisionPorTextoMoneda(texto: string | null | undefined): number {
  return esMonedaGuaraniPorTexto(texto) ? PRECISION_GUARANI : PRECISION_DECIMAL;
}

/** Precisión decimal buscando la moneda por id dentro de las opciones disponibles. */
export function precisionMonedaPorId(
  opciones: OpcionSeleccion[],
  monedaId: number | null,
): number {
  if (monedaId == null) {
    return PRECISION_DECIMAL;
  }
  const opcion = opciones.find((item) => Number(item.valor) === Number(monedaId));
  return precisionPorTextoMoneda(opcion?.texto);
}

/** Id de la moneda Guaraní dentro de las opciones, o null si no existe. */
export function idGuaraniDesdeOpciones(opciones: OpcionSeleccion[]): number | null {
  const guarani = opciones.find((opcion) => esMonedaGuaraniPorTexto(opcion.texto));
  return guarani ? Number(guarani.valor) : null;
}

/**
 * Convierte el texto ingresado por el usuario a un número respetando la precisión de la moneda.
 * Retorna null si el texto no representa un monto válido.
 */
export function parsearMonto(texto: string, precision: number): number | null {
  const textoLimpio = (texto || '').replace(/\s/g, '');
  if (!textoLimpio) {
    return null;
  }

  if (precision === 0) {
    const soloDigitos = textoLimpio.replace(/\D/g, '');
    return soloDigitos ? Number(soloDigitos) : null;
  }

  const ultimoSeparadorIndex = Math.max(textoLimpio.lastIndexOf(','), textoLimpio.lastIndexOf('.'));
  const fuenteEntera = ultimoSeparadorIndex >= 0 ? textoLimpio.slice(0, ultimoSeparadorIndex) : textoLimpio;
  const parteEntera = fuenteEntera.replace(/\D/g, '');
  if (!parteEntera) {
    return null;
  }

  const fuenteDecimal = ultimoSeparadorIndex >= 0 ? textoLimpio.slice(ultimoSeparadorIndex + 1) : '';
  const parteDecimal = fuenteDecimal.replace(/\D/g, '').slice(0, precision);
  const normalizado = parteDecimal.length > 0 ? `${parteEntera}.${parteDecimal}` : parteEntera;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}

/** Formatea un monto numérico con la precisión indicada usando el locale es-PY. */
export function formatearMonto(monto: number, precision: number): string {
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(monto);
}
