import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MisRrhhDashboardComponent } from './mis-rrhh-dashboard/mis-rrhh-dashboard.component';

const routes: Routes = [
  { path: '', component: MisRrhhDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MisRrhhRoutingModule { }
