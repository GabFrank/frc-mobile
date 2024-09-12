import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VentaCredito } from 'src/app/domains/venta-credito/venta-credito.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { CountVentaCreditoByClienteAndEstadoGQL } from './count-by-cliente-id copy';
import { VentaCreditoPorClienteGQL } from './venta-credito-por-cliente-id';
import { VentaCreditoQrAuthGQL } from './venta-credito-qr-auth';
import { PageInfo } from 'src/app/app.component';
import { VentaCreditoPorClientePageGQL } from './venta-credito-por-cliente-id-page';

@Injectable({
  providedIn: 'root'
})
export class VentaCreditoService {

  constructor(
    private genericService: GenericCrudService,
    private ventaCreditoPorCliente: VentaCreditoPorClienteGQL,
    private ventaCreditoPorClientePage: VentaCreditoPorClientePageGQL,
    private countByClienteAndEstado: CountVentaCreditoByClienteAndEstadoGQL,
    private ventaCreditoQrAuth: VentaCreditoQrAuthGQL
  ) { }

  async onGetPorClienteId(id, estado, page, size): Promise<Observable<any>> {
    if(page == null && size == null ){
      return this.genericService.onCustomGet(this.ventaCreditoPorCliente, { id, estado});
    } else {
    return this.genericService.onCustomGet(this.ventaCreditoPorClientePage, { id, estado, page, size });
    }
  }

  async countPorClienteIdAndEstado(id, estado): Promise<Observable<number>> {
    return this.genericService.onCustomGet(this.countByClienteAndEstado, { id, estado });
  }

  async onVentaCreditoQrAuth(id: number, timestamp:string, sucursalId?, secretKey?): Promise<Observable<number>> {
    return this.genericService.onCustomGet(this.ventaCreditoQrAuth, { id, timestamp, sucursalId, secretKey });
  }
}
