import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VentaTarjetaRoutingModule } from './venta-tarjeta-routing.module';
import { ListVentaTarjetaComponent } from './list-venta-tarjeta/list-venta-tarjeta.component';
import { ScanVentaTarjetaComponent } from './scan-venta-tarjeta/scan-venta-tarjeta.component';
import { RegistroVentaTarjetaComponent } from './add-venta-tarjeta/add-venta-tarjeta.component';

@NgModule({
  declarations: [
    ListVentaTarjetaComponent,
    ScanVentaTarjetaComponent,
    RegistroVentaTarjetaComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    VentaTarjetaRoutingModule
  ]
})
export class VentaTarjetaModule {}
