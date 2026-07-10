import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { descodificarQr } from 'src/app/generic/utils/qrUtils';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { SolicitudGastosService } from '../../services/solicitud-gastos.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-solicitud',
  templateUrl: './solicitud.component.html',
  styleUrls: ['./solicitud.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudComponent implements OnInit {

  constructor(
    private barcodeScanner: BarcodeScannerService,
    private notificacion: NotificacionService,
    private mainService: MainService,
    private solicitudService: SolicitudGastosService,
    private cdr: ChangeDetectorRef,
    private navCtrl: NavController
  ) { }

  ngOnInit() {}

  onScanear(): void {
    this.barcodeScanner.scan().pipe(untilDestroyed(this)).subscribe({
      next: async (res) => {
        if (!res?.text || res.cancelled) {
          return;
        }
        await this.procesarQrRetiro(res.text);
      },
      error: () => {
        this.notificacion.danger('No se pudo escanear el código QR.');
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
      
      // Opcional: Navegar al detalle de la solicitud después de confirmar
      this.navCtrl.navigateForward(['/operaciones/solicitud-gastos/solicitud/detalle', sucursalId, preGastoId]);
    } catch (err) {
      const mensaje = this.solicitudService.extraerMensajeError(err);
      this.notificacion.danger(mensaje || 'No se pudo confirmar el retiro.');
    }
  }

}
