import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SolicitudGastosRoutingModule } from './solicitud-gastos-routing.module';
import { NuevoSolicitudGastosComponent } from './pages/nuevo-solicitud-gastos/nuevo-solicitud-gastos.component';


@NgModule({
  declarations: [
    NuevoSolicitudGastosComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SolicitudGastosRoutingModule
  ]
})
export class SolicitudGastosModule { }

