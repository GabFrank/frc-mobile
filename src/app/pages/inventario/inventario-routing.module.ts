import { FinalizarInventarioResumenComponent } from './finalizar-inventario-resumen/finalizar-inventario-resumen.component';
import { EditInventarioComponent } from './edit-inventario/edit-inventario.component';
import { ListInventarioComponent } from './list-inventario/list-inventario.component';
import { InventarioComponent } from './inventario.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: InventarioComponent,
  },
  {
    path: 'list',
    component: ListInventarioComponent,
  },
  {
    path: 'new',
    component: EditInventarioComponent,
  },
  {
    path: 'list/info/:id',
    component: EditInventarioComponent
  },
  {
    path: 'list/info/:id/finalizar',
    component: FinalizarInventarioResumenComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule { }
