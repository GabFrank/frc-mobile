import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListConvenioComponent } from './convenio/list-convenio/list-convenio.component';
import { MisFinanzasDashboardComponent } from './mis-finanzas-dashboard/mis-finanzas-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: MisFinanzasDashboardComponent,
  },
  {
    path: 'list-convenio',
    component: ListConvenioComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MisFinanzasRoutingModule { }
