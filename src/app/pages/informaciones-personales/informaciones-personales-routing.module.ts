import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InformacionesPersonalesDashboardComponent } from './informaciones-personales-dashboard/informaciones-personales-dashboard.component';
import { HuellaDigitalComponent } from './huella-digital/huella-digital.component';

const routes: Routes = [
  {
    path: '',
    component: InformacionesPersonalesDashboardComponent
  },
  {
    path: 'huella-digital',
    component: HuellaDigitalComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InformacionesPersonalesRoutingModule { }
