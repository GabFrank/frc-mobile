import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RecepcionSeleccionPage } from './recepcion-mercaderia/recepcion-seleccion/recepcion-seleccion.page';
import { RecepcionMercaderiaPage } from './recepcion-mercaderia/recepcion-mercaderia.page';
import { RecepcionAgrupadaPage } from './recepcion-mercaderia/recepcion-agrupada/recepcion-agrupada.page';
import { ConstanciaRecepcionPage } from './recepcion-mercaderia/constancia-recepcion/constancia-recepcion.page';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'recepcion-seleccion',
    pathMatch: 'full'
  },
  {
    path: 'recepcion-seleccion',
    component: RecepcionSeleccionPage
  },
  {
    path: 'recepcion-mercaderia',
    component: RecepcionMercaderiaPage
  },
  {
    path: 'recepcion-agrupada',
    component: RecepcionAgrupadaPage
  },
  {
    path: 'constancia-recepcion',
    component: ConstanciaRecepcionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PedidosPageRoutingModule {}