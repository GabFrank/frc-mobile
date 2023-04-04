import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InformacionesPersonalesRoutingModule } from './informaciones-personales-routing.module';
import { InformacionesPersonalesDashboardComponent } from './informaciones-personales-dashboard/informaciones-personales-dashboard.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';


@NgModule({
  declarations: [InformacionesPersonalesDashboardComponent],
  imports: [
    CommonModule,
    InformacionesPersonalesRoutingModule,
    CommonModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
  ]
})
export class InformacionesPersonalesModule { }
