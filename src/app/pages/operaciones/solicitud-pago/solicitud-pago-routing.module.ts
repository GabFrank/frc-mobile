import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SolicitudPagoListComponent } from './solicitud-pago-list/solicitud-pago-list.component';
import { SolicitudPagoCreateComponent } from './solicitud-pago-create/solicitud-pago-create.component';

const routes: Routes = [
  {
    path: '',
    component: SolicitudPagoListComponent
  },
  {
    path: 'crear',
    component: SolicitudPagoCreateComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SolicitudPagoRoutingModule {}
