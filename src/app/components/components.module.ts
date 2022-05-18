import { QrScannerDialogComponent } from './qr-scanner-dialog/qr-scanner-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [QrScannerDialogComponent],
  imports: [
    CommonModule,
  ],
  exports: [
    QrScannerDialogComponent
  ]
})
export class ComponentsModule { }
