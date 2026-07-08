import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { MiResumenRrhhMobileGQL } from './MiResumenRrhhMobile';
import { MisRecibosMobileGQL } from './MisRecibosMobile';
import { MisValesMobileGQL } from './MisValesMobile';
import { MisVacacionesMobileGQL } from './MisVacacionesMobile';
import { ImprimirReciboLiquidacionGQL } from './ImprimirReciboLiquidacion';
import { SolicitarValeMobileGQL } from './SolicitarValeMobile';
import { SolicitarVacacionMobileGQL } from './SolicitarVacacionMobile';
import { ValesPendientesAprobacionMobileGQL } from './ValesPendientesAprobacionMobile';
import { VacacionesPendientesAprobacionMobileGQL } from './VacacionesPendientesAprobacionMobile';
import { AprobarVacacionMobileGQL } from './AprobarVacacionMobile';
import { MisMarcacionesMobileGQL } from './MisMarcacionesMobile';

@Injectable({ providedIn: 'root' })
export class RrhhMobileService {

  constructor(
    private genericService: GenericCrudService,
    private miResumenGQL: MiResumenRrhhMobileGQL,
    private misRecibosGQL: MisRecibosMobileGQL,
    private misValesGQL: MisValesMobileGQL,
    private misVacacionesGQL: MisVacacionesMobileGQL,
    private imprimirReciboGQL: ImprimirReciboLiquidacionGQL,
    private solicitarValeGQL: SolicitarValeMobileGQL,
    private solicitarVacacionGQL: SolicitarVacacionMobileGQL,
    private valesPendientesGQL: ValesPendientesAprobacionMobileGQL,
    private vacacionesPendientesGQL: VacacionesPendientesAprobacionMobileGQL,
    private aprobarVacacionGQL: AprobarVacacionMobileGQL,
    private misMarcacionesGQL: MisMarcacionesMobileGQL
  ) { }

  async onGetResumen(usuarioId): Promise<Observable<any>> {
    return this.genericService.onCustomGet(this.miResumenGQL, { usuarioId }, null, false);
  }

  async onGetRecibos(usuarioId): Promise<Observable<any>> {
    return this.genericService.onCustomGet(this.misRecibosGQL, { usuarioId }, null, false);
  }

  async onGetVales(usuarioId): Promise<Observable<any>> {
    return this.genericService.onCustomGet(this.misValesGQL, { usuarioId }, null, false);
  }

  async onGetVacaciones(usuarioId): Promise<Observable<any>> {
    return this.genericService.onCustomGet(this.misVacacionesGQL, { usuarioId }, null, false);
  }

  async onImprimirRecibo(id): Promise<Observable<any>> {
    return this.genericService.onCustomGet(this.imprimirReciboGQL, { id });
  }

  async onSolicitarVale(usuarioId, monto, esAdelanto, motivoId?): Promise<Observable<any>> {
    return this.genericService.onCustomSave(this.solicitarValeGQL, { usuarioId, monto, esAdelanto, motivoId });
  }

  async onSolicitarVacacion(usuarioId, desde, hasta): Promise<Observable<any>> {
    return this.genericService.onCustomSave(this.solicitarVacacionGQL, { usuarioId, desde, hasta });
  }

  async onGetValesPendientes(): Promise<Observable<any>> {
    return this.genericService.onCustomGet(this.valesPendientesGQL, {}, null, false);
  }

  async onGetVacacionesPendientes(): Promise<Observable<any>> {
    return this.genericService.onCustomGet(this.vacacionesPendientesGQL, {}, null, false);
  }

  async onAprobarVacacion(periodoId, aprobadorUsuarioId): Promise<Observable<any>> {
    return this.genericService.onCustomSave(this.aprobarVacacionGQL, { periodoId, aprobadorUsuarioId });
  }

  async onGetMarcaciones(usuarioId): Promise<Observable<any>> {
    return this.genericService.onCustomGet(this.misMarcacionesGQL, { usuarioId }, null, false);
  }
}
