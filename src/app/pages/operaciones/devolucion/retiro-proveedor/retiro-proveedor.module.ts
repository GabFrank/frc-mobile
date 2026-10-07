import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { RetiroProveedorRoutingModule } from './retiro-proveedor-routing.module';
import { RetiroProveedorComponent } from './retiro-proveedor.component';

@NgModule({
  declarations: [RetiroProveedorComponent],
  imports: [
    CommonModule,
    RetiroProveedorRoutingModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class RetiroProveedorModule {}
