import { NotificacionService, TipoNotificacion } from './notificacion.service';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { BarcodeScannerOptions, BarcodeScanResult } from '@ionic-native/barcode-scanner';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

export enum BarcodeFormat {
  EAN_13 = 'EAN_13',
  EAN_8 = 'EAN_8',
  QR_CODE = 'QR_CODE'
}

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  scannedData: any;

  constructor(private barcodeScanner: BarcodeScanner, private notificacionService: NotificacionService) { }

  scanBarcode(format: BarcodeFormat): Observable<BarcodeScanResult> {
    const options: BarcodeScannerOptions = {
      preferFrontCamera: false,
      showFlipCameraButton: true,
      showTorchButton: true,
      torchOn: false,
      prompt: 'Escanee el código Qr',
      resultDisplayDuration: 500,
      formats: format,
      orientation: 'portrait',
    };
    return new Observable(obs => {
      this.barcodeScanner.scan(options).then(barcodeData => {
        obs.next(barcodeData)
        this.notificacionService.open('Qr scaneado con éxito', TipoNotificacion.SUCCESS, 1)
      }).catch(err => {
        obs.next(null)
        this.notificacionService.open('No fue posible leer el Qr', TipoNotificacion.DANGER, 2)
        console.log('Error', err);
      });
    })

  }
}
