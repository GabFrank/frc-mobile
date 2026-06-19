import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Marcacion, MarcacionInput, Jornada } from '../models/marcacion.model';
import { SaveMarcacionGQL } from '../graphql/saveMarcacion';
import { GetMarcacionesPorUsuarioGQL } from '../graphql/getMarcacionesPorUsuario';
import { GetJornadasPorUsuarioGQL } from '../graphql/getJornadasPorUsuario';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';

const SUCURSAL_PERSISTIDA_STORAGE_KEY = 'sucursalPersistida';

@Injectable({
    providedIn: 'root',
})
export class MarcacionService {

    private readonly genericCrudService = inject(GenericCrudService);
    private readonly saveMarcacionGQL = inject(SaveMarcacionGQL);
    private readonly getMarcacionesPorUsuarioGQL = inject(GetMarcacionesPorUsuarioGQL);
    private readonly getJornadasPorUsuarioGQL = inject(GetJornadasPorUsuarioGQL);

    private readonly sucursalPersistidaSubject = new BehaviorSubject<Sucursal | null>(
        this.cargarSucursalPersistidaDesdeStorage()
    );

    readonly sucursalPersistida$ = this.sucursalPersistidaSubject.asObservable();

    obtenerSucursalPersistida(): Sucursal | null {
        return this.sucursalPersistidaSubject.value;
    }

    guardarSucursalPersistida(sucursal: Sucursal | null): void {
        this.sucursalPersistidaSubject.next(sucursal);
        if (sucursal) {
            localStorage.setItem(SUCURSAL_PERSISTIDA_STORAGE_KEY, JSON.stringify(sucursal));
            return;
        }
        localStorage.removeItem(SUCURSAL_PERSISTIDA_STORAGE_KEY);
    }

    limpiarSucursalPersistida(): void {
        this.guardarSucursalPersistida(null);
    }

    private cargarSucursalPersistidaDesdeStorage(): Sucursal | null {
        const saved = localStorage.getItem(SUCURSAL_PERSISTIDA_STORAGE_KEY);
        if (!saved) {
            return null;
        }
        try {
            return JSON.parse(saved) as Sucursal;
        } catch {
            localStorage.removeItem(SUCURSAL_PERSISTIDA_STORAGE_KEY);
            return null;
        }
    }

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

