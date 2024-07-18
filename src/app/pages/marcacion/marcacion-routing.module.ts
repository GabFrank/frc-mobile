import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IdentificacionMarcacionComponent } from './identificacion-marcacion/identificacion-marcacion.component';
import { LocalizacionMarcacionComponent } from './localizacion-marcacion/localizacion-marcacion.component';
import { TipoMarcacionComponent } from './tipo-marcacion/tipo-marcacion.component';

const routes: Routes = [
  {
    path: '',
    component: TipoMarcacionComponent
  },
  {
    path: 'localizacion/:arg',
    component: LocalizacionMarcacionComponent
  },
  {
    path: 'localizacion/:arg/identificacion/:sucId',
    component: IdentificacionMarcacionComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MarcacionRoutingModule {}
