import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListVentaTarjetaComponent } from './list-venta-tarjeta/list-venta-tarjeta.component';
import { ScanVentaTarjetaComponent } from './scan-venta-tarjeta/scan-venta-tarjeta.component';
import { RegistroVentaTarjetaComponent } from './add-venta-tarjeta/add-venta-tarjeta.component';
import { VentaTarjetaHabilitadaGuard } from './guards/venta-tarjeta-habilitada.guard';

const routes: Routes = [
  { path: '', component: ListVentaTarjetaComponent, canActivate: [VentaTarjetaHabilitadaGuard] },
  { path: 'scan', component: ScanVentaTarjetaComponent, canActivate: [VentaTarjetaHabilitadaGuard] },
  { path: 'registro', component: RegistroVentaTarjetaComponent, canActivate: [VentaTarjetaHabilitadaGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VentaTarjetaRoutingModule {}
