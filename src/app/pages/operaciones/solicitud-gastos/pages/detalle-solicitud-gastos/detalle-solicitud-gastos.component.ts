import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { descodificarQr } from 'src/app/generic/utils/qrUtils';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { ResumenMontoPorMoneda } from '../../interfaces';
import { SolicitudGastosService } from '../../services/solicitud-gastos.service';
import { AgregarRendicionGastoComponent } from '../agregar-rendicion-gasto/agregar-rendicion-gasto.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-detalle-solicitud-gastos',
  templateUrl: './detalle-solicitud-gastos.component.html',
  styleUrls: ['./detalle-solicitud-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleSolicitudGastosComponent implements OnInit {
  solicitud: PreGasto | null = null;
  cargando = false;
  escaneando = false;
  mostrarResumen = true;
  preGastoId = 0;
  sucursalId = 0;
  puedeEscanearRetiro = false;
  puedeAgregarRendicion = false;
  mostrarEsperaEntrega = false;
  resumenMontosPorMoneda: ResumenMontoPorMoneda[] = [];
  simboloMonedaPrincipal = 'Gs.';
  badgeColorEstado = 'medium';

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private solicitudService: SolicitudGastosService,
    private barcodeScanner: BarcodeScannerService,
    private notificacion: NotificacionService,
    private mainService: MainService,
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params) => {
      this.preGastoId = Number(params.get('id'));
      this.sucursalId = Number(params.get('sucursalId'));
      if (this.preGastoId > 0) {
        this.cargarDetalle();
      }
    });
  }

  onBack(): void {
    this.navCtrl.back();
  }

  toggleResumen(): void {
    this.mostrarResumen = !this.mostrarResumen;
    this.cdr.markForCheck();
  }

  async cargarDetalle(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      this.solicitud = await this.solicitudService.obtenerPreGastoPorId(this.preGastoId, this.sucursalId || undefined);
      this.actualizarEstadoUi();
    } catch {
      this.notificacion.danger('No se pudo cargar la solicitud.');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  async onEscanearQrRetiro(): Promise<void> {
    if (!this.puedeEscanearRetiro) {
      return;
    }
    this.escaneando = true;
    this.cdr.markForCheck();
    this.barcodeScanner.scan().pipe(untilDestroyed(this)).subscribe({
      next: async (res) => {
        this.escaneando = false;
        if (!res?.text || res.cancelled) {
          this.cdr.markForCheck();
          return;
        }
        await this.procesarQrRetiro(res.text);
        this.cdr.markForCheck();
      },
      error: () => {
        this.escaneando = false;
        this.notificacion.danger('No se pudo escanear el código QR.');
        this.cdr.markForCheck();
      },
    });
  }

  private async procesarQrRetiro(codigo: string): Promise<void> {
    const qr = descodificarQr(codigo);
    if (qr.tipoEntidad !== 'PRE_GASTO_RETIRO') {
      this.notificacion.warn('El QR escaneado no corresponde a un retiro de gasto.');
      return;
    }
    const preGastoId = Number(qr.idOrigen);
    const sucursalId = Number(qr.idCentral);
    const qrToken = String(qr.componentToOpen ?? '');
    const personaId = Number(this.mainService.usuarioActual?.persona?.id);
    if (!preGastoId || !sucursalId || !qrToken || !personaId) {
      this.notificacion.warn('Datos del QR incompletos o usuario sin persona vinculada.');
      return;
    }
    try {
      await this.solicitudService.confirmarRetiroFuncionario({
        preGastoId,
        sucursalId,
        qrToken,
        funcionarioPersonaId: personaId,
      });
      this.notificacion.success('Retiro confirmado. El cajero puede entregar el efectivo.');
      await this.cargarDetalle();
    } catch (err) {
      const mensaje = this.solicitudService.extraerMensajeError(err);
      this.notificacion.danger(mensaje || 'No se pudo confirmar el retiro.');
    }
  }

  async onAgregarRendicion(): Promise<void> {
    if (!this.solicitud || !this.puedeAgregarRendicion) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: AgregarRendicionGastoComponent,
      componentProps: { preGasto: this.solicitud },
      cssClass: 'modal-rendicion-gasto',
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.guardado) {
      await this.cargarDetalle();
    }
  }

  private actualizarEstadoUi(): void {
    const solicitud = this.solicitud;
    this.puedeEscanearRetiro = solicitud?.estado === 'AUTORIZADO' && !solicitud?.retiroConfirmadoEn;
    this.puedeAgregarRendicion = solicitud?.estado === 'TRAMITE';
    this.mostrarEsperaEntrega = !!solicitud?.retiroConfirmadoEn && solicitud?.estado === 'AUTORIZADO';
    this.resumenMontosPorMoneda = this.construirResumenMontosPorMoneda();
    this.simboloMonedaPrincipal = this.resumenMontosPorMoneda[0]?.simboloMoneda
      || solicitud?.moneda?.simbolo
      || 'Gs.';
    this.badgeColorEstado = this.resolverBadgeColor(solicitud?.estado);
  }

  private construirResumenMontosPorMoneda(): ResumenMontoPorMoneda[] {
    const solicitud = this.solicitud;
    if (!solicitud) {
      return [];
    }
    const finanzas = solicitud.finanzas ?? [];
    if (finanzas.length === 0) {
      const simbolo = solicitud.moneda?.simbolo ?? 'Gs.';
      const etiqueta = solicitud.moneda?.denominacion ?? 'Moneda';
      const esGuarani = this.esMonedaGuarani(simbolo, etiqueta);
      const solicitado = Number(solicitud.montoSolicitado ?? 0);
      const retirado = Number(solicitud.montoRetirado ?? 0);
      const gastado = Number(solicitud.montoGastado ?? 0);
      const saldo = Number(solicitud.saldoDevolver ?? 0);
      return [{
        etiquetaMoneda: etiqueta,
        simboloMoneda: simbolo,
        solicitadoTexto: this.formatearMonto(solicitado, esGuarani),
        retiradoTexto: this.formatearMonto(retirado, esGuarani),
        gastadoTexto: this.formatearMonto(gastado, esGuarani),
        saldoDevolverTexto: this.formatearMonto(saldo, esGuarani),
      }];
    }

    return finanzas.map((fin) => {
      const simbolo = fin?.moneda?.simbolo ?? '';
      const etiqueta = fin?.moneda?.denominacion ?? 'Moneda';
      const esGuarani = this.esMonedaGuarani(simbolo, etiqueta);
      const solicitado = Number(fin?.monto ?? 0);
      const retirado = this.valorRetiradoPorMoneda(simbolo, etiqueta);
      const vuelto = this.valorVueltoPorMoneda(simbolo, etiqueta);
      const gastado = Math.max(retirado - vuelto, 0);
      return {
        etiquetaMoneda: etiqueta,
        simboloMoneda: simbolo,
        solicitadoTexto: this.formatearMonto(solicitado, esGuarani),
        retiradoTexto: this.formatearMonto(retirado, esGuarani),
        gastadoTexto: this.formatearMonto(gastado, esGuarani),
        saldoDevolverTexto: this.formatearMonto(vuelto, esGuarani),
      };
    });
  }

  private valorRetiradoPorMoneda(simbolo: string, denominacion: string): number {
    const gasto = this.solicitud?.gasto;
    if (!gasto) {
      const monedaPrincipal = this.solicitud?.moneda;
      if (this.mismaMoneda(simbolo, denominacion, monedaPrincipal?.simbolo, monedaPrincipal?.denominacion)) {
        return Number(this.solicitud?.montoRetirado ?? 0);
      }
      return 0;
    }
    if (this.esMonedaGuarani(simbolo, denominacion)) {
      return Number(gasto.retiroGs ?? 0);
    }
    if (this.esMonedaReal(simbolo, denominacion)) {
      return Number(gasto.retiroRs ?? 0);
    }
    if (this.esMonedaDolar(simbolo, denominacion)) {
      return Number(gasto.retiroDs ?? 0);
    }
    return 0;
  }

  private valorVueltoPorMoneda(simbolo: string, denominacion: string): number {
    const gasto = this.solicitud?.gasto;
    if (!gasto) {
      const monedaPrincipal = this.solicitud?.moneda;
      if (this.mismaMoneda(simbolo, denominacion, monedaPrincipal?.simbolo, monedaPrincipal?.denominacion)) {
        return Number(this.solicitud?.saldoDevolver ?? 0);
      }
      return 0;
    }
    if (this.esMonedaGuarani(simbolo, denominacion)) {
      return Number(gasto.vueltoGs ?? 0);
    }
    if (this.esMonedaReal(simbolo, denominacion)) {
      return Number(gasto.vueltoRs ?? 0);
    }
    if (this.esMonedaDolar(simbolo, denominacion)) {
      return Number(gasto.vueltoDs ?? 0);
    }
    return 0;
  }

  private mismaMoneda(
    simboloA?: string,
    denominacionA?: string,
    simboloB?: string,
    denominacionB?: string
  ): boolean {
    const simboloNormalizadoA = (simboloA ?? '').trim().toUpperCase();
    const simboloNormalizadoB = (simboloB ?? '').trim().toUpperCase();
    const denominacionNormalizadaA = (denominacionA ?? '').trim().toUpperCase();
    const denominacionNormalizadaB = (denominacionB ?? '').trim().toUpperCase();
    return (
      (!!simboloNormalizadoA && simboloNormalizadoA === simboloNormalizadoB) ||
      (!!denominacionNormalizadaA && denominacionNormalizadaA === denominacionNormalizadaB)
    );
  }

  private esMonedaGuarani(simbolo: string, denominacion: string): boolean {
    const simboloNormalizado = (simbolo ?? '').trim().toUpperCase();
    const denominacionNormalizada = (denominacion ?? '').trim().toUpperCase();
    return simboloNormalizado.includes('GS') || denominacionNormalizada.includes('GUARANI');
  }

  private esMonedaReal(simbolo: string, denominacion: string): boolean {
    const simboloNormalizado = (simbolo ?? '').trim().toUpperCase();
    const denominacionNormalizada = (denominacion ?? '').trim().toUpperCase();
    return simboloNormalizado.includes('R$') || simboloNormalizado.includes('RS') || denominacionNormalizada.includes('REAL');
  }

  private esMonedaDolar(simbolo: string, denominacion: string): boolean {
    const simboloNormalizado = (simbolo ?? '').trim().toUpperCase();
    const denominacionNormalizada = (denominacion ?? '').trim().toUpperCase();
    return simboloNormalizado.includes('USD') || simboloNormalizado.includes('US$') || simboloNormalizado === '$' || denominacionNormalizada.includes('DOLAR');
  }

  private formatearMonto(monto: number, esGuarani: boolean): string {
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: esGuarani ? 0 : 2,
      maximumFractionDigits: esGuarani ? 0 : 2,
    }).format(monto);
  }

  private resolverBadgeColor(estado?: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'AUTORIZADO': return 'success';
      case 'RECHAZADO': return 'danger';
      case 'COMPLETADO': return 'secondary';
      case 'TRAMITE': return 'primary';
      default: return 'medium';
    }
  }
}
