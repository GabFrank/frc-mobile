import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { GastoRendicionInput, PreGasto } from '../../models/pre-gasto.model';
import { FotoRendicionFormulario, MontoRendicionFormulario } from '../../interfaces';
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

  montosItems: MontoRendicionFormulario[] = [];
  fotosFacturaItems: FotoRendicionFormulario[] = [];
  fotosProductoItems: FotoRendicionFormulario[] = [];
  private nextMontoId = 1;
  private nextFotoId = 1;
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
    private actionSheetCtrl: ActionSheetController,
    public solicitudService: SolicitudGastosService,
    private notificacion: NotificacionService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.solicitudService.cargarDatosIniciales();
    } catch {
      // monedas pueden cargarse en otro flujo previo
    }
    this.montosItems = [this.crearFilaMonto()];
    this.actualizarCamposPorTipo();
    this.cdr.markForCheck();
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  agregarMonto(): void {
    this.montosItems = [
      ...this.montosItems,
      this.crearFilaMonto(),
    ];
    this.cdr.markForCheck();
  }

  quitarMonto(id: number): void {
    if (this.montosItems.length === 1) {
      return;
    }
    this.montosItems = this.montosItems.filter((item) => item.id !== id);
    this.cdr.markForCheck();
  }

  alCambiarMoneda(item: MontoRendicionFormulario, valor: unknown): void {
    const monedaId = this.normalizarNumero(valor);
    item.monedaId = monedaId;
    if (item.monto != null) {
      item.montoTexto = this.formatearMonto(item.monto, monedaId);
    }
    this.cdr.markForCheck();
  }

  alCambiarMontoTexto(item: MontoRendicionFormulario, texto: string): void {
    const textoIngresado = (texto ?? '').toString();
    const monto = this.parsearMonto(textoIngresado, item.monedaId);
    item.monto = monto;
    item.montoTexto = monto == null ? '' : this.formatearMonto(monto, item.monedaId);
    this.cdr.markForCheck();
  }

  alPerderFocoMonto(item: MontoRendicionFormulario): void {
    if (item.monto == null) {
      item.montoTexto = '';
      this.cdr.markForCheck();
      return;
    }
    item.montoTexto = this.formatearMonto(item.monto, item.monedaId);
    this.cdr.markForCheck();
  }

  private crearFilaMonto(): MontoRendicionFormulario {
    return {
      id: this.nextMontoId++,
      monto: null,
      monedaId: this.obtenerIdGuarani(),
      montoTexto: '',
    };
  }

  private actualizarCamposPorTipo(): void {
    const tipo = this.preGasto?.tipoGasto;
    const desc = (tipo?.descripcion || '').toUpperCase();
    this.esCombustible = desc.includes('COMBUST') || desc.includes('GASOL') || tipo?.moduloPadre === 'VEHICULO';
    this.esAlimentacion = desc.includes('ALIMENT') || desc.includes('COMIDA') || desc.includes('RESTAUR');
  }

  async capturarFoto(campo: 'factura' | 'producto'): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Foto',
      cssClass: 'foto-picker-sheet',
      backdropDismiss: true,
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera-outline',
          cssClass: 'foto-picker-option',
          data: { source: CameraSource.Camera },
        },
        {
          text: 'Desde galería',
          icon: 'image-outline',
          cssClass: 'foto-picker-option',
          data: { source: CameraSource.Photos },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'foto-picker-cancel',
        },
      ],
    });
    await actionSheet.present();
    const { data, role } = await actionSheet.onDidDismiss<{ source: CameraSource }>();
    if (role === 'cancel' || !data?.source) {
      return;
    }
    await this.tomarFotoDesde(campo, data.source);
  }

  private async tomarFotoDesde(campo: 'factura' | 'producto', source: CameraSource): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      });
      if (!image.dataUrl) {
        return;
      }
      const nuevaFoto: FotoRendicionFormulario = {
        id: this.nextFotoId++,
        url: image.dataUrl,
      };
      if (campo === 'factura') {
        this.fotosFacturaItems = [...this.fotosFacturaItems, nuevaFoto];
      } else {
        this.fotosProductoItems = [...this.fotosProductoItems, nuevaFoto];
      }
      this.cdr.markForCheck();
    } catch (err) {
      const mensaje = ((err as Error)?.message || '').toLowerCase();
      if (mensaje.includes('cancel')) {
        return;
      }
      this.notificacion.warn('No se pudo capturar la imagen.');
    }
  }

  quitarFoto(campo: 'factura' | 'producto', id: number): void {
    if (campo === 'factura') {
      this.fotosFacturaItems = this.fotosFacturaItems.filter((foto) => foto.id !== id);
    } else {
      this.fotosProductoItems = this.fotosProductoItems.filter((foto) => foto.id !== id);
    }
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.preGasto?.id || !this.preGasto?.sucursalId) {
      return;
    }
    if (!this.preGasto?.tipoGasto?.id) {
      this.notificacion.warn('El gasto no tiene un tipo asociado.');
      return;
    }

    const errorMontos = this.validarMontos();
    if (errorMontos) {
      this.notificacion.warn(errorMontos);
      return;
    }

    if (this.fotosFacturaItems.length === 0) {
      this.notificacion.warn('Adjunte al menos una foto de factura o comprobante.');
      return;
    }

    const montoTotal = this.calcularMontoTotal();

    const input: GastoRendicionInput = {
      preGastoId: this.preGasto.id,
      sucursalId: this.preGasto.sucursalId,
      montoTotal,
      fotosFacturaUrls: this.fotosFacturaItems.map((foto) => foto.url),
      fotosProductoUrls: this.fotosProductoItems.length
        ? this.fotosProductoItems.map((foto) => foto.url)
        : undefined,
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

  private validarMontos(): string | null {
    const filasConMonto = this.montosItems.filter((item) => item.monto != null && item.monto > 0);
    if (filasConMonto.length === 0) {
      return 'Ingrese un monto mayor a cero.';
    }

    const monedasUsadas = new Set<number>();
    for (const item of this.montosItems) {
      if (item.monto == null || item.monto <= 0) {
        continue;
      }
      if (!item.monedaId) {
        return 'Seleccione la moneda en cada monto.';
      }
      if (monedasUsadas.has(item.monedaId)) {
        return 'No se permite repetir moneda en los montos.';
      }
      monedasUsadas.add(item.monedaId);
    }

    return null;
  }

  private calcularMontoTotal(): number {
    const guaraniId = this.obtenerIdGuarani();
    const filasValidas = this.montosItems.filter((item) => item.monto != null && item.monto > 0);

    if (guaraniId != null) {
      const filasGuarani = filasValidas.filter((item) => Number(item.monedaId) === Number(guaraniId));
      if (filasGuarani.length > 0) {
        return filasGuarani.reduce((suma, item) => suma + (item.monto ?? 0), 0);
      }
    }

    return filasValidas.reduce((suma, item) => suma + (item.monto ?? 0), 0);
  }

  private obtenerIdGuarani(): number | null {
    const opcionGuarani = this.solicitudService.opcionesMoneda.find((opcion) => {
      const texto = (opcion.texto || '').toUpperCase();
      return texto.includes('GUARANI') || texto.includes('₲') || texto.includes('GS.');
    });
    return opcionGuarani ? Number(opcionGuarani.valor) : null;
  }

  private normalizarNumero(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  private parsearMonto(texto: string, monedaId: number | null): number | null {
    const textoLimpio = (texto || '').replace(/\s/g, '');
    if (!textoLimpio) {
      return null;
    }
    const precision = this.obtenerPrecisionPorMoneda(monedaId);
    if (precision === 0) {
      const soloDigitos = textoLimpio.replace(/\D/g, '');
      if (!soloDigitos) {
        return null;
      }
      return Number(soloDigitos);
    }

    const ultimoSeparadorIndex = Math.max(textoLimpio.lastIndexOf(','), textoLimpio.lastIndexOf('.'));
    const fuenteEntera = ultimoSeparadorIndex >= 0 ? textoLimpio.slice(0, ultimoSeparadorIndex) : textoLimpio;
    const parteEntera = fuenteEntera.replace(/\D/g, '');
    if (!parteEntera) {
      return null;
    }

    const fuenteDecimal = ultimoSeparadorIndex >= 0 ? textoLimpio.slice(ultimoSeparadorIndex + 1) : '';
    const parteDecimal = fuenteDecimal.replace(/\D/g, '').slice(0, precision);
    const normalizado = parteDecimal.length > 0 ? `${parteEntera}.${parteDecimal}` : parteEntera;
    const valor = Number(normalizado);
    return Number.isFinite(valor) ? valor : null;
  }

  private formatearMonto(monto: number, monedaId: number | null): string {
    const precision = this.obtenerPrecisionPorMoneda(monedaId);
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(monto);
  }

  private obtenerPrecisionPorMoneda(monedaId: number | null): number {
    if (!monedaId) {
      return 2;
    }
    const opcionMoneda = this.solicitudService.opcionesMoneda.find(
      (opcion) => Number(opcion.valor) === Number(monedaId)
    );
    const textoMoneda = (opcionMoneda?.texto || '').toUpperCase();
    if (textoMoneda.includes('GUARANI') || textoMoneda.includes('₲')) {
      return 0;
    }
    return 2;
  }
}
