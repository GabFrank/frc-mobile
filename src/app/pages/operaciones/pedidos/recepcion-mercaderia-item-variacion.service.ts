import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { DeleteRecepcionMercaderiaItemVariacionMutation } from './graphql/deleteRecepcionMercaderiaItemVariacion';

@Injectable({
  providedIn: 'root'
})
export class RecepcionMercaderiaItemVariacionService extends GenericCrudService {

  constructor(
    private deleteVariacionMutation: DeleteRecepcionMercaderiaItemVariacionMutation
  ) {
    super();
  }

  /**
   * Elimina una variación de recepción de mercadería por ID
   * @param id ID de la variación a eliminar
   * @returns Observable<boolean> true si se eliminó correctamente
   */
  deleteVariacion(id: number): Observable<boolean> {
    return this.deleteVariacionMutation.mutate({ id }).pipe(
      map(result => result.data?.data || false)
    );
  }
}
