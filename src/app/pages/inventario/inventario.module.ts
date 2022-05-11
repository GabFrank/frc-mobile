import { InventarioProductoItemComponent } from './producto-info/inventario-producto-item/inventario-producto-item.component';
import { ProductoInfoComponent } from './producto-info/producto-info.component';
import { SessionInfoComponent } from './session-info/session-info.component';
import { InventarioComponent } from './inventario.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventarioRoutingModule } from './inventario-routing.module';
import { IonicModule } from '@ionic/angular';


@NgModule({
  declarations: [InventarioComponent, SessionInfoComponent, ProductoInfoComponent, InventarioProductoItemComponent],
  imports: [
    CommonModule,
    InventarioRoutingModule,
    IonicModule  ]
})
export class InventarioModule { }
