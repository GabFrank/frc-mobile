import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificacionRoutingModule } from './notificacion-routing.module';
import { NotificacionComponent } from './notificacion/notificacion.component';


@NgModule({
  declarations: [NotificacionComponent],
  imports: [
    CommonModule,
    NotificacionRoutingModule
  ]
})
export class NotificacionModule { }
