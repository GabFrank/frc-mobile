import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PedidosRoutingModule } from './pedidos-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { PedidosComponent } from './pedidos.component';
import { RecepcionNotasComponent } from './nota-recepcion/recepcion-notas/recepcion-notas.component';
import { NotaRecepcionInfoDialogComponent } from './nota-recepcion/nota-recepcion-info-dialog/nota-recepcion-info-dialog.component';
import { HistoricoNotaRecepcionComponent } from './nota-recepcion/historico-nota-recepcion/historico-nota-recepcion.component';
import { RecepcionProductoComponent } from './nota-recepcion/recepcion-producto/recepcion-producto.component';
import { RecepcionProductoVerificacionDialogComponent } from './nota-recepcion/recepcion-producto-verificacion-dialog/recepcion-producto-verificacion-dialog.component';
import { SeleccionarNotaItemRechazoDialogComponent } from './nota-recepcion/seleccionar-nota-item-rechazo-dialog/seleccionar-nota-item-rechazo-dialog.component';
import { SolicitarPagoNotaRecepcionComponent } from './nota-recepcion/solicitar-pago-nota-recepcion/solicitar-pago-nota-recepcion.component';
import { ConstanciaRecepcionPdfDialogComponent } from './nota-recepcion/constancia-recepcion-pdf-dialog/constancia-recepcion-pdf-dialog.component';

@NgModule({
  declarations: [
    PedidosComponent,
    RecepcionNotasComponent, 
    NotaRecepcionInfoDialogComponent, 
    HistoricoNotaRecepcionComponent, 
    RecepcionProductoComponent, 
    RecepcionProductoVerificacionDialogComponent,
    SeleccionarNotaItemRechazoDialogComponent,
    SolicitarPagoNotaRecepcionComponent,
    ConstanciaRecepcionPdfDialogComponent
  ],
  imports: [
    CommonModule,
    PedidosRoutingModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
  ]
})
export class PedidosModule { }
