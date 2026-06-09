import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { descodificarQr } from 'src/app/generic/utils/qrUtils';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { PreGasto } from '../../models/pre-gasto.model';
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
  simboloMoneda = 'Gs.';
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
    this.simboloMoneda = solicitud?.moneda?.simbolo || 'Gs.';
    this.badgeColorEstado = this.resolverBadgeColor(solicitud?.estado);
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
