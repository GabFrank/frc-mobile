import { Observable } from 'rxjs';
import { DeleteSectorGQL } from './graphql/deleteSector';
import { SaveSectorGQL } from './graphql/saveSector';
import { SectoresGQL } from './graphql/sectoresQuery';
import { SectorByIdGQL } from './graphql/sectorById';
import { onError } from '@apollo/client/link/error';
import { Injectable } from '@angular/core';
import { Sector } from './sector.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class SectorService {

  constructor(
    private genericCrud: GenericCrudService,
    private getSector: SectorByIdGQL,
    private getSectores: SectoresGQL,
    private saveSector: SaveSectorGQL,
    private deleteSector: DeleteSectorGQL
    ) { }

  async onGetSector(id): Promise<Observable<Sector>>{
    return await this.genericCrud.onGetById(this.getSector, id);
  }

  async onGetSectores(sucursalId: number, showLoading: boolean = true): Promise<Observable<Sector[]>>{
    return await this.genericCrud.onGetById(this.getSectores, sucursalId, undefined, undefined, undefined, showLoading);
  }

  async onSaveSector(input): Promise<Observable<Sector>>{
    return await this.genericCrud.onSave(this.saveSector, input);
  }

  async onDeleteSectorById(id): Promise<Observable<boolean>>{
    return await this.genericCrud.onDelete(this.deleteSector, id, "Realmente desea eliminar este sector?")
  }

  async onDeleteSector(sector: Sector): Promise<Observable<boolean>>{
    return await this.genericCrud.onDelete(this.deleteSector, sector.id, "Realmente desea eliminar este sector:", sector.descripcion)
  }
}
