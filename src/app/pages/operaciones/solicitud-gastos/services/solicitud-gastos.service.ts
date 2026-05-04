import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Persona } from 'src/app/domains/personas/persona.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { PersonaSearchPageGQL, PersonaPageResponse } from '../graphql/personaSearchPage';
import { ProveedorSearchByPersonaPageGQL, ProveedorPageResponse } from '../graphql/proveedorSearchByPersonaPage';
import { SavePreGastoGQL } from '../graphql/savePreGasto';
import { TipoGastosGQL } from '../graphql/tipoGastos';
import { PreGastoInput } from '../interfaces';
import { TipoGasto } from '../models/tipo-gasto.model';

/** Tamaño de página por defecto para modales de búsqueda (backend ya pagina). */
export const TAM_PAGINA_BUSQUEDA = 25;

export type PersonaPageDto = NonNullable<PersonaPageResponse['data']>;
export type ProveedorPageDto = NonNullable<ProveedorPageResponse['data']>;
@Injectable({
  providedIn: 'root',
})
export class SolicitudGastosService {
  constructor(
    private genericService: GenericCrudService,
    private guardarPreGastoGQL: SavePreGastoGQL,
    private tipoGastosGQL: TipoGastosGQL,
    private personaSearchPageGQL: PersonaSearchPageGQL,
    private proveedorSearchByPersonaPageGQL: ProveedorSearchByPersonaPageGQL,
  ) {}

  guardarSolicitudGasto(input: PreGastoInput): Promise<Observable<{ id: number }>> {
    return this.genericService.onSave(this.guardarPreGastoGQL, input);
  }

  listarTiposGasto(page = 0, size = 200): Promise<Observable<TipoGasto[]>> {
    return this.genericService.onGet(this.tipoGastosGQL, { page, size }, false);
  }

  personasPaginadas(texto: string | null, page: number, size = TAM_PAGINA_BUSQUEDA): Promise<Observable<PersonaPageDto>> {
    return this.genericService.onGet(this.personaSearchPageGQL, { texto: texto ?? '', page, size }, false);
  }

  proveedoresPaginados(texto: string | null, page: number, size = TAM_PAGINA_BUSQUEDA): Promise<Observable<ProveedorPageDto>> {
    return this.genericService.onGet(this.proveedorSearchByPersonaPageGQL, { texto: texto ?? '', page, size }, false);
  }
}
