import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { RetirarDevolucionesEnBloqueGQL } from './graphql/retirarDevolucionesEnBloque';
import { RetiroProveedorConsolidadoGQL } from './graphql/retiroProveedorConsolidado';
import { DevolucionConfiguracionGQL } from './graphql/devolucionConfiguracion';
import { RemitoRetiroProveedorGQL } from './graphql/remitoRetiroProveedor';
import { RetiroBloqueResultado, RetiroProveedorConsolidado } from './retiro-proveedor.model';

@Injectable({
  providedIn: 'root',
})
export class RetiroProveedorService {
  constructor(
    private genericService: GenericCrudService,
    private retiroProveedorConsolidadoGQL: RetiroProveedorConsolidadoGQL,
    private retirarDevolucionesEnBloqueGQL: RetirarDevolucionesEnBloqueGQL,
    private devolucionConfiguracionGQL: DevolucionConfiguracionGQL,
    private remitoRetiroProveedorGQL: RemitoRetiroProveedorGQL
  ) {}

  async onGetConfiguracion(): Promise<Observable<{ retiroPermitirSeleccionManual: boolean }>> {
    return await this.genericService.onGetCustom(this.devolucionConfiguracionGQL, {});
  }

  /** PDF (base64) del comprobante de retiro, para compartir con el proveedor. */
  async onGetRemito(devolucionIds: number[]): Promise<Observable<string>> {
    return await this.genericService.onGetCustom(this.remitoRetiroProveedorGQL, { devolucionIds });
  }

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
