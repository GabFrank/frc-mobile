import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevolucionComponent } from './devolucion.component';
import { ListDevolucionComponent } from './list-devolucion/list-devolucion.component';

const routes: Routes = [
  {
    path: '',
    component: ListDevolucionComponent,
  },
  {
    path: 'nueva',
    component: DevolucionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevolucionRoutingModule {}
