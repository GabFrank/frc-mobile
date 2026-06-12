import { AfterViewInit, Component, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonInput } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { ProductoBusquedaService } from '../producto-busqueda.service';
import { resolverPresentacionPorCodigo } from '../producto-presentacion.util';
import { codigosParaBuscar, normalizarCodigo } from 'src/app/generic/utils/barcodeUtils';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ConfigService } from 'src/app/services/config.service';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { Moneda } from '../../operaciones/moneda/moneda.model';
import { MonedaService } from '../../operaciones/moneda/moneda.service';

@UntilDestroy()
@Component({
  selector: 'app-mostrar-precio',
  templateUrl: './mostrar-precio.component.html',
  styleUrls: ['./mostrar-precio.component.scss']
})
export class MostrarPrecioComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('inputElement', { static: false }) inputEl!: IonInput;
  @ViewChild('content', { static: false }) content: IonContent;

  barcodeForm: FormGroup;
  producto: Producto | null = null;
  presentacionEscaneadaId: number | null = null;
  presentacionFilter: Array<Presentacion & { precioPrincipal?: { precio: number; precioConvertido?: number } }> = [];
  mode = 'lector';
  currencyControl = new FormControl('gs');
  exchangeRate = 1;
  currentSymbol = 'Gs';
  monedas: Moneda[] = [];
  currentCurrency: Moneda | null = null;
  selectedCurrency: Moneda | null = null;

  private clickListener: (() => void) | null = null;

  constructor(
    private fb: FormBuilder,
    private productoBusquedaService: ProductoBusquedaService,
    private notificacionService: NotificacionService,
    private renderer: Renderer2,
    private configService: ConfigService,
    private monedaService: MonedaService,
    private barcodeScannerService: BarcodeScannerService
  ) {
    this.barcodeForm = this.fb.group({
      barcode: ['', Validators.maxLength(13)]
    });
  }

  async ngOnInit() {
    this.clickListener = this.renderer.listen('document', 'click', () => {
      this.setFocusOnInput();
    });

    this.configService.currentMode
      .pipe(untilDestroyed(this))
      .subscribe((mode) => {
        this.mode = mode;
        if (mode === 'cam') {
          this.escanearConMlKit();
        }
      });

    await this.getAllMonedas();
    this.setDefaultCurrency();
  }

  ngOnDestroy(): void {
    this.clickListener?.();
  }

  onSubmit() {
    if (this.barcodeForm.valid) {
      this.obtenerProductoPorCodigo(this.barcodeForm.value.barcode);
    }
  }

  ngAfterViewInit() {
    this.setFocusOnInput();
  }

  ionViewDidEnter() {
    this.setFocusOnInput();
  }

  escanearConMlKit() {
    this.barcodeScannerService.scan().pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res.cancelled && res.text) {
        this.obtenerProductoPorCodigo(res.text);
      }
    });
  }

  obtenerProductoPorCodigo(codigo: string) {
    const codigoOriginal = codigo?.trim() ?? '';
    const referencias = codigosParaBuscar(codigoOriginal);
    if (codigoOriginal && !referencias.includes(normalizarCodigo(codigoOriginal))) {
      referencias.push(normalizarCodigo(codigoOriginal));
    }

    this.productoBusquedaService.buscarProductoPorEscaneo(codigoOriginal).subscribe({
      next: (producto) => {
        if (!producto) {
          this.notificacionService.danger('Producto no encontrado');
          this.resetProductDisplay();
          setTimeout(() => this.inputEl?.setFocus(), 500);
          return;
        }
        this.producto = producto;
        this.filtrarPresentaciones();

        const presentacionEscaneada = resolverPresentacionPorCodigo(producto, ...referencias);
        this.presentacionEscaneadaId = presentacionEscaneada?.id ?? null;
        if (presentacionEscaneada) {
          setTimeout(() => this.scrollToButtom(), 500);
        } else if (!producto.presentaciones?.length) {
          this.notificacionService.warn('No se encontraron presentaciones para este producto');
        }
        this.barcodeForm.reset();
      },
      error: () => {
        this.notificacionService.danger('Producto no encontrado');
        this.resetProductDisplay();
      },
    });
  }

  filtrarPresentaciones() {
    if (!this.producto?.presentaciones) {
      return;
    }
    this.presentacionFilter = this.producto.presentaciones.filter(
      (presentacion) =>
        presentacion.precioPrincipal?.precio != null &&
        !isNaN(presentacion.precioPrincipal.precio) &&
        presentacion.cantidad > 0
    );
    this.presentacionFilter.sort(
      (a, b) => a.precioPrincipal.precio - b.precioPrincipal.precio
    );
  }

  scrollToButtom() {
    this.content.scrollToBottom(500);
    setTimeout(() => this.setFocusOnInput(), 100);
  }

  setFocusOnInput() {
    if (this.mode === 'lector' && this.inputEl) {
      setTimeout(() => this.inputEl.setFocus(), 100);
    }
  }

  onCurrencyChange(currencyId: number) {
    this.updateCurrency(currencyId);
  }

  updateCurrency(currencyId: number) {
    const selectedCurrency = this.monedas.find((moneda) => moneda.id === currencyId);
    if (!selectedCurrency) {
      return;
    }
    this.exchangeRate = 1 / selectedCurrency.cambio;
    this.currentSymbol = selectedCurrency.simbolo;
    this.currentCurrency = selectedCurrency;

    this.presentacionFilter.forEach((presentacion) => {
      if (presentacion.precioPrincipal) {
        presentacion.precioPrincipal.precioConvertido =
          presentacion.precioPrincipal.precio * this.exchangeRate;
      }
    });
  }

  setDefaultCurrency() {
    const pyCurrency = this.monedas.find((moneda) => moneda.id === 1);
    if (pyCurrency) {
      this.selectedCurrency = pyCurrency;
      this.updateCurrency(pyCurrency.id);
    }
  }

  getAllMonedas(): void {
    this.monedaService.onGetAll().then((observable) => {
      observable.pipe(untilDestroyed(this)).subscribe({
        next: (monedas: Moneda[]) => {
          this.monedas = monedas.map((moneda) => {
            if (moneda.denominacion === 'GUARANI' || moneda.simbolo === 'Gs.') {
              moneda.imagen = 'assets/flags/paraguay.png';
            } else if (moneda.denominacion === 'REAL' || moneda.simbolo === 'R$') {
              moneda.imagen = 'assets/flags/brazil.png';
            } else if (moneda.denominacion === 'DOLAR' || moneda.simbolo === '$') {
              moneda.imagen = 'assets/flags/eeuu.png';
            } else if (moneda.denominacion === 'PESO ARGENTINO' || moneda.simbolo === 'AR$') {
              moneda.imagen = 'assets/flags/argentina.png';
            }
            return moneda;
          });
          this.setDefaultCurrency();
        },
        error: (error) => console.error('Error al obtener monedas', error),
      });
    });
  }

  private resetProductDisplay() {
    this.producto = null;
    this.presentacionFilter = [];
    this.presentacionEscaneadaId = null;
  }
}
