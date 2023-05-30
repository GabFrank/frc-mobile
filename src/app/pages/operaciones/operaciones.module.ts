import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListOperacionesComponent } from './list-operaciones/list-operaciones.component';
import { CajaComponent } from './caja/caja.component';
import { OperacionesRoutingModule } from './operaciones-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { CajaInfoComponent } from './caja-info/caja-info.component';
import { AdicionarConteoDialogComponent } from './conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component';
import { BuscarMaletinDialogComponent } from './caja/buscar-maletin-dialog/buscar-maletin-dialog.component';
import { StockPorSucursalDialogComponent } from './movimiento-stock/stock-por-sucursal-dialog/stock-por-sucursal-dialog.component';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  declarations: [
    ListOperacionesComponent,
    CajaComponent,
    CajaInfoComponent,
    AdicionarConteoDialogComponent,
    BuscarMaletinDialogComponent,
    // StockPorSucursalDialogComponent
  ],
  imports: [
    OperacionesRoutingModule,
    CommonModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserModule
  ],
  exports: [

  ]
})
export class OperacionesModule { }
