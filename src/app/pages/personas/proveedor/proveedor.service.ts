import { Injectable } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { ProveedorByIdGQL } from "./graphql/proveedorById";
import { ProveedorPorPersonaGQL } from "./graphql/proveedorPorPersona";
import { ProveedoresSearchByPersonaGQL } from "./graphql/proveedorSearchByPersona";
import { SaveProveedorGQL } from "./graphql/saveProveedor";
import { Proveedor } from "./proveedor.model";
import { ProveedoresSearchByPersonaPageGQL } from "./graphql/proveedorSearchByPersonaPage";
import { PageInfo } from "src/app/app.component";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class ProveedorService {
  constructor(
    private genericService: GenericCrudService,
    public proveedorSearch: ProveedoresSearchByPersonaGQL,
    public proveedorSearchPage: ProveedoresSearchByPersonaPageGQL,
    private saveProveedor: SaveProveedorGQL,
    private proveedorPorId: ProveedorByIdGQL,
    private proveedorPorPersona: ProveedorPorPersonaGQL,
  ) {}

  async onSearch(texto: string): Promise<Observable<Proveedor[]>> {
    return (await this.genericService.onGetByTexto(this.proveedorSearch, texto));
  }

  async onSearchWithPage(texto: string, page, size): Promise<Observable<PageInfo<Proveedor>>> {
    return (await this.genericService.onCustomGet(this.proveedorSearchPage, {texto, page, size}));
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
