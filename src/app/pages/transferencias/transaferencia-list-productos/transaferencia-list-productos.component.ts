import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { IonAccordionGroup, IonContent, Platform } from '@ionic/angular';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { DialogoService } from 'src/app/services/dialogo.service';
import { ModalService } from 'src/app/services/modal.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { TransferenciaService } from '../transferencia.service';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { CodigoService } from '../../codigo/codigo.service';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { Producto } from 'src/app/domains/productos/producto.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { ProductoService } from '../../producto/producto.service';
import { MainService } from 'src/app/services/main.service';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { TransferenciaItemInput } from '../transferencia.model';

@UntilDestroy()
@Component({
  selector: 'app-transaferencia-list-productos',
  templateUrl: './transaferencia-list-productos.component.html',
  styleUrls: ['./transaferencia-list-productos.component.scss'],
  providers: [BarcodeScanner, PhotoViewer]
})
export class TransaferenciaListProductosComponent implements OnInit, AfterViewInit {

  @ViewChild('content', { static: false }) content: IonContent;
  @ViewChild('buscarInput') buscarInput: any;
  @ViewChild('productosAccordion', { static: false }) productosAccordion: IonAccordionGroup;

  buscarControl = new UntypedFormControl('', [Validators.required, Validators.minLength(1)]);
  productosList: Producto[] = [];

  isSearching = false;
  onSearchTimer: any;
  showCargarMas = true;
  isSearchingList: boolean[] = [];
  isVisible: boolean = false;
  isWeb = false;
  sucursalOrigen: Sucursal;
  sucursalDestino: Sucursal;
  transferenciaId: number;
  mostrarPrecio: boolean = false;
  cantidadById: { [id: number]: number } = {};
  vencimientoById: { [id: number]: any } = {};
  observacionById: { [id: number]: string } = {};
  displayedItemsByPresentacionId: { [id: number]: any[] } = {};
  stockDisponibleById: { [id: number]: number } = {};
  stockDisponibleDestinoById: { [id: number]: number } = {};
  isSearchingDestinoList: boolean[] = [];
  mostrarItemsLocales: boolean = false;
  private lastAddClickAtById: { [id: number]: number } = {};
  private isDialogOpen: boolean = false;
  private lastDeleteClickAt: number = 0;
  private readonly DELETE_DEBOUNCE_MS = 500;

  constructor(
    private productoService: ProductoService,
    private modalService: ModalService,
    private dialogService: DialogoService,
    private barcodeScanner: BarcodeScanner,
    private _location: Location,
    private platform: Platform,
    private codigoService: CodigoService,
    private photoViewer: PhotoViewer,
    private notificacionService: NotificacionService,
    private transferenciaService: TransferenciaService,
    private mainService: MainService,
    private router: Router
  ) {
    this.isWeb = this.platform.platforms().includes('mobileweb');
  }

  trackByProductoId = (_: number, p: Producto) => p?.id;
  trackByPresentacionId = (_: number, pr: any) => pr?.id;
  trackByTransferenciaItemId = (index: number, it: any) => it?.id || `local-${index}`;

  ngAfterViewInit(): void {
    this.content.scrollEvents = true;
    setTimeout(() => {
      if (this.buscarInput && this.buscarInput.nativeElement) {
        this.buscarInput.nativeElement.setFocus();
      }
    }, 500);
  }

  async ngOnInit() {
    console.log('ngOnInit - Iniciando componente de lista de productos');
    await this.obtenerDatosSucursales();
    this.displayedItemsByPresentacionId = {};

    if (!this.isWeb) {
      this.onCameraClick();
    }
  }

  private async obtenerDatosSucursales() {
    console.log('obtenerDatosSucursales - Obteniendo datos de navegación');
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as any;
      this.sucursalOrigen = state.sucursalOrigen;
      this.sucursalDestino = state.sucursalDestino;
      this.transferenciaId = state.transferenciaId;
      console.log('Datos recibidos:', {
        origen: this.sucursalOrigen,
        destino: this.sucursalDestino,
        transferenciaId: this.transferenciaId
      });

      if (!this.transferenciaId) {
        console.error('ERROR: No se recibió transferenciaId');
        this.notificacionService.open('Error: No se pudo crear la transferencia', TipoNotificacion.DANGER, 2);
        this.onBack();
      }
    } else {
      console.error('No se recibieron datos de navegación');
      this.notificacionService.open('No se recibieron datos de sucursales', TipoNotificacion.DANGER, 2);
      this.onBack();
    }
  }

  // Loading es gestionado por GenericCrudService en las llamadas al backend

  private calcularStockDisponible(producto: Producto, presentacion: Presentacion): number {
    if (!producto || producto.stockPorProducto == null || !presentacion || !presentacion.cantidad) {
      return 0;
    }
    return producto.stockPorProducto / presentacion.cantidad;
  }

  private calcularStockDisponibleDestino(producto: any, presentacion: Presentacion): number {
    if (!producto || producto.stockPorProductoDestino == null || !presentacion || !presentacion.cantidad) {
      return 0;
    }
    return producto.stockPorProductoDestino / presentacion.cantidad;
  }
  private getStockDisponible(producto: Producto, presentacion: Presentacion): number {
    const id = presentacion?.id;
    if (id == null) return 0;
    if (typeof this.stockDisponibleById[id] === 'number') {
      return this.stockDisponibleById[id];
    }
    const calc = this.calcularStockDisponible(producto, presentacion);
    this.stockDisponibleById[id] = calc;
    return calc;
  }

  private actualizarStockDisponibleParaProducto(producto: Producto) {
    if (!producto?.presentaciones?.length || producto.stockPorProducto == null) {
      return;
    }
    for (const pr of producto.presentaciones) {
      if (pr?.id != null) {
        this.stockDisponibleById[pr.id] = this.calcularStockDisponible(producto, pr);
      }
    }
  }
  private actualizarStockDisponibleDestinoParaProducto(producto: any) {
    if (!producto?.presentaciones?.length || producto.stockPorProductoDestino == null) {
      return;
    }
    for (const pr of producto.presentaciones) {
      if (pr?.id != null) {
        this.stockDisponibleDestinoById[pr.id] = this.calcularStockDisponibleDestino(producto, pr);
      }
    }
  }
  private formatDateForBackend(date: any): string | null {
    if (!date) return null;

    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return null;
    }
  }

  onBuscarClick() {
    console.log('onBuscarClick - Buscando:', this.buscarControl.value);
    if (this.buscarControl.valid) {
      this.onSearchProducto(this.buscarControl.value, null);
    } else {
      this.notificacionService.warn('Ingrese un término de búsqueda válido');
    }
  }

  onSearchProducto(text: string, offset?: number) {
    console.log('onSearchProducto - Ejecutando búsqueda:', { text, offset });

    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }

    if (!text || text.trim() === '') {
      this.isSearching = false;
      this.productosList = [];
      return;
    }

    this.isSearching = true;

    let isPesable = false;
    let peso: number;
    let codigo: string;

    if (text.length == 13 && text.substring(0, 2) == '20') {
      isPesable = true;
      codigo = text.substring(2, 7);
      peso = +text.substring(7, 12) / 1000;
      text = codigo;
      console.log('Producto pesable detectado:', { codigo, peso });
    }

    this.onSearchTimer = setTimeout(async () => {
      try {
        if (isPesable) {
          console.log('Buscando código pesable:', codigo);
          (await this.codigoService.onGetCodigoPorCodigo(codigo))
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (codigoRes) => {
                console.log('Resultado código pesable:', codigoRes);
                if (codigoRes && codigoRes.length > 0) {
                  this.abrirFormularioPresentacion(codigoRes[0]?.presentacion, codigoRes[0]?.presentacion?.producto, peso);
                } else {
                  this.notificacionService.warn('Código de barras no encontrado');
                }
                this.isSearching = false;
              },
              error: (error) => {
                console.error('Error buscando código:', error);
                this.isSearching = false;
                this.notificacionService.open('Error al buscar código', TipoNotificacion.DANGER, 2);
              }
            });
        } else {
          console.log('Buscando producto por texto:', text);
          (await this.productoService.onSearch(text, offset))
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (res) => {
                console.log('Resultados de búsqueda:', res);
                if (offset == null) {
                  this.productosList = res || [];
                  if (this.productosList.length === 0) {
                    this.notificacionService.warn('Producto no encontrado');
                  } else {
                    this.notificacionService.open(`Encontrados ${this.productosList.length} productos`, TipoNotificacion.SUCCESS, 2);
                  }
                  this.showCargarMas = true;
                } else {
                  if (res?.length > 0) {
                    this.showCargarMas = true;
                    this.productosList = [...this.productosList, ...res];
                  }
                }
                this.isSearching = false;
              },
              error: (error) => {
                console.error('Error buscando productos:', error);
                this.isSearching = false;
                this.notificacionService.open('Error al buscar productos', TipoNotificacion.DANGER, 2);
              }
            });
        }
      } catch (error) {
        console.error('Error en búsqueda:', error);
        this.isSearching = false;
        this.notificacionService.open('Error al realizar la búsqueda', TipoNotificacion.DANGER, 2);
      }
    }, 800);
  }

  onAvatarClick(image: string) {
    this.photoViewer.show(image, '');
  }

  onMasProductos() {
    this.showCargarMas = false;
    this.onSearchProducto(this.buscarControl.value, this.productosList?.length);
  }

  async onProductoClick(producto: Producto, index: number) {
    console.log('onProductoClick - Clic en producto:', { producto, index });
    if (producto?.presentaciones == null) {
      console.log('Cargando presentaciones para producto:', producto.id);
      (await this.productoService.getProducto(producto.id))
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => {
            this.productosList[index].presentaciones = res.presentaciones;
            console.log('Presentaciones cargadas:', res.presentaciones);
            this.actualizarStockDisponibleParaProducto(this.productosList[index]);
          },
          error: (error) => {
            console.error('Error cargando presentaciones:', error);
          }
        });
    }
    if (this.sucursalOrigen?.id != null && producto?.stockPorProducto == null) {
      this.isSearchingList[index] = true;
      console.log('Cargando stock para producto:', { productoId: producto.id, sucursalId: this.sucursalOrigen.id });
      (await this.productoService.onGetStockPorSucursal(producto.id, this.sucursalOrigen.id))
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => {
            this.isSearchingList[index] = false;
            if (res != null) {
              this.productosList[index].stockPorProducto = res;
              console.log('Stock cargado:', res);
              this.actualizarStockDisponibleParaProducto(this.productosList[index]);
            }
          },
          error: (error) => {
            this.isSearchingList[index] = false;
            console.error('Error cargando stock:', error);
          }
        });
    }
    if (this.sucursalDestino?.id != null && (producto as any)?.stockPorProductoDestino == null) {
      this.isSearchingDestinoList[index] = true;
      console.log('Cargando stock DESTINO para producto:', { productoId: producto.id, sucursalDestinoId: this.sucursalDestino.id });
      (await this.productoService.onGetStockPorSucursal(producto.id, this.sucursalDestino.id))
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => {
            this.isSearchingDestinoList[index] = false;
            if (res != null) {
              (this.productosList[index] as any).stockPorProductoDestino = res;
              console.log('Stock DESTINO cargado:', res);
              this.actualizarStockDisponibleDestinoParaProducto(this.productosList[index]);
            }
          },
          error: (error) => {
            this.isSearchingDestinoList[index] = false;
            console.error('Error cargando stock DESTINO:', error);
          }
        });
    }
  }

  private abrirFormularioPresentacion(presentacion: Presentacion, producto: Producto, peso?: number) {
    console.log('abrirFormularioPresentacion - Abriendo formulario para:', {
      producto: producto.descripcion,
      presentacion,
      peso
    });
    this.notificacionService.open(`Producto encontrado: ${producto.descripcion}`, TipoNotificacion.SUCCESS, 2);
  }

  onBack() {
    console.log('onBack - Regresando a edición de transferencia');
    const destino = this.transferenciaId != null ? ['transferencias', 'edit', this.transferenciaId] : ['transferencias', 'edit', 'new'];
    console.log('Navegando a:', destino);
    this.router.navigate(destino, {
      state: {
        sucursalOrigen: this.sucursalOrigen,
        sucursalDestino: this.sucursalDestino,
        transferenciaId: this.transferenciaId
      }
    });
  }

  onCameraClick() {
    console.log('onCameraClick - Iniciando escáner de código de barras');
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Código escaneado:', barcodeData.text);
      this.buscarControl.setValue(barcodeData.text);
      this.onSearchProducto(this.buscarControl.value, null);
    }).catch(error => {
      console.error('Error escaneando:', error);
      this.notificacionService.open('Error al escanear código', TipoNotificacion.DANGER, 2);
    });
  }

  validarCantidad(presentacion: Presentacion, producto: Producto) {
    const cantidad = this.cantidadById[presentacion.id];
    console.log('validarCantidad - Validando cantidad:', {
      presentacionId: presentacion.id,
      cantidad,
      stockPorProducto: producto?.stockPorProducto,
      cantidadPresentacion: presentacion?.cantidad
    });
    if (cantidad && cantidad > 0) {
      const stockDisponible = this.getStockDisponible(producto, presentacion);
      console.log('Stock disponible (origen) para validar visualmente:', stockDisponible);
    }
  }

  onVencChange(presentacionId: number, event: any) {
    console.log('onVencChange - Cambiando vencimiento:', { presentacionId, value: event.target.value });
    this.vencimientoById[presentacionId] = event.target.value;
  }

  onAccordionChangeProducto(event: any, producto: Producto) {
    console.log('onAccordionChangeProducto - Cambio en acordeón de producto:', { event, producto });
  }

  onAccordionChangePresentacion(event: any, producto: Producto) {
    console.log('onAccordionChangePresentacion - Cambio en acordeón de presentación:', { event, producto });
  }

  onAccordionTogglePresentacion(event: any, presentacionId: number, producto: Producto) {
    console.log('onAccordionTogglePresentacion - Toggle en acordeón de presentación:', { event, presentacionId, producto });
  }

  limpiarFormulario(presentacionId: number) {
    console.log('limpiarFormulario - Limpiando formulario para presentación:', presentacionId);
    this.cantidadById[presentacionId] = null;
    this.vencimientoById[presentacionId] = null;
    this.observacionById[presentacionId] = '';
  }

  onEditarItemTransferencia(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (!item) {
      console.error('onEditarItemTransferencia - Item no válido');
      return;
    }

    console.log('onEditarItemTransferencia - Editando item:', item);
    const presentacionId = item.presentacionPreTransferencia?.id;

    if (presentacionId) {
      this.cantidadById[presentacionId] = item.cantidadPreTransferencia;
      this.vencimientoById[presentacionId] = item.vencimientoPreTransferencia;
      this.observacionById[presentacionId] = item.observacionPreTransferencia;
    }
  }

  onEliminarItemTransferencia(item: any, presentacionId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const now = Date.now();
    if (now - this.lastDeleteClickAt < this.DELETE_DEBOUNCE_MS) {
      console.log('onEliminarItemTransferencia - Ignorando clic duplicado (debounce)');
      return;
    }
    this.lastDeleteClickAt = now;
    if (!item) {
      console.error('onEliminarItemTransferencia - Item no válido');
      return;
    }

    console.log('onEliminarItemTransferencia - Procesando eliminación mediante servicio genérico:', {
      itemId: item.id,
      presentacionId
    });

    this.procesarEliminacionItem(item, presentacionId);
  }

  private async procesarEliminacionItem(item: any, presentacionId: number): Promise<void> {
    try {
      if (item.id) {
        console.log('procesarEliminacionItem - Eliminando item con ID:', item.id);
        (await this.transferenciaService.onDeleteTransferenciaItem(item.id))
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (res2) => {
              if (res2) {
                console.log('procesarEliminacionItem - Item eliminado correctamente');
                this.removerItemDeLista(item, presentacionId);
                this.notificacionService.open('Item eliminado correctamente', TipoNotificacion.SUCCESS, 2);
              } else {
                console.error('procesarEliminacionItem - Error: respuesta del servidor fue falsa');
                this.notificacionService.open('Error al eliminar el item', TipoNotificacion.DANGER, 2);
              }
            },
            error: (error) => {
              console.error('procesarEliminacionItem - Error eliminando item:', error);
              this.notificacionService.open('Error al eliminar el item', TipoNotificacion.DANGER, 2);
            }
          });
      } else {
        console.log('procesarEliminacionItem - Eliminando item local (sin ID)');
        this.removerItemDeLista(item, presentacionId);
        this.notificacionService.open('Item eliminado correctamente', TipoNotificacion.SUCCESS, 2);
      }
    } catch (error) {
      console.error('procesarEliminacionItem - Error inesperado:', error);
      this.notificacionService.open('Error inesperado al eliminar el item', TipoNotificacion.DANGER, 2);
    }
  }

  private removerItemDeLista(item: any, presentacionId: number): void {
    const items = this.displayedItemsByPresentacionId[presentacionId] || [];

    if (item.id) {
      const index = items.findIndex(i => i?.id === item.id);
      if (index >= 0) {
        items.splice(index, 1);
      }
    } else {
      const index = items.findIndex(i => i === item);
      if (index >= 0) {
        items.splice(index, 1);
      }
    }
  }

  async onGuardarEnTransferencia(presentacion: Presentacion, producto: Producto) {
    console.log('🔵 onGuardarEnTransferencia - Iniciando guardado', {
      presentacionId: presentacion.id,
      productoId: producto.id,
      transferenciaId: this.transferenciaId,
      cantidad: this.cantidadById[presentacion.id],
      vencimiento: this.vencimientoById[presentacion.id],
      observacion: this.observacionById[presentacion.id]
    });

    const now = Date.now();
    const last = this.lastAddClickAtById[presentacion.id] || 0;
    if (now - last < 600) {
      console.log('⚠️ Evitando doble click rápido');
      return;
    }
    this.lastAddClickAtById[presentacion.id] = now;

    const cantidad = this.cantidadById[presentacion.id];
    if (!cantidad || cantidad <= 0) {
      console.warn('⚠️ Cantidad inválida:', cantidad);
      this.notificacionService.warn('Ingrese una cantidad válida');
      return;
    }

    if (!this.transferenciaId) {
      console.error('❌ ERROR CRÍTICO: No hay transferenciaId disponible');
      this.notificacionService.open('Error: No se pudo crear la transferencia', TipoNotificacion.DANGER, 2);
      return;
    }

    try {
      console.log('💾 Preparando item para guardar en transferencia:', this.transferenciaId);

      const itemInput: TransferenciaItemInput = {
        id: null,
        transferenciaId: this.transferenciaId,
        presentacionPreTransferenciaId: presentacion.id,
        presentacionPreparacionId: null,
        presentacionTransporteId: null,
        presentacionRecepcionId: null,
        cantidadPreTransferencia: cantidad,
        cantidadPreparacion: 0,
        cantidadTransporte: 0,
        cantidadRecepcion: 0,
        observacionPreTransferencia: this.observacionById[presentacion.id] || null,
        observacionPreparacion: null,
        observacionTransporte: null,
        observacionRecepcion: null,
        vencimientoPreTransferencia: this.formatDateForBackend(this.vencimientoById[presentacion.id]),
        vencimientoPreparacion: null,
        vencimientoTransporte: null,
        vencimientoRecepcion: null,
        motivoModificacionPreTransferencia: null,
        motivoModificacionPreparacion: null,
        motivoModificacionTransporte: null,
        motivoModificacionRecepcion: null,
        motivoRechazoPreTransferencia: null,
        motivoRechazoPreparacion: null,
        motivoRechazoTransporte: null,
        motivoRechazoRecepcion: null,
        activo: true,
        poseeVencimiento: !!this.vencimientoById[presentacion.id],
        usuarioId: this.mainService.usuarioActual?.id,
        creadoEn: null
      };

      console.log('📤 Datos del item a enviar:', JSON.stringify(itemInput, null, 2));

      const itemObservable = await this.transferenciaService.onSaveTransferenciaItem(itemInput);

      itemObservable.pipe(untilDestroyed(this)).subscribe({
        next: (result) => {
          console.log('✅ Respuesta exitosa del servicio:', result);

          if (result) {
            this.notificacionService.open('Producto guardado en la transferencia', TipoNotificacion.SUCCESS, 2);
            this.limpiarFormulario(presentacion.id);
            this.resetBusquedaYAccordion();
            console.log('✅ Item agregado exitosamente, formulario limpiado y búsqueda reseteada');
          } else {
            console.error('❌ El servicio retornó null o false');
            this.notificacionService.open('Error: No se pudo guardar el producto', TipoNotificacion.DANGER, 2);
          }
        },
        error: (error) => {
          console.error('❌ Error guardando item:', error);
          console.error('Detalles del error:', JSON.stringify(error, null, 2));

          let mensajeError = 'Error al guardar el producto';
          if (error?.message) {
            mensajeError += `: ${error.message}`;
          }

          this.notificacionService.open(mensajeError, TipoNotificacion.DANGER, 3);
        }
      });

    } catch (error) {
      console.error('❌ Error general al guardar:', error);
      console.error('Stack trace:', error);
      this.notificacionService.open('Error inesperado al guardar el producto', TipoNotificacion.DANGER, 2);
    }
  }

  onScroll(event: any) {
    const scrollTop = event.detail.scrollTop;
    this.isVisible = scrollTop > 300;
  }

  scrollToTop() {
    this.content.scrollToTop(500);
  }

  private resetBusquedaYAccordion(): void {
    this.buscarControl.setValue('');
    this.productosList = [];
    if (this.productosAccordion) {
      this.productosAccordion.value = undefined as any;
    }
  }
}