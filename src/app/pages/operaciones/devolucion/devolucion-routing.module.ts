import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevolucionComponent } from './devolucion.component';
import { ListDevolucionComponent } from './list-devolucion/list-devolucion.component';
import { DetalleDevolucionComponent } from './detalle-devolucion/detalle-devolucion.component';

const routes: Routes = [
  {
    path: '',
    component: ListDevolucionComponent,
  },
  {
    path: 'nueva',
    component: DevolucionComponent,
  },
  {
    path: 'detalle/:id',
    component: DetalleDevolucionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevolucionRoutingModule {}
