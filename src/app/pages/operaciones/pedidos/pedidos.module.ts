import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PedidosRoutingModule } from './pedidos-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { PedidosComponent } from './pedidos.component';
import { RecepcionNotasComponent } from './recepcion-notas/recepcion-notas.component';

@NgModule({
  declarations: [PedidosComponent, RecepcionNotasComponent],
  imports: [
    CommonModule,
    PedidosRoutingModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class PedidosModule {}
