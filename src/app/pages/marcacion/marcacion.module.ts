import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MarcacionRoutingModule } from './marcacion-routing.module';
import { TipoMarcacionComponent } from './marcar-horario/components/tipo-marcacion/tipo-marcacion.component';
import { IdentificacionMarcacionComponent } from './reconocimiento-facial/components/identificacion-marcacion/identificacion-marcacion.component';
import { LocalizacionMarcacionComponent } from './localizacion/components/localizacion-marcacion/localizacion-marcacion.component';
import { IngresoPersonaComponent } from './reconocimiento-facial/components/ingreso-persona/ingreso-persona.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WebcamModule } from 'ngx-webcam';

@NgModule({
  declarations: [
    TipoMarcacionComponent,
    IdentificacionMarcacionComponent,
    LocalizacionMarcacionComponent,
    IngresoPersonaComponent
  ],
  exports: [
    TipoMarcacionComponent,
    IdentificacionMarcacionComponent,
    LocalizacionMarcacionComponent,
    IngresoPersonaComponent
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
