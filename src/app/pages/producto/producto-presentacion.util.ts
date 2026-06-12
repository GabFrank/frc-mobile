import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { normalizarCodigo } from 'src/app/generic/utils/barcodeUtils';

export function resolverPresentacionPorCodigo(
  producto: Producto,
  ...codigosReferencia: string[]
): Presentacion | null {
  const referencias = codigosReferencia
    .map(normalizarCodigo)
    .filter((c) => c.length > 0);

  const presentaciones = producto?.presentaciones ?? [];
  if (presentaciones.length === 0) {
    return null;
  }

  const porCodigo = presentaciones.find((p) =>
    p.codigos?.some((c) => referencias.includes(normalizarCodigo(c.codigo)))
  );
  if (porCodigo) {
    return porCodigo;
  }

  return presentaciones.find((p) => p.principal) ?? presentaciones[0] ?? null;
}

export function productoTienePresentaciones(producto: Producto): boolean {
  return (producto?.presentaciones?.length ?? 0) > 0;
}
