import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { NotificacionRoutingModule } from './notificacion-routing.module';
import { NotificacionComponent } from './notificacion/notificacion.component';
import { ComentariosComponent } from './comentarios/comentarios.component';
import { NotificacionMenuComponent } from './notificacion-menu/notificacion-menu.component';
import { PreferenciasComponent } from './preferencias/preferencias.component';
import { CrearNotificacionComponent } from './crear-notificacion/crear-notificacion.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [
    NotificacionComponent,
    ComentariosComponent,
    NotificacionMenuComponent,
    PreferenciasComponent,
    CrearNotificacionComponent
  ],
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
