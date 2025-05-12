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
import { GestionZonaSectorComponent } from './gestion-zona-sector/gestion-zona-sector.component';
import { ListZonasComponent } from './gestion-zona-sector/list-zonas/list-zonas.component';
import { AdicionarSectorComponent } from './gestion-zona-sector/adicionar-sector/adicionar-sector.component';
import { AdicionarZonaComponent } from './gestion-zona-sector/adicionar-zona/adicionar-zona.component';
import { ComponentsModule } from 'src/app/components/components.module';


@NgModule({
  declarations: [InventarioComponent, EditInventarioComponent, ListInventarioComponent, SelectZonaDialogComponent, EditInventarioItemDialogComponent, FinalizarInventarioResumenComponent, NuevoInventarioComponent, GestionZonaSectorComponent, ListZonasComponent, AdicionarSectorComponent, AdicionarZonaComponent],
  imports: [
    CommonModule,
    InventarioRoutingModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    ComponentsModule
    ]
})
export class InventarioModule { }
