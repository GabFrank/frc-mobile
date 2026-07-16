/**
 * Modelos del contrato GraphQL para el retiro consolidado de devoluciones por
 * proveedor (FASE C). Los nombres de campos coinciden EXACTAMENTE con el schema
 * del backend `frc-comercial/central` — Apollo no valida el schema en build, por
 * lo que cualquier desalineacion rompe en runtime.
 */

export interface RetiroCaja {
  identificador: string;
  devolucionId: number;
  productoId: number;
  descripcion: string;
  cantidad: number;
  lote: string;
  vencimiento: string;
}

export interface RetiroLineaConsolidada {
  productoId: number;
  codigo: string;
  descripcion: string;
  presentacion: string;
  cantidadTotal: number;
}

export interface RetiroSucursalGrupo {
  sucursalId: number;
  sucursalNombre: string;
  lineas: RetiroLineaConsolidada[];
  cajas: RetiroCaja[];
  devolucionIds: number[];
}

export interface RetiroProveedorConsolidado {
  proveedorId: number;
  proveedorNombre: string;
  fecha: string;
  grupos: RetiroSucursalGrupo[];
}

export interface RetiroDevolucionResultado {
  id: number;
  ok: boolean;
  mensaje: string;
}

export interface RetiroBloqueResultado {
  resultados: RetiroDevolucionResultado[];
}

/**
 * Fila de trabajo en la UI mobile: una caja "aplanada" (desde cualquier grupo /
 * sucursal) con el nombre de la sucursal a la que pertenece y un flag de
 * verificacion que se tilda al escanear el `identificador`.
 */
export interface RetiroCajaView extends RetiroCaja {
  sucursalNombre: string;
  verificada: boolean;
}
