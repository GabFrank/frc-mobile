import { QrScannerDialogComponent } from './qr-scanner-dialog/qr-scanner-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxScannerQrcodeModule } from 'ngx-scanner-qrcode';



@NgModule({
  declarations: [QrScannerDialogComponent],
  imports: [
    CommonModule,
    NgxScannerQrcodeModule
  ],
  exports: [
    QrScannerDialogComponent
  ]
})
export class ComponentsModule { }
