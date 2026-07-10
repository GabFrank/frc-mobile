import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListVentaTarjetaComponent } from './list-venta-tarjeta/list-venta-tarjeta.component';
import { ScanVentaTarjetaComponent } from './scan-venta-tarjeta/scan-venta-tarjeta.component';
import { RegistroVentaTarjetaComponent } from './add-venta-tarjeta/add-venta-tarjeta.component';

const routes: Routes = [
  { path: '', component: ListVentaTarjetaComponent },
  { path: 'scan', component: ScanVentaTarjetaComponent },
  { path: 'registro', component: RegistroVentaTarjetaComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VentaTarjetaRoutingModule {}
