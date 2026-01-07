import { Injectable } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { ClienteSearchByPersonaGQL } from "./graphql/clienteSearchByPersona";
import { SaveClienteGQL } from "./graphql/saveCliente";
import { ClientePorIdGQL } from "./graphql/clientePorId";
import { Cliente } from "./model/cliente.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
    providedIn: "root",
})
export class ClienteService {
    constructor(
        private genericService: GenericCrudService,
        public clienteSearch: ClienteSearchByPersonaGQL,
        private saveCliente: SaveClienteGQL,
        private clientePorId: ClientePorIdGQL,
    ) { }

    async onSearch(texto: string): Promise<Observable<Cliente[]>> {
        return (await this.genericService.onGetByTexto(this.clienteSearch, texto));
    }

    async onSave(input): Promise<Observable<Cliente>> {
        return (await this.genericService.onSave(this.saveCliente, input));
    }

    async onGetPorId(id: number): Promise<Observable<Cliente>> {
        return (await this.genericService.onGetById(this.clientePorId, id));
    }
}
