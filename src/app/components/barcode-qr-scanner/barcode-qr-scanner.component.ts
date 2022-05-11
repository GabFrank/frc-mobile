import { Component, Input, OnInit } from '@angular/core';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner/ngx';

@Component({
  selector: 'app-barcode-qr-scanner',
  templateUrl: './barcode-qr-scanner.component.html',
  styleUrls: ['./barcode-qr-scanner.component.scss'],
})
export class BarcodeQrScannerComponent implements OnInit {

  @Input()
  format:string = 'QR_CODE'

  scannedData: any;

  constructor(private barcodeScanner: BarcodeScanner) { }

  ngOnInit() {
    this.scanBarcode()
  }

  scanBarcode() {
    const options: BarcodeScannerOptions = {
      preferFrontCamera: false,
      showFlipCameraButton: true,
      showTorchButton: true,
      torchOn: false,
      prompt: 'Escanee el código Qr',
      resultDisplayDuration: 500,
      formats: this.format,
      orientation: 'portrait',
    };

    this.barcodeScanner.scan(options).then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scannedData = barcodeData;

    }).catch(err => {
      console.log('Error', err);
    });
  }

}
