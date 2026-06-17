import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SolicitudGastosRoutingModule } from './solicitud-gastos-routing.module';
import { NuevoSolicitudGastosComponent } from './pages/nuevo-solicitud-gastos/nuevo-solicitud-gastos.component';
import { ComponentsModule } from 'src/app/components/components.module';
import { SolicitudComponent } from './pages/solicitud/solicitud.component';
import { ListSolicitudGastosComponent } from './pages/list-solicitud-gastos/list-solicitud-gastos.component';
import { DetalleSolicitudGastosComponent } from './pages/detalle-solicitud-gastos/detalle-solicitud-gastos.component';
import { AgregarRendicionGastoComponent } from './pages/agregar-rendicion-gasto/agregar-rendicion-gasto.component';


@NgModule({
  declarations: [
    NuevoSolicitudGastosComponent,
    SolicitudComponent,
    ListSolicitudGastosComponent,
    DetalleSolicitudGastosComponent,
    AgregarRendicionGastoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SolicitudGastosRoutingModule,
    ComponentsModule
  ]
})
export class SolicitudGastosModule { }

