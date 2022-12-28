import { Injectable } from '@angular/core';
import { ApolloBase } from 'apollo-angular';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/domains/cliente/cliente.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { ClienteByIdGQL } from './clienteById';
import { ClientePersonaDocumentoGQL } from './clientePorPersonaDocumento';
import { ClientePersonaIdFromServerGQL } from './clientePorPersonaIdFromServer';
import { ClientesSearchByPersonaGQL } from './clienteSearchByPersona';
import { ClientesSearchByPersonaIdGQL } from './clienteSearchByPersonaId';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apollo: ApolloBase;

  constructor(
    private genericService: GenericCrudService,
    private getClienteById: ClienteByIdGQL,
    public searchByPersonaNombre: ClientesSearchByPersonaGQL,
    private getClientePorPersonaDocumento: ClientePersonaDocumentoGQL,
    private getClientePorPersonaId: ClientesSearchByPersonaIdGQL,
    private getClientePorPersonaIdFromServer: ClientePersonaIdFromServerGQL,
  ) {
  }

  async onGetClientePorPersonaDocumento(texto: string): Promise<Observable<Cliente>>{
    return await this.genericService.onGetByTexto(this.getClientePorPersonaDocumento, texto)
  }

  async onGetById(id: number): Promise<Observable<Cliente[]>> {
    return await this.genericService.onGetById<Cliente[]>(this.getClienteById, id);
  }

  async onGetByIdFromServer(id: number): Promise<Observable<Cliente>> {
    return await this.genericService.onGetById(this.getClientePorPersonaIdFromServer, id);
  }

  async onGetByPersonaId(id: number): Promise<Observable<Cliente>> {
    return await this.genericService.onGetById(this.getClientePorPersonaId, id);
  }

  async onSearch(texto: string): Promise<Observable<Cliente[]>> {
    return await this.genericService.onGetByTexto(this.searchByPersonaNombre, texto);
  }

  async onGetByPersonaIdFromServer(id: number): Promise<Observable<Cliente>> {
    return await this.genericService.onGetById(this.getClientePorPersonaId, id, null, null, true);
  }


}
