import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MisFinanzasRoutingModule } from './mis-finanzas-routing.module';
import { MisFinanzasDashboardComponent } from './mis-finanzas-dashboard/mis-finanzas-dashboard.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { ListConvenioComponent } from './convenio/list-convenio/list-convenio.component';
import { NgxPaginationModule } from 'ngx-pagination';


@NgModule({
  declarations: [MisFinanzasDashboardComponent, ListConvenioComponent],
  imports: [
    CommonModule,
    MisFinanzasRoutingModule,
    IonicModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule
  ]
})
export class MisFinanzasModule { }
