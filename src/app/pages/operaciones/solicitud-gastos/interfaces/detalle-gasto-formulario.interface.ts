export interface DetalleGastoFormulario {
  id: number;
  monto: number | null;
  monedaId: number | null;
  formaPago: string | null;
  montoTexto: string;
}
