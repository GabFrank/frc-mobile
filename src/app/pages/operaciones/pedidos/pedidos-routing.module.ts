import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PedidosComponent } from './pedidos.component';
import { RecepcionNotasComponent } from './recepcion-notas/recepcion-notas.component';

const routes: Routes = [
  {
    path: '',
    component: PedidosComponent
  },
  {
    path: 'recibir-nota-recepcion',
    component: RecepcionNotasComponent
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PedidosRoutingModule { }
