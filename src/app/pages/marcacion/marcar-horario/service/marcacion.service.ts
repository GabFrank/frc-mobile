import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Marcacion, MarcacionInput, Jornada } from '../models/marcacion.model';
import { SaveMarcacionGQL } from '../graphql/saveMarcacion';
import { GetMarcacionesPorUsuarioGQL } from '../graphql/getMarcacionesPorUsuario';
import { GetJornadasPorUsuarioGQL } from '../graphql/getJornadasPorUsuario';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';

@Injectable({
    providedIn: 'root',
})
export class MarcacionService {
    constructor(
        private genericCrudService: GenericCrudService,
        private saveMarcacionGQL: SaveMarcacionGQL,
        private getMarcacionesPorUsuarioGQL: GetMarcacionesPorUsuarioGQL,
        private getJornadasPorUsuarioGQL: GetJornadasPorUsuarioGQL
    ) { }

    async onSaveMarcacion(input: MarcacionInput): Promise<Observable<Marcacion>> {
        return await this.genericCrudService.onSave(this.saveMarcacionGQL, input);
    }

    async onGetMarcacionesPorUsuario(usuarioId: number, fechaInicio?: string, fechaFin?: string, page?: number, size?: number): Promise<Observable<any>> {
        return await this.genericCrudService.onGetCustom(this.getMarcacionesPorUsuarioGQL, { usuarioId, fechaInicio, fechaFin, page, size });
    }

    async onGetJornadasPorUsuario(usuarioId: number, fechaInicio?: string, fechaFin?: string): Promise<Observable<Jornada[]>> {
        return await this.genericCrudService.onGetCustom(this.getJornadasPorUsuarioGQL, { usuarioId, fechaInicio, fechaFin });
    }
}
