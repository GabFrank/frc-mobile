import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { CajaService } from '../../caja/caja.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { PdvCaja } from '../../caja/caja.model';
import { VentaTarjetaQrService } from '../services/venta-tarjeta-qr.service';

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
    private location: Location,
    private ventaTarjetaQrService: VentaTarjetaQrService
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
    const resultado = this.ventaTarjetaQrService.procesarQrVenta(texto, this.cajaActual);

    if (!resultado.ok) {
      const duracion = resultado.motivo === 'caja-distinta' ? 4 : 3;
      this.notificacionService.open(resultado.mensaje, TipoNotificacion.DANGER, duracion);
      return;
    }

    const { ventaId, cajaId, monto, sucursalId, ventaTarjetaId } = resultado.navigation;

    this.router.navigate(['../registro'], {
      relativeTo: this.route,
      state: { ventaId, cajaId, monto, sucursalId, ventaTarjetaId }
    });
  }

  onBack() {
    this.location.back();
  }
}
