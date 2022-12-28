import { Cliente } from "../cliente/cliente.model"
import { Usuario } from "../personas/usuario.model"
import { Venta } from "../venta/venta.model"

export class VentaCredito {
  id: number
  venta: Venta
  cliente: Cliente
  tipoConfirmacion: TipoConfirmacion
  cantidadCuotas: number
  valorTotal: number
  saldoTotal: number
  plazoEnDias: number
  interesPorDia: number
  interesMoraDia: number
  estado: EstadoVentaCredito
  creadoEn: Date
  usuario: Usuario
}

export enum TipoConfirmacion {
  CONTRASENA = 'CONTRASENA',
  PASSWORD = 'PASSWORD',
  QR = 'QR',
  LECTOR_HUELLAS = 'LECTOR_HUELLAS',
  FIRMA = 'FIRMA',
  APP = 'APP'
}

export enum EstadoVentaCredito {
  ABIERTO = 'ABIERTO',
  FINALIZADO = 'FINALIZADO',
  EN_MORA = 'EN_MORA',
  INCOBRABLE = 'INCOBRABLE'
}
