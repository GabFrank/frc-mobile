import { EditProductoComponent } from './edit-producto/edit-producto.component';
import { ProductoDashboardComponent } from './producto-dashboard/producto-dashboard.component';
import { ProductoRoutingModule } from './producto-routing.module';
import { SearchProductoDialogComponent } from './search-producto-dialog/search-producto-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { ConsultarPrecioDashboardComponent } from './consultar-precio-dashboard/consultar-precio-dashboard.component';
import { MostrarPrecioComponent } from './mostrar-precio/mostrar-precio.component';
import { PrecioConfigComponent } from './precio-config/precio-config.component';
import {ZXingScannerModule} from '@zxing/ngx-scanner';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProductoControlComponent } from './producto-control/producto-control.component';
import { CalendarModule } from 'ion7-calendar';
import {NgxPaginationModule} from 'ngx-pagination';
import { ProductoControlDialogComponent } from './producto-control-dialog/producto-control-dialog.component';

@NgModule({
  declarations: [
    ProductoDashboardComponent,
    EditProductoComponent, 
    SearchProductoDialogComponent, 
    ConsultarPrecioDashboardComponent, 
    MostrarPrecioComponent,
    PrecioConfigComponent,
    ProductoControlComponent,
    ProductoControlDialogComponent
    ],
  imports: [
    ProductoRoutingModule,
    CommonModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    ZXingScannerModule,
    CalendarModule,
    NgxPaginationModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProductoModule { }
