import { EditProductoComponent } from './edit-producto/edit-producto.component';
import { ProductoDashboardComponent } from './producto-dashboard/producto-dashboard.component';
import { ProductoRoutingModule } from './producto-routing.module';
import { SearchProductoDialogComponent } from './search-producto-dialog/search-producto-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';



@NgModule({
  declarations: [ProductoDashboardComponent, EditProductoComponent, SearchProductoDialogComponent],
  imports: [
    ProductoRoutingModule,
    CommonModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
  ]
})
export class ProductoModule { }
