import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ApolloModule } from 'apollo-angular';

import { PedidosPageRoutingModule } from './pedidos-routing.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { RecepcionMercaderiaPage } from './recepcion-mercaderia/recepcion-mercaderia.page';
import { RecepcionSeleccionPage } from './recepcion-mercaderia/recepcion-seleccion/recepcion-seleccion.page';
import { ValidacionUbicacionComponent } from './recepcion-mercaderia/components/validacion-ubicacion/validacion-ubicacion.component';
import { ConfirmacionNotaComponent } from './recepcion-mercaderia/components/confirmacion-nota/confirmacion-nota.component';
import { QrScannerComponent } from './recepcion-mercaderia/components/qr-scanner/qr-scanner.component';
import { RecepcionAgrupadaPage } from './recepcion-mercaderia/recepcion-agrupada/recepcion-agrupada.page';
import { VerificacionDetalleComponent } from './recepcion-mercaderia/components/verificacion-detalle/verificacion-detalle.component';
import { ConstanciaRecepcionPage } from './recepcion-mercaderia/constancia-recepcion/constancia-recepcion.page';
import { PaginacionComponent } from './components/paginacion/paginacion.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ApolloModule,
    PedidosPageRoutingModule,
    ComponentsModule
  ],
  declarations: [
    RecepcionMercaderiaPage,
    RecepcionSeleccionPage,
    ValidacionUbicacionComponent,
    ConfirmacionNotaComponent,
    QrScannerComponent,
    RecepcionAgrupadaPage,
    VerificacionDetalleComponent,
    ConstanciaRecepcionPage,
    PaginacionComponent
  ]
})
export class PedidosPageModule {}