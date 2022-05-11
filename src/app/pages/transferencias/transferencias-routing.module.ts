import { InfoTransferenciaComponent } from './info-transferencia/info-transferencia.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { ListTransferenciasComponent } from './list-transferencias/list-transferencias.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: TransferenciaComponent,
  },
  {
    path: 'list',
    component: ListTransferenciasComponent,
  },
  {
    path: 'list/info/:id',
    component: InfoTransferenciaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransferenciasRoutingModule { }
