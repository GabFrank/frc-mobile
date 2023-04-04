import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InformacionesPersonalesDashboardComponent } from './informaciones-personales-dashboard/informaciones-personales-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: InformacionesPersonalesDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InformacionesPersonalesRoutingModule { }
