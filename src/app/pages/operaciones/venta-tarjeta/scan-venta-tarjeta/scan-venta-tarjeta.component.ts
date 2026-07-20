import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { descodificarQr } from 'src/app/generic/utils/qrUtils';
import { CajaService } from '../../caja/caja.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { PdvCaja } from '../../caja/caja.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-scan-venta-tarjeta',
  templateUrl: './scan-venta-tarjeta.component.html',
  styleUrls: ['./scan-venta-tarjeta.component.scss']
})
export class ScanVentaTarjetaComponent implements OnInit {

  cajaActual: PdvCaja = null;
  escaneando = false;
  verificandoCaja = true;

  constructor(
    private barcodeScannerService: BarcodeScannerService,
    private cajaService: CajaService,
    private mainService: MainService,
    private notificacionService: NotificacionService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  async ngOnInit() {
    await this.verificarCajaAbierta();
  }

  async verificarCajaAbierta() {
    this.verificandoCaja = true;
    const usuarioId = this.mainService.usuarioActual?.id;
    if (!usuarioId) {
      this.notificacionService.open('No hay usuario autenticado', TipoNotificacion.DANGER, 3);
      this.location.back();
      return;
    }

    // Usar caja en caché para evitar el proxy lento hacia las filiales
    if (this.cajaService.selectedCaja?.activo) {
      this.cajaActual = this.cajaService.selectedCaja;
      this.verificandoCaja = false;
      return;
    }

    (await this.cajaService.onGetByUsuarioIdAndAbierto(usuarioId))
      .pipe(untilDestroyed(this))
      .subscribe((cajas: PdvCaja[]) => {
        this.verificandoCaja = false;
        if (!cajas || cajas.length === 0) {
          this.notificacionService.open(
            'No tiene una caja abierta. Debe abrir una caja antes de registrar ventas con tarjeta.',
            TipoNotificacion.DANGER,
            4
          );
          this.location.back();
          return;
        }
        this.cajaActual = cajas[0];
        this.cajaService.selectedCaja = this.cajaActual;
      });
  }

  async escanear() {
    if (!this.cajaActual) {
      this.notificacionService.open('Sin caja abierta', TipoNotificacion.DANGER, 3);
      return;
    }

    this.escaneando = true;
    this.barcodeScannerService.scan()
      .pipe(untilDestroyed(this))
      .subscribe(result => {
        this.escaneando = false;
        if (result.cancelled || !result.text) {
          return;
        }
        this.procesarQr(result.text);
      }, () => {
        this.escaneando = false;
        this.notificacionService.open('Error al escanear', TipoNotificacion.DANGER, 3);
      });
  }

  private procesarQr(texto: string) {
    if (!texto.startsWith('frc-')) {
      this.notificacionService.open('QR no válido para este sistema', TipoNotificacion.DANGER, 3);
      return;
    }

    const qrData = descodificarQr(texto);

    if (qrData.tipoEntidad !== 'VT') {
      this.notificacionService.open('QR no corresponde a una venta con tarjeta', TipoNotificacion.DANGER, 3);
      return;
    }

    if (qrData.componentToOpen !== 'RegistroVentaTarjetaComponent') {
      this.notificacionService.open('QR no reconocido', TipoNotificacion.DANGER, 3);
      return;
    }

    const partes = (qrData.data || '').split('|');
    const cajaIdQr = Number(partes[0]);
    const monto = Number(partes[1]);
    const ventaTarjetaId = partes[2] ? Number(partes[2]) : null;

    if (cajaIdQr !== Number(this.cajaActual.id)) {
      this.notificacionService.open(
        'Este QR pertenece a otra caja. Solo el cajero de turno puede registrar esta venta.',
        TipoNotificacion.DANGER,
        4
      );
      return;
    }

    const ventaId = Number(qrData.idOrigen);
    // sucursalId del QR (valor de la filial) es el correcto para enrutar el save al backend correcto.
    // No comparamos con cajaActual.sucursalId porque el central puede asignar un id diferente al de la filial.
    const sucursalId = Number(qrData.sucursalId);

    this.router.navigate(['../registro'], {
      relativeTo: this.route,
      state: { ventaId, cajaId: cajaIdQr, monto, sucursalId, ventaTarjetaId }
    });
  }

  onBack() {
    this.location.back();
  }
}
