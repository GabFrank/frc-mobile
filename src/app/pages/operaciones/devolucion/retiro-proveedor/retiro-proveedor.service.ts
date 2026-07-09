import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { RetirarDevolucionesEnBloqueGQL } from './graphql/retirarDevolucionesEnBloque';
import { RetiroProveedorConsolidadoGQL } from './graphql/retiroProveedorConsolidado';
import { RetiroBloqueResultado, RetiroProveedorConsolidado } from './retiro-proveedor.model';

@Injectable({
  providedIn: 'root',
})
export class RetiroProveedorService {
  constructor(
    private genericService: GenericCrudService,
    private retiroProveedorConsolidadoGQL: RetiroProveedorConsolidadoGQL,
    private retirarDevolucionesEnBloqueGQL: RetirarDevolucionesEnBloqueGQL
  ) {}

  async onGetConsolidado(
    proveedorId: number,
    sucursalId?: number
  ): Promise<Observable<RetiroProveedorConsolidado>> {
    return await this.genericService.onGetCustom(this.retiroProveedorConsolidadoGQL, {
      proveedorId,
      sucursalId: sucursalId ?? null,
    });
  }

  async onRetirarEnBloque(
    devolucionIds: number[],
    usuarioId?: number
  ): Promise<Observable<RetiroBloqueResultado>> {
    return await this.genericService.onCustomSave(
      this.retirarDevolucionesEnBloqueGQL,
      { devolucionIds, usuarioId: usuarioId ?? null },
      false
    );
  }
}
