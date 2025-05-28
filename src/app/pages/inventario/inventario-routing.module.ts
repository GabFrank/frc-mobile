import { NuevoInventarioComponent } from './nuevo-inventario/nuevo-inventario.component';
import { FinalizarInventarioResumenComponent } from './finalizar-inventario-resumen/finalizar-inventario-resumen.component';
import { EditInventarioComponent } from './edit-inventario/edit-inventario.component';
import { ListInventarioComponent } from './list-inventario/list-inventario.component';
import { InventarioComponent } from './inventario.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionZonaSectorComponent } from './gestion-zona-sector/gestion-zona-sector.component';
import { ListZonasComponent } from './gestion-zona-sector/list-zonas/list-zonas.component';
import { AdicionarSectorComponent } from './gestion-zona-sector/adicionar-sector/adicionar-sector.component';
import { AdicionarZonaComponent } from './gestion-zona-sector/adicionar-zona/adicionar-zona.component';
import { RevisarInventarioComponent } from './revisar-inventario/revisar-inventario.component';
import { ControlInventarioComponent } from './control-inventario/control-inventario.component';
const routes: Routes = [
  {
    path: '',
    component: InventarioComponent,
  },
  {
    path: 'list',
    component: ListInventarioComponent,
  },
  {
    path: 'control-inventario',
    component: ControlInventarioComponent
  },
  {
    path: 'list/info/:id',
    component: EditInventarioComponent
  },
  {
    path: 'list/info/:id/finalizar',
    component: FinalizarInventarioResumenComponent
  },
  {
    path: 'list/info/:id/gestion-zona-sector/:sucursalId',
    component: GestionZonaSectorComponent
  },
  {
    path: 'list/info/:id/gestion-zona-sector/:sucursalId/list-zonas/:sectorId',
    component: ListZonasComponent
  },
  {
    path: 'list/info/:id/gestion-zona-sector/:sucursalId/list-zonas',
    component: ListZonasComponent
  },
  {
    path: 'list/info/:id/gestion-zona-sector/:sucursalId/list-zonas/:sectorId/adicionar-zona/:zonaId',
    component: AdicionarZonaComponent
  },
  {
    path: 'list/info/:id/gestion-zona-sector/:sucursalId/adicionar-sector/:sectorId',
    component: AdicionarSectorComponent
  },
  {
    path: 'list/info/:id/gestion-zona-sector/:sucursalId/list-zonas/:sectorId/adicionar-zona',
    component: AdicionarZonaComponent
  },
  {
    path: 'list/info/:id/gestion-zona-sector/:sucursalId/adicionar-sector',
    component: AdicionarSectorComponent
  },
  {
    path: 'list/info/:id/revisar',
    component: RevisarInventarioComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule { }
