import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CajaInfoComponent } from './caja-info/caja-info.component';
import { CajaComponent } from './caja/caja.component';
import { ListOperacionesComponent } from './list-operaciones/list-operaciones.component';

const routes: Routes = [
  {
    path: '',
    component: ListOperacionesComponent
  },
  {
    path: 'caja',
    component: CajaComponent,
  },
  {
    path: 'caja/info',
    component: CajaInfoComponent
  },
  {
    path: 'pedidos',
    loadChildren: () => import('./pedidos/pedidos.module').then(m => m.PedidosModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperacionesRoutingModule { }
