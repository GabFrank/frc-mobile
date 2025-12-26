import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { NotificacionRoutingModule } from './notificacion-routing.module';
import { NotificacionComponent } from './notificacion/notificacion.component';


import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [NotificacionComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    NotificacionRoutingModule,
    ComponentsModule
  ]
})


export class NotificacionModule { }
