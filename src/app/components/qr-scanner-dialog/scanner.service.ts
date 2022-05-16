import { DialogoService } from 'src/app/services/dialogo.service';
import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

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

  scan(){
    const didUserGrantPermission = async () => {
      // check if user already granted permission
      const status = await BarcodeScanner.checkPermission({ force: false });

      if (status.granted) {
        // user granted permission
        return true;
      }

      if (status.denied) {
        // user denied permission
        return false;
      }

      if (status.asked) {
        // system requested the user for permission during this call
        // only possible when force set to true
      }

      if (status.neverAsked) {
        // user has not been requested this permission before
        // it is advised to show the user some sort of prompt
        // this way you will not waste your only chance to ask for the permission
        const c = confirm(
          'We need your permission to use your camera to be able to scan barcodes',
        );
        if (!c) {
          return false;
        }
      }

      if (status.restricted || status.unknown) {
        // ios only
        // probably means the permission has been denied
        return false;
      }

      // user has not denied permission
      // but the user also has not yet granted the permission
      // so request it
      const statusRequest = await BarcodeScanner.checkPermission({ force: true });

      if (statusRequest.asked) {
        // system requested the user for permission during this call
        // only possible when force set to true
      }

      if (statusRequest.granted) {
        // the user did grant the permission now
        return true;
      }

      // user did not grant the permission, so he must have declined the request
      return false;
    };

    didUserGrantPermission();
  }

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
