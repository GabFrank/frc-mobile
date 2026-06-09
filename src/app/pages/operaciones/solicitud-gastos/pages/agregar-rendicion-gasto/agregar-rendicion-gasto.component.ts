import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { GastoRendicionInput, PreGasto } from '../../models/pre-gasto.model';
import { SolicitudGastosService } from '../../services/solicitud-gastos.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-agregar-rendicion-gasto',
  templateUrl: './agregar-rendicion-gasto.component.html',
  styleUrls: ['./agregar-rendicion-gasto.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarRendicionGastoComponent implements OnInit {
  @Input() preGasto: PreGasto;

  montoTotal = 0;
  fotoFacturaUrl = '';
  fotoProductoUrl = '';
  kmActual: number | null = null;
  litros: number | null = null;
  precioPorLitro: number | null = null;
  ubicacionProvisoria = '';
  establecimientoAlimentacion = '';
  guardando = false;
  esCombustible = false;
  esAlimentacion = false;

  constructor(
    private modalCtrl: ModalController,
    private solicitudService: SolicitudGastosService,
    private notificacion: NotificacionService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.actualizarCamposPorTipo();
    this.cdr.markForCheck();
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  private actualizarCamposPorTipo(): void {
    const tipo = this.preGasto?.tipoGasto;
    const desc = (tipo?.descripcion || '').toUpperCase();
    this.esCombustible = desc.includes('COMBUST') || desc.includes('GASOL') || tipo?.moduloPadre === 'VEHICULO';
    this.esAlimentacion = desc.includes('ALIMENT') || desc.includes('COMIDA') || desc.includes('RESTAUR');
  }

  async capturarFoto(campo: 'factura' | 'producto'): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });
      if (!image.dataUrl) {
        return;
      }
      if (campo === 'factura') {
        this.fotoFacturaUrl = image.dataUrl;
      } else {
        this.fotoProductoUrl = image.dataUrl;
      }
      this.cdr.markForCheck();
    } catch {
      this.notificacion.warn('No se pudo capturar la imagen.');
    }
  }

  async guardar(): Promise<void> {
    if (!this.preGasto?.id || !this.preGasto?.sucursalId) {
      return;
    }
    if (!this.preGasto?.tipoGasto?.id) {
      this.notificacion.warn('El gasto no tiene un tipo asociado.');
      return;
    }
    if (!this.montoTotal || this.montoTotal <= 0) {
      this.notificacion.warn('Ingrese un monto mayor a cero.');
      return;
    }
    if (!this.fotoFacturaUrl) {
      this.notificacion.warn('Adjunte foto de factura o comprobante.');
      return;
    }

    const input: GastoRendicionInput = {
      preGastoId: this.preGasto.id,
      sucursalId: this.preGasto.sucursalId,
      montoTotal: this.montoTotal,
      fotoFacturaUrl: this.fotoFacturaUrl,
      fotoProductoUrl: this.fotoProductoUrl || undefined,
      kmActual: this.kmActual ?? undefined,
      litros: this.litros ?? undefined,
      precioPorLitro: this.precioPorLitro ?? undefined,
      ubicacionProvisoria: this.ubicacionProvisoria || undefined,
      establecimientoAlimentacion: this.establecimientoAlimentacion || undefined,
      usuarioId: this.mainService.usuarioActual?.id,
    };

    this.guardando = true;
    this.cdr.markForCheck();
    try {
      await this.solicitudService.guardarGastoRendicion(input);
      this.notificacion.success('Gasto rendido registrado.');
      this.modalCtrl.dismiss({ guardado: true });
    } catch (err) {
      const mensaje = this.solicitudService.extraerMensajeError(err);
      this.notificacion.danger(mensaje || 'No se pudo guardar la rendición.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }
}
