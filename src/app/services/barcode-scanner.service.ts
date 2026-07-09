import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { from, Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ServerConnectionService } from './server-connection.service';

export interface BarcodeScanResult {
  text: string;
  format: string;
  cancelled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService {
  constructor(
    private serverConnectionService: ServerConnectionService
  ) { }

  scan(): Observable<BarcodeScanResult> {
    if (!this.isNativePlatform()) {
      return of({ text: '', format: '', cancelled: true });
    }

    return from(this.scanNative()).pipe(
      finalize(() => this.serverConnectionService.setNativeScannerActive(false))
    );
  }

  private isNativePlatform(): boolean {
    // Usar la API de Capacitor, no Platform.is('capacitor') de Ionic: en este
    // stack (Ionic 6 + Capacitor 7) Platform.is('capacitor') devuelve false
    // dentro de la app nativa y el scanner nunca se disparaba. El resto de los
    // servicios nativos del proyecto ya usan Capacitor.isNativePlatform().
    return Capacitor.isNativePlatform();
  }

  private beginNativeScanUi(): void {
    this.serverConnectionService.setNativeScannerActive(true);
  }

  private async scanNative(): Promise<BarcodeScanResult> {
    this.beginNativeScanUi();
    try {
      if (Capacitor.getPlatform() === 'android') {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          await BarcodeScanner.installGoogleBarcodeScannerModule();
        }
      }

      const status = await BarcodeScanner.checkPermissions();
      if (status.camera !== 'granted') {
        const res = await BarcodeScanner.requestPermissions();
        if (res.camera !== 'granted') {
          throw new Error('Camera permission was denied');
        }
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [
          BarcodeFormat.QrCode,
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.Code128,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE
        ]
      });

      if (barcodes?.length > 0) {
        return {
          text: barcodes[0].displayValue,
          format: barcodes[0].format,
          cancelled: false
        };
      }

      return { text: '', format: '', cancelled: true };
    } catch (error: any) {
      console.error('Google ML Kit Scan Error:',
        error?.message ?? String(error),
        'code=', error?.code);
      return { text: '', format: '', cancelled: true };
    }
  }
}
