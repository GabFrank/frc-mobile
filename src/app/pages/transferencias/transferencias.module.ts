import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ComponentsModule } from './../../components/components.module';
import { InfoTransferenciaComponent } from './info-transferencia/info-transferencia.component';
import { IngresarCodigoPopComponent } from './ingresar-codigo-pop/ingresar-codigo-pop.component';
import { ListTransferenciasComponent } from './list-transferencias/list-transferencias.component';
import { ModificarItemDialogComponent } from './modificar-item-dialog/modificar-item-dialog.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TransferenciasRoutingModule } from './transferencias-routing.module';


@NgModule({
  declarations: [ListTransferenciasComponent, TransferenciaComponent, InfoTransferenciaComponent, IngresarCodigoPopComponent, ModificarItemDialogComponent],
  imports: [
    CommonModule,
    IonicModule,
    TransferenciasRoutingModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [ListTransferenciasComponent, TransferenciaComponent],

})
export class TransferenciasModule { }
