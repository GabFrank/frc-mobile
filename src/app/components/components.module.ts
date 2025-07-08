import { QrGeneratorComponent } from './qr-generator/qr-generator.component';
import { QrScannerDialogComponent } from './qr-scanner-dialog/qr-scanner-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { GenericListDialogComponent } from './generic-list-dialog/generic-list-dialog.component';
import { ChangeServerIpDialogComponent } from './change-server-ip-dialog/change-server-ip-dialog.component';
import { ImagePopoverComponent } from './image-popover/image-popover.component';
import {NgxPaginationModule} from 'ngx-pagination';
import { EnumToStringPipe } from '../generic/utils/pipes/enum-to-string';
import { PaginacionComponent } from './paginacion/paginacion.component';
import { GetNestedValuePipe } from '../generic/utils/pipes/get-nested-value.pipe';
import { CellFormatPipe } from '../pipes/cell-format.pipe';



@NgModule({
  declarations: [QrScannerDialogComponent, QrGeneratorComponent, GenericListDialogComponent, ChangeServerIpDialogComponent, ImagePopoverComponent, EnumToStringPipe,  PaginacionComponent, GetNestedValuePipe, CellFormatPipe],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    NgxQRCodeModule,
    NgxPaginationModule
  ],
  exports: [
    QrScannerDialogComponent,
    QrGeneratorComponent,
    EnumToStringPipe,
    NgxPaginationModule,
    PaginacionComponent,
    GetNestedValuePipe,
    CellFormatPipe
  ]
})
export class ComponentsModule { }
