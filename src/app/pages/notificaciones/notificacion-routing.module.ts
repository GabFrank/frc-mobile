import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificacionComponent } from './notificacion/notificacion.component';
import { ComentariosComponent } from './comentarios/comentarios.component';

import { NotificacionMenuComponent } from './notificacion-menu/notificacion-menu.component';
import { PreferenciasComponent } from './preferencias/preferencias.component';
import { CrearNotificacionComponent } from './crear-notificacion/crear-notificacion.component';

const routes: Routes = [
  { path: '', component: NotificacionMenuComponent },
  { path: 'lista', component: NotificacionComponent },
  { path: 'preferencias', component: PreferenciasComponent },
  { path: 'comentarios/:id', component: ComentariosComponent },
  { path: 'crear-notificacion', component: CrearNotificacionComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificacionRoutingModule { }
