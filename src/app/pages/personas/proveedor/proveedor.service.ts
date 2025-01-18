import { Injectable } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { ProveedorByIdGQL } from "./graphql/proveedorById";
import { ProveedorPorPersonaGQL } from "./graphql/proveedorPorPersona";
import { ProveedoresSearchByPersonaGQL } from "./graphql/proveedorSearchByPersona";
import { SaveProveedorGQL } from "./graphql/saveProveedor";
import { Proveedor } from "./proveedor.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class ProveedorService {
  constructor(
    private genericService: GenericCrudService,
    public proveedorSearch: ProveedoresSearchByPersonaGQL,
    private saveProveedor: SaveProveedorGQL,
    private proveedorPorId: ProveedorByIdGQL,
    private proveedorPorPersona: ProveedorPorPersonaGQL,
  ) {}

  async onSearch(text: string): Promise<Observable<Proveedor[]>> {
    return (await this.genericService.onGetByTexto(this.proveedorSearch, text));
  }

  async onSave(input): Promise<Observable<Proveedor[]>> {
    return (await this.genericService.onSave(this.saveProveedor, input));
  }

  async onGetPorId(id: number): Promise<Observable<Proveedor>> {
    return (await this.genericService.onGetById(this.proveedorPorId, id));
  }

  async onGetPorPersona(id: number): Promise<Observable<Proveedor>> {
    return (await this.genericService.onCustomGet(this.proveedorPorPersona, {
      personaId: id,
    }));
  }

}
