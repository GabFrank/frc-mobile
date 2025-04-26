import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonInput } from '@ionic/angular';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { ProductoService } from '../producto.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ConfigService } from 'src/app/services/config.service';
import { NgZone } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { Moneda } from '../../operaciones/moneda/moneda.model';
import { MonedaService } from '../../operaciones/moneda/moneda.service';

@Component({
  selector: 'app-mostrar-precio',
  templateUrl: './mostrar-precio.component.html',
  styleUrls: ['./mostrar-precio.component.scss']
})
export class MostrarPrecioComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('inputElement', { static: false }) inputEl!: IonInput;
  @ViewChild('content', { static: false }) content: IonContent;
  @ViewChild('videoElement', {static: false}) videoElement!: ElementRef<HTMLVideoElement>;

  barcodeForm: FormGroup;
  presentaciones: Presentacion[] = [];
  producto: Producto | null = null;
  presentacionEscaneadaId: number | null = null;
  presentacionFilter: any[] = [];
  monedasFilter: any[] = [];
  mode: string = 'lector';
  currencyControl = new FormControl('gs');
  exchangeRate = 1;
  currentSymbol = 'Gs';
  videoConstraints: MediaTrackConstraints = {};
  scannedData: string | null = null;
  selectedDeviceId: string | null = null;
  formats = [BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.CODE_128];
  monedas: any[] = [];
  currentCurrency: Moneda | null = null;
  selectedCurrency: any = null;
  showSegment: boolean = true;
  private clickListener: any;
  private mediaStream: MediaStream | null = null;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private notificacionService: NotificacionService,
    private renderer: Renderer2,
    private configService: ConfigService,
    private ngZone: NgZone,
    private monedaService: MonedaService,
    ) {
    this.barcodeForm = this.fb.group({
      barcode: ['', Validators.maxLength(13)]
    });
  }

  async ngOnInit() {
    this.presentaciones = this.producto?.presentaciones || [];
    this.clickListener = this.renderer.listen('document', 'click', () => {
      this.setFocusOnInput();
    });

    this.configService.currentMode.subscribe(mode => {
      this.mode = mode;

      if (this.mode === 'cam') {
        this.startFrontCamera();
        this.startCamManual();
        // this.resetProductDisplay();
      } else {
        this.stopCam();
      }
    });    
    await this.getAllMonedas();
    this.setDefaultCurrency();
  }
  
  ngOnDestroy(): void {
    if (this.clickListener) {
      this.clickListener();
    }
    this.stopCam();

    if(this.mediaStream){
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
  }

  // ! MÉTODO PARA ENVIAR LOS DATOS ↓
  onSubmit() {
    setTimeout(() => {
      if (this.barcodeForm.valid) {
        const barcode = this.barcodeForm.value.barcode;
        // alert(barcode);
        this.obtenerProductoPorCodigo(barcode);
      }
    }, 0); // ! TIEMPO DE ESPERA PARA LA CARGA DE LOS PRODUCTOS
  }

  ngAfterViewInit() {
    this.setFocusOnInput();
  }

  ionViewDidEnter() {
    this.setFocusOnInput();
  }

  // ! FUNCIÓN PARA OBTENER LOS PRODUCTOS ↓
  async obtenerProductoPorCodigo(codigo: string) {
    this.ngZone.runOutsideAngular(async () => {
      (await this.productoService.onGetProductoPorCodigo(codigo)).subscribe(
        (producto) => {
          this.ngZone.run(() => {
            console.log('Producto obtenido:', producto);
  
            if (producto) {
              this.producto = producto;
              this.filtrarPresentaciones();
    
              if (producto.presentaciones && producto.presentaciones.length > 0) {
                const presentacionEscaneada = producto.presentaciones.find(p =>
                  p.codigos.some(c => c.codigo === codigo)
                );
  
                if (presentacionEscaneada) {
                  this.presentacionEscaneadaId = presentacionEscaneada.id;
                  setTimeout(() => this.scrollToButtom(), 500);
                } else {
                  this.presentacionEscaneadaId = null;
                }
              } else {
                this.notificacionService.warn('No se encontraron presentaciones para este producto');
              }
            } else {
              this.notificacionService.danger('Producto no encontrado');
              this.resetProductDisplay();
              setTimeout(() => {
                this.inputEl.setFocus();
              }, 500);
            }
          });
        },
        (error) => {
          console.error('Error al obtener el producto:', error);          
        }
      );
    });
  }
  
  // ! MÉTODO PARA FILTRAR LOS PRODUCTOS CON VALOR !NULL Y ORDENAR POR PRECIO ASCENDENTE ↓
  filtrarPresentaciones() {
    if (this.producto?.presentaciones) {
      this.presentacionFilter = this.producto.presentaciones.filter(
        presentacion => presentacion.precioPrincipal?.precio !== null && !isNaN(presentacion.precioPrincipal?.precio)
       && presentacion.cantidad > 0);
      this.presentacionFilter.sort((a, b) => a.precioPrincipal.precio - b.precioPrincipal.precio);
      console.log('Presentaciones filtradas', this.presentacionFilter);
    }
  }

  // ! MÉTODO PARA REALIZAR EL SCROLL HASTA EL FINAL DE LA PANTALLA ↓
  scrollToButtom() {
    this.content.scrollToBottom(500);
    setTimeout(() => {
      this.setFocusOnInput();
    }, 100);
  }

  // ! MÉTODO PARA ACTIVAR EL FOCO DEL CAMPO DE CÓDIGO DE BARRAS ↓ 
  setFocusOnInput() {
    if (this.mode === 'lector' && this.inputEl) {
      setTimeout(() => {
        this.inputEl.setFocus();
      }, 100);
    }
  }

  // ! CONFIGURACIÓN DE LAS MONEDAS ↓
  onCurrencyChange(currencyId: number): void {
    this.updateCurrency(currencyId);
  }

  updateCurrency(currencyId: number): void {
    const selectedCurrency = this.monedas.find(moneda => moneda.id === currencyId);

    if (selectedCurrency) {
      this.exchangeRate = 1 / selectedCurrency.cambio;
      this.currentSymbol = selectedCurrency.simbolo;
      this.currentCurrency = selectedCurrency;

      // console.log(`Moneda seleccionada: ${selectedCurrency.denominacion}, Cambio: ${selectedCurrency.cambio}`);

      this.presentacionFilter.forEach(presentacion => {
        if (presentacion.precioPrincipal) {
          presentacion.precioPrincipal.precioConvertido = presentacion.precioPrincipal.precio * this.exchangeRate;
        }
      });
      // console.log('Precios actualizados', this.presentacionFilter);
    } else {
      console.error('Moneda no encontrada para el ID', currencyId);
    }
  }
  setDefaultCurrency(){
    const pyCurrency = this.monedas.find(moneda => moneda.id === 1);

    if(pyCurrency){
      this.selectedCurrency = pyCurrency;
      this.updateCurrency(pyCurrency.id);
    }
  }

  // ! SERVICIO PARA TRAER TODAS LAS MONEDAS ↓
  getAllMonedas(): void {
    this.monedaService.onGetAll().then(observable => {
      observable.subscribe({
        next: (monedas: Moneda[]) => {
          // console.log('Monedas obtenidas:', monedas);
          this.monedas = monedas.map(moneda => {
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
        error: (error) => {
          console.error('Error al obtener monedas', error);
        }
      });
    });
  }

  // ! CONFIGURACIÓN DE LA CÁMARA ↓ 

  startCam() {
    this.mode = 'cam';
  }

  stopCam() {
    this.mode = 'lector';
    
  }

  handleScanResult(barcode: string) {
    console.log("Código escaneado:", barcode);
    this.obtenerProductoPorCodigo(barcode).then(() => {
      this.barcodeForm.reset();
    });
    this.mode = 'cam'
  }

  async startFrontCamera() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Dispositivos detectados:', devices);
      const frontCamera = devices.find(
        device =>
          device.kind === 'videoinput' &&
          device.label.toLowerCase().includes('front')
      );
      if (frontCamera) {
        console.log('Cámara frontal encontrada:', frontCamera.label);
        this.selectedDeviceId = frontCamera.deviceId;
        this.videoConstraints = {
          advanced: [{ facingMode: "user" }],
          deviceId: frontCamera.deviceId,
        };
      } else {
        console.warn('No se detectó la cámara frontal');
      }
    } catch (error) {
      console.error('Error al iniciar la cámara frontal', error);
    }
  }

  async startCamManual(){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {deviceId: {exact: this.selectedDeviceId}},
      });

      console.log('Cámara iniciada manualmente:', stream);
      
    }catch(error){
      console.error('Error al iniciar la cámara manualmente:', error);
      
    }
  }
  
  // videoConstraints = {
  //   facingMode: { exact: 'user'},  
  //   width: { ideal: 1280 },
  //   height: { ideal: 720 }
  // };

  private resetProductDisplay() {
    this.producto = null;
    this.presentacionFilter = [];
    this.presentacionEscaneadaId = null;
  }

}
