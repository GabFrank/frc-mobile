import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { inicioSesionListPorUsuarioIdAndAbiertoGQL } from './graphql-query';
import { InicioSesion } from 'src/app/domains/configuracion/inicio-sesion.model';

@Injectable({
  providedIn: 'root',
})
export class InicioSesionListPorUsuarioIdAndAbiertoGQL extends Query<PageInfo<InicioSesion>> {
  document = inicioSesionListPorUsuarioIdAndAbiertoGQL;
}
