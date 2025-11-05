import { InfoTransferenciaComponent } from './info-transferencia/info-transferencia.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { ListTransferenciasComponent } from './list-transferencias/list-transferencias.component';
import { NuevaTransferenciaComponent } from './nueva-transferencia/nueva-transferencia.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransaferenciaListProductosComponent } from './transaferencia-list-productos/transaferencia-list-productos.component';
import { EditTransferenciaProductoComponent } from './edit-transferencia-producto/edit-transferenci-producto.component';

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
    path: 'nueva',
    component: NuevaTransferenciaComponent
  },
  {
    path: 'list/info/:id',
    component: InfoTransferenciaComponent
  },
  {
    path: 'gestion-productos', // ← AGREGAR ESTA RUTA
    component: TransaferenciaListProductosComponent
  },
  {
    path: 'edit/new',
    component: EditTransferenciaProductoComponent
  },
  {
    path: 'edit/:id',
    component: EditTransferenciaProductoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransferenciasRoutingModule { }
