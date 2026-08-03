import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevolucionComponent } from './devolucion.component';
import { ListDevolucionComponent } from './list-devolucion/list-devolucion.component';
import { DetalleDevolucionComponent } from './detalle-devolucion/detalle-devolucion.component';
import { ColectaDevolucionComponent } from './colecta-devolucion/colecta-devolucion.component';
import { DevolucionHomeComponent } from './devolucion-home/devolucion-home.component';
import { HistorialOperacionesComponent } from './historial-operaciones/historial-operaciones.component';

const routes: Routes = [
  {
    path: '',
    component: DevolucionHomeComponent,
  },
  {
    path: 'historial',
    component: ListDevolucionComponent,
  },
  {
    path: 'historial-colectas',
    component: HistorialOperacionesComponent,
    data: { modo: 'COLECTA' },
  },
  {
    path: 'historial-retiros',
    component: HistorialOperacionesComponent,
    data: { modo: 'RETIRO' },
  },
  {
    path: 'nueva',
    component: DevolucionComponent,
  },
  {
    path: 'colecta',
    component: ColectaDevolucionComponent,
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
