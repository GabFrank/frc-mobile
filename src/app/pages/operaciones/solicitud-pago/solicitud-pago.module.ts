import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SolicitudPagoRoutingModule } from './solicitud-pago-routing.module';
import { SolicitudPagoListComponent } from './solicitud-pago-list/solicitud-pago-list.component';
import { SolicitudPagoCreateComponent } from './solicitud-pago-create/solicitud-pago-create.component';
import { SolicitudPagoPdfDialogComponent } from './solicitud-pago-pdf-dialog/solicitud-pago-pdf-dialog.component';

@NgModule({
  declarations: [
    SolicitudPagoListComponent,
    SolicitudPagoCreateComponent,
    SolicitudPagoPdfDialogComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    SolicitudPagoRoutingModule
  ]
})
export class SolicitudPagoModule {}
