import { InfoTransferenciaComponent } from './info-transferencia/info-transferencia.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { ListTransferenciasComponent } from './list-transferencias/list-transferencias.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransferenciasRoutingModule } from './transferencias-routing.module';


@NgModule({
  declarations: [ListTransferenciasComponent, TransferenciaComponent, InfoTransferenciaComponent],
  imports: [
    CommonModule,
    TransferenciasRoutingModule
  ],
  exports: [ListTransferenciasComponent, TransferenciaComponent]
})
export class TransferenciasModule { }
