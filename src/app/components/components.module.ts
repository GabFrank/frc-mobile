import { QrGeneratorComponent } from './qr-generator/qr-generator.component';
import { QrScannerDialogComponent } from './qr-scanner-dialog/qr-scanner-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { GenericListDialogComponent } from './generic-list-dialog/generic-list-dialog.component';
import { ChangeServerIpDialogComponent } from './change-server-ip-dialog/change-server-ip-dialog.component';



@NgModule({
  declarations: [QrScannerDialogComponent, QrGeneratorComponent, GenericListDialogComponent, ChangeServerIpDialogComponent],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    NgxQRCodeModule

  ],
  exports: [
    QrScannerDialogComponent,
    QrGeneratorComponent
  ]
})
export class ComponentsModule { }
