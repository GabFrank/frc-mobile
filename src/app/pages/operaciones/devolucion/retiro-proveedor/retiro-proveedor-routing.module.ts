import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RetiroProveedorComponent } from './retiro-proveedor.component';

const routes: Routes = [
  {
    path: '',
    component: RetiroProveedorComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RetiroProveedorRoutingModule {}
