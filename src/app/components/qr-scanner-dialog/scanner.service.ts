import { DialogoService } from 'src/app/services/dialogo.service';
import { Injectable } from '@angular/core';

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

  constructor(private matDialog: DialogoService) { }

  // scan(): Observable<string>{
  //   re

  // }

  // scanBarcode(format: BarcodeFormat): Observable<BarcodeScanResult> {
  //   const options: BarcodeScannerOptions = {
  //     preferFrontCamera: false,
  //     showFlipCameraButton: true,
  //     showTorchButton: true,
  //     torchOn: false,
  //     prompt: 'Escanee el código Qr',
  //     resultDisplayDuration: 500,
  //     formats: format,
  //     orientation: 'portrait',
  //   };
  //   return new Observable(obs => {
  //     this.barcodeScanner.scan(options).then(barcodeData => {
  //       obs.next(barcodeData)
  //       this.notificacionService.open('Qr scaneado con éxito', TipoNotificacion.SUCCESS, 1)
  //     }).catch(err => {
  //       obs.next(null)
  //       this.notificacionService.open('No fue posible leer el Qr', TipoNotificacion.DANGER, 2)
  //       console.log('Error', err);
  //     });
  //   })

  // }
  // scan(): Observable<string>{
  //   return new Observable(obs => {
  //     this.qrScanner.prepare()
  //     .then((status: QRScannerStatus) => {
  //       if (status.authorized) {
  //         // camera permission was granted

  //         // start scanning
  //         let scanSub = this.qrScanner.scan().subscribe((text: string) => {
  //           obs.next(text)
  //           this.qrScanner.hide(); // hide camera preview
  //           scanSub.unsubscribe(); // stop scanning
  //         });

  //       } else if (status.denied) {
  //         // camera permission was permanently denied
  //         // you must use QRScanner.openSettings() method to guide the user to the settings page
  //         // then they can grant the permission from there
  //       } else {
  //         // permission was denied, but not permanently. You can ask for permission again at a later time.
  //       }
  //     })
  //     .catch((e: any) => console.log('Error is', e));
  //   })

  // }
}
