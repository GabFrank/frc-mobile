import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { NotificacionRoutingModule } from './notificacion-routing.module';
import { NotificacionComponent } from './notificacion/notificacion.component';


@NgModule({
  declarations: [NotificacionComponent],
  imports: [
    CommonModule,
    IonicModule,
    NotificacionRoutingModule
  ]
})

export class NotificacionModule { }
