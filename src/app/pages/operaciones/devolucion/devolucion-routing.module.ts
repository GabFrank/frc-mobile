import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevolucionComponent } from './devolucion.component';

const routes: Routes = [
  {
    path: '',
    component: DevolucionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevolucionRoutingModule {}
