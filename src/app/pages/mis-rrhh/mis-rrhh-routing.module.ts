import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MisRrhhDashboardComponent } from './mis-rrhh-dashboard/mis-rrhh-dashboard.component';
import { AprobacionesRrhhComponent } from './aprobaciones-rrhh/aprobaciones-rrhh.component';

const routes: Routes = [
  { path: '', component: MisRrhhDashboardComponent },
  { path: 'aprobaciones', component: AprobacionesRrhhComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MisRrhhRoutingModule { }
