import { NuevoInventarioComponent } from './nuevo-inventario/nuevo-inventario.component';
import { FinalizarInventarioResumenComponent } from './finalizar-inventario-resumen/finalizar-inventario-resumen.component';
import { EditInventarioItemDialogComponent } from './edit-inventario-item-dialog/edit-inventario-item-dialog.component';
import { SelectZonaDialogComponent } from './select-zona-dialog/select-zona-dialog.component';
import { ListInventarioComponent } from './list-inventario/list-inventario.component';
import { EditInventarioComponent } from './edit-inventario/edit-inventario.component';
import { InventarioComponent } from './inventario.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventarioRoutingModule } from './inventario-routing.module';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';


@NgModule({
  declarations: [InventarioComponent, EditInventarioComponent, ListInventarioComponent, SelectZonaDialogComponent, EditInventarioItemDialogComponent, FinalizarInventarioResumenComponent, NuevoInventarioComponent],
  imports: [
    CommonModule,
    InventarioRoutingModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule
    ]
})
export class InventarioModule { }
