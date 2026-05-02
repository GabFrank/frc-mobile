import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NuevoSolicitudGastosComponent } from './pages/nuevo-solicitud-gastos/nuevo-solicitud-gastos.component';

const routes: Routes = [{
  path: '',
  component: NuevoSolicitudGastosComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SolicitudGastosRoutingModule { }
