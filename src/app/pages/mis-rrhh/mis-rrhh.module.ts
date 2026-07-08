import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { MisRrhhRoutingModule } from './mis-rrhh-routing.module';
import { MisRrhhDashboardComponent } from './mis-rrhh-dashboard/mis-rrhh-dashboard.component';

@NgModule({
  declarations: [MisRrhhDashboardComponent],
  imports: [
    CommonModule,
    MisRrhhRoutingModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class MisRrhhModule { }
