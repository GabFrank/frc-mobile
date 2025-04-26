import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ProductoRoutingModule } from './producto-routing.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { EditProductoComponent } from './edit-producto/edit-producto.component';
import { ProductoDashboardComponent } from './producto-dashboard/producto-dashboard.component';
import { SearchProductoDialogComponent } from './search-producto-dialog/search-producto-dialog.component';
import { ConsultarPrecioDashboardComponent } from './consultar-precio-dashboard/consultar-precio-dashboard.component';
import { MostrarPrecioComponent } from './mostrar-precio/mostrar-precio.component';
import { PrecioConfigComponent } from './precio-config/precio-config.component';
import { ProductoVerificacionDialogComponent } from './producto-verificacion-dialog/producto-verificacion-dialog.component';

@NgModule({
  declarations: [
    ProductoDashboardComponent,
    EditProductoComponent, 
    SearchProductoDialogComponent, 
    ConsultarPrecioDashboardComponent, 
    MostrarPrecioComponent,
    PrecioConfigComponent, 
    ProductoVerificacionDialogComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    ComponentsModule,
    ProductoRoutingModule,
    ZXingScannerModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProductoModule { }
