import { InventarioProductoItemComponent } from './producto-info/inventario-producto-item/inventario-producto-item.component';
import { InventarioComponent } from './inventario.component';
import { ProductoInfoComponent } from './producto-info/producto-info.component';
import { SessionInfoComponent } from './session-info/session-info.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: InventarioComponent,
    children: [
      {
        path: 'session-info',
        component: SessionInfoComponent
      },
      {
        path: 'producto-info',
        component: ProductoInfoComponent,
      },
      {
        path: 'inventario-producto-item/:id',
        component: InventarioProductoItemComponent
      },

    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule { }
