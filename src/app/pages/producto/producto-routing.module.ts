import { EditProductoComponent } from './edit-producto/edit-producto.component';
import { SearchProductoDialogComponent } from './search-producto-dialog/search-producto-dialog.component';
import { ProductoDashboardComponent } from './producto-dashboard/producto-dashboard.component';

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductoRoutingModule { }
