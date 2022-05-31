import { PreRegistroFuncionarioComponent } from './pre-registro-funcionario/pre-registro-funcionario.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FuncionarioRoutingModule } from './funcionario-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';


@NgModule({
  declarations: [PreRegistroFuncionarioComponent],
  imports: [
    CommonModule,
    FuncionarioRoutingModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
  ]
})
export class FuncionarioModule { }
