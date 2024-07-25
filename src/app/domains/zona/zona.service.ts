import { Observable } from 'rxjs';
import { DeleteZonaGQL } from './graphql/deleteZona';
import { SaveZonaGQL } from './graphql/saveZona';
import { ZonasGQL } from './graphql/zonasQuery';
import { ZonaByIdGQL } from './graphql/zonaById';
import { Injectable } from '@angular/core';
import { Zona } from './zona.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class ZonaService {

  constructor(
    private genericCrud: GenericCrudService,
    private getZona: ZonaByIdGQL,
    private getZonas: ZonasGQL,
    private saveZona: SaveZonaGQL,
    private deleteZona: DeleteZonaGQL
    ) { }

  async onGetZona(id): Promise<Observable<Zona>>{
    return await this.genericCrud.onGetById(this.getZona, id);
  }

  async onGetZonas(): Promise<Observable<Zona[]>>{
    return await this.genericCrud.onGetAll(this.getZonas);
  }

  async onSaveZona(input): Promise<Observable<Zona>>{
    return await this.genericCrud.onSave(this.saveZona, input);
  }

  async onDeleteZona(zona: Zona): Promise<Observable<boolean>>{
    return await this.genericCrud.onDelete(this.deleteZona, zona.id, "Realmente desea eliminar esta zona: " , zona.descripcion)
  }
}
