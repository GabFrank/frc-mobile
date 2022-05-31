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

  onGetSector(id): Observable<Sector>{
    return this.genericCrud.onGetById(this.getSector, id);
  }

  onGetSectores(sucursalId: number): Observable<Sector[]>{
    return this.genericCrud.onGetById(this.getSectores, sucursalId);
  }

  onSaveSector(input): Observable<Sector>{
    return this.genericCrud.onSave(this.saveSector, input);
  }

  onDeleteSector(id): Observable<boolean>{
    return this.genericCrud.onDelete(this.deleteSector, id)
  }
}
