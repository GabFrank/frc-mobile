import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PedidosComponent } from './pedidos.component';
import { RecepcionNotasComponent } from './nota-recepcion/recepcion-notas/recepcion-notas.component';
import { HistoricoNotaRecepcionComponent } from './nota-recepcion/historico-nota-recepcion/historico-nota-recepcion.component';
import { RecepcionProductoComponent } from './nota-recepcion/recepcion-producto/recepcion-producto.component';

const routes: Routes = [
  {
    path: '',
    component: PedidosComponent
  },
  {
    path: 'recibir-nota-recepcion',
    component: RecepcionNotasComponent
  },
  {
    path: 'historico-nota-recepcion',
    component: HistoricoNotaRecepcionComponent
  },
  {
    path: 'recepcion-producto/:id',
    component: RecepcionProductoComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PedidosRoutingModule { }
