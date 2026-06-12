import { QrGeneratorComponent } from './qr-generator/qr-generator.component';
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
import { BuscadorModalComponent } from './buscador-modal/buscador-modal.component';
import { SeccionAccordionComponent } from './seccion-accordion/seccion-accordion.component';
import { SelectorGenericoComponent } from './selector-generico/selector-generico.component';



@NgModule({
  declarations: [QrGeneratorComponent, GenericListDialogComponent, ChangeServerIpDialogComponent, ImagePopoverComponent, EnumToStringPipe, PaginacionComponent, BuscadorModalComponent, SeccionAccordionComponent, SelectorGenericoComponent],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    NgxQRCodeModule,
    NgxPaginationModule
  ],
  exports: [
    QrGeneratorComponent,
    EnumToStringPipe,
    NgxPaginationModule,
    PaginacionComponent,
    BuscadorModalComponent,
    SeccionAccordionComponent,
    SelectorGenericoComponent
  ]
})
export class ComponentsModule { }
