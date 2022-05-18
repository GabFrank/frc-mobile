import { ModificarItemDialogComponent } from './modificar-item-dialog/modificar-item-dialog.component';
import { BrowserModule } from '@angular/platform-browser';
import { IngresarCodigoPopComponent } from './ingresar-codigo-pop/ingresar-codigo-pop.component';
import { ComponentsModule } from './../../components/components.module';
import { InfoTransferenciaComponent } from './info-transferencia/info-transferencia.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { ListTransferenciasComponent } from './list-transferencias/list-transferencias.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransferenciasRoutingModule } from './transferencias-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';


@NgModule({
  declarations: [ListTransferenciasComponent, TransferenciaComponent, InfoTransferenciaComponent, IngresarCodigoPopComponent, ModificarItemDialogComponent],
  imports: [
    CommonModule,
    IonicModule,
    TransferenciasRoutingModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  exports: [ListTransferenciasComponent, TransferenciaComponent],

})
export class TransferenciasModule { }
