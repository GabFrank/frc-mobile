import { Injectable } from '@angular/core';
import { descodificarQr } from 'src/app/generic/utils/qrUtils';
import { PdvCaja } from '../../caja/caja.model';

export type ProcesarQrVentaMotivo =
  | 'qr-invalido'
  | 'no-es-venta-tarjeta'
  | 'qr-no-reconocido'
  | 'sin-caja'
  | 'caja-distinta';

export interface ProcesarQrVentaNavigation {
  ventaId: number;
  cajaId: number;
  monto: number;
  sucursalId: number;
  ventaTarjetaId: number | null;
}

export interface ProcesarQrVentaResult {
  ok: boolean;
  motivo?: ProcesarQrVentaMotivo;
  mensaje?: string;
  navigation?: ProcesarQrVentaNavigation;
}

/**
 * Parseo y validación compartida del QR de venta con tarjeta (frc-...-VT-...).
 * Usado por ScanVentaTarjetaComponent (lista → escanear) y por el FAB "Pagar"
 * del home (AppComponent), que también debe reconocer este tipo de QR.
 */
@Injectable({ providedIn: 'root' })
export class VentaTarjetaQrService {

  procesarQrVenta(texto: string, cajaActual: PdvCaja | null): ProcesarQrVentaResult {
    if (!texto || !texto.startsWith('frc-')) {
      return { ok: false, motivo: 'qr-invalido', mensaje: 'QR no válido para este sistema' };
    }

    const qrData = descodificarQr(texto);

    if (qrData.tipoEntidad !== 'VT') {
      return { ok: false, motivo: 'no-es-venta-tarjeta', mensaje: 'QR no corresponde a una venta con tarjeta' };
    }

    if (qrData.componentToOpen !== 'RegistroVentaTarjetaComponent') {
      return { ok: false, motivo: 'qr-no-reconocido', mensaje: 'QR no reconocido' };
    }

    if (!cajaActual) {
      return { ok: false, motivo: 'sin-caja', mensaje: 'Sin caja abierta' };
    }

    const partes = (qrData.data || '').split('|');
    const cajaIdQr = Number(partes[0]);
    const monto = Number(partes[1]);
    const ventaTarjetaId = partes[2] ? Number(partes[2]) : null;

    if (cajaIdQr !== Number(cajaActual.id)) {
      return {
        ok: false,
        motivo: 'caja-distinta',
        mensaje: 'Este QR pertenece a otra caja. Solo el cajero de turno puede registrar esta venta.'
      };
    }

    const ventaId = Number(qrData.idOrigen);
    // sucursalId del QR (valor de la filial) es el correcto para enrutar el save al backend correcto.
    // No comparamos con cajaActual.sucursalId porque el central puede asignar un id diferente al de la filial.
    const sucursalId = Number(qrData.sucursalId);

    return { ok: true, navigation: { ventaId, cajaId: cajaIdQr, monto, sucursalId, ventaTarjetaId } };
  }
}
