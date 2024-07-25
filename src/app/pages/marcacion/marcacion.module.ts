import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MarcacionRoutingModule } from './marcacion-routing.module';
import { MarcacionComponent } from './marcacion.component';
import { TipoMarcacionComponent } from './tipo-marcacion/tipo-marcacion.component';
import { IdentificacionMarcacionComponent } from './identificacion-marcacion/identificacion-marcacion.component';
import { LocalizacionMarcacionComponent } from './localizacion-marcacion/localizacion-marcacion.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WebcamModule } from 'ngx-webcam';

@NgModule({
  declarations: [
    MarcacionComponent,
    TipoMarcacionComponent,
    IdentificacionMarcacionComponent,
    LocalizacionMarcacionComponent
  ],
  exports: [
    MarcacionComponent,
    TipoMarcacionComponent,
    IdentificacionMarcacionComponent,
    LocalizacionMarcacionComponent
  ],
  imports: [
    CommonModule,
    MarcacionRoutingModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    WebcamModule

  ]
})
export class MarcacionModule { }
