import { EditProductoComponent } from './edit-producto/edit-producto.component';
import { SearchProductoDialogComponent } from './search-producto-dialog/search-producto-dialog.component';
import { ProductoDashboardComponent } from './producto-dashboard/producto-dashboard.component';

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultarPrecioDashboardComponent } from './consultar-precio-dashboard/consultar-precio-dashboard.component';
import { MostrarPrecioComponent } from './mostrar-precio/mostrar-precio.component';
import { PrecioConfigComponent } from './precio-config/precio-config.component';
import { ProductoControlComponent } from './producto-control/producto-control.component';
import { ProductoControlDialogComponent } from './producto-control-dialog/producto-control-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: ProductoDashboardComponent,
  },
  {
    path: 'buscar/:mostrarPrecio',
    component: SearchProductoDialogComponent,
  },
  {
    path: 'edit/:id', // producto/edit/1
    component: EditProductoComponent,
  },
  {
    path: 'consultar-precio',
    component: ConsultarPrecioDashboardComponent
  },
  {
    path: 'mostrar-precio',
    component: MostrarPrecioComponent
  },
  {
    path: 'precio-config',
    component: PrecioConfigComponent
  },
  {
    path: 'controlar-producto',
    component: ProductoControlComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductoRoutingModule { }
