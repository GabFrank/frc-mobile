import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificacionComponent } from './notificacion/notificacion.component';
import { ComentariosComponent } from './comentarios/comentarios.component';

const routes: Routes = [{ path: '', component: NotificacionComponent }, { path: 'comentarios', component: ComentariosComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificacionRoutingModule { }
