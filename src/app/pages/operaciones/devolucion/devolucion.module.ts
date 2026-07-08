import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { DevolucionRoutingModule } from './devolucion-routing.module';
import { DevolucionComponent } from './devolucion.component';
import { DevolucionItemDialogComponent } from './devolucion-item-dialog/devolucion-item-dialog.component';

@NgModule({
  declarations: [DevolucionComponent, DevolucionItemDialogComponent],
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
