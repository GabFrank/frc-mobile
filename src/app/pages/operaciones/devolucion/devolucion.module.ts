import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { DevolucionRoutingModule } from './devolucion-routing.module';
import { DevolucionComponent } from './devolucion.component';
import { DevolucionItemDialogComponent } from './devolucion-item-dialog/devolucion-item-dialog.component';
import { ListDevolucionComponent } from './list-devolucion/list-devolucion.component';
import { DetalleDevolucionComponent } from './detalle-devolucion/detalle-devolucion.component';
import { ColectaDevolucionComponent } from './colecta-devolucion/colecta-devolucion.component';

@NgModule({
  declarations: [DevolucionComponent, DevolucionItemDialogComponent, ListDevolucionComponent, DetalleDevolucionComponent, ColectaDevolucionComponent],
  imports: [
    CommonModule,
    DevolucionRoutingModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class DevolucionModule {}
