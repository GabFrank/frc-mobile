import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Persona } from 'src/app/domains/personas/persona.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { PersonasListGQL } from '../graphql/personasList';
import { ProveedoresListGQL } from '../graphql/proveedoresList';
import { SavePreGastoGQL } from '../graphql/savePreGasto';
import { TipoGastosGQL } from '../graphql/tipoGastos';
import { PreGastoInput } from '../interfaces';
import { TipoGasto } from '../models/tipo-gasto.model';

/** Tamaño de página al cargar listas completas para los modales de búsqueda. */
const LISTA_COMPLETA_SIZE = 5000;

@Injectable({
  providedIn: 'root',
})
export class SolicitudGastosService {
  constructor(
    private genericService: GenericCrudService,
    private guardarPreGastoGQL: SavePreGastoGQL,
    private tipoGastosGQL: TipoGastosGQL,
    private personasListGQL: PersonasListGQL,
    private proveedoresListGQL: ProveedoresListGQL,
  ) {}

  guardarSolicitudGasto(input: PreGastoInput): Promise<Observable<{ id: number }>> {
    return this.genericService.onSave(this.guardarPreGastoGQL, input);
  }

  listarTiposGasto(page = 0, size = 200): Promise<Observable<TipoGasto[]>> {
    return this.genericService.onGet(this.tipoGastosGQL, { page, size }, false);
  }

  /** Todas las personas (paginado en una sola solicitud grande). */
  listarTodasLasPersonas(page = 0, size = LISTA_COMPLETA_SIZE): Promise<Observable<Persona[]>> {
    return this.genericService.onGet(this.personasListGQL, { page, size }, false);
  }

  /** Todos los proveedores (paginado en una sola solicitud grande). */
  listarTodosLosProveedores(page = 0, size = LISTA_COMPLETA_SIZE): Promise<Observable<Proveedor[]>> {
    return this.genericService.onGet(this.proveedoresListGQL, { page, size }, false);
  }
}
