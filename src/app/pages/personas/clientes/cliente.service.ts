import { Injectable, inject } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { ClienteSearchByPersonaGQL } from "./graphql/clienteSearchByPersona";
import { SaveClienteGQL } from "./graphql/saveCliente";
import { ClientePorIdGQL } from "./graphql/clientePorId";
import { Cliente } from "./model/cliente.model";
import { SavePersonaGQL } from "./graphql/savePersona";
import { Persona } from "src/app/domains/personas/persona.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
    providedIn: "root",
})
export class ClienteService {
    private genericService = inject(GenericCrudService);
    public clienteSearch = inject(ClienteSearchByPersonaGQL);
    private saveCliente = inject(SaveClienteGQL);
    private clientePorId = inject(ClientePorIdGQL);
    private savePersona = inject(SavePersonaGQL);

    async onSearch(texto: string): Promise<Observable<Cliente[]>> {
        return (await this.genericService.onGetByTexto(this.clienteSearch, texto));
    }

    async onSave(input): Promise<Observable<Cliente>> {
        return (await this.genericService.onSave(this.saveCliente, input));
    }

    async onSavePersona(input): Promise<Observable<Persona>> {
        return (await this.genericService.onCustomSave(this.savePersona, { persona: input }));
    }

    async onGetPorId(id: number): Promise<Observable<Cliente>> {
        return (await this.genericService.onGetById(this.clientePorId, id));
    }
}
