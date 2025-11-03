import { ActivatedRoute } from '@angular/router';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { DialogoService } from 'src/app/services/dialogo.service';
import { ModalService } from './../../../services/modal.service';
import { PopOverService, PopoverSize } from './../../../services/pop-over.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Producto } from 'src/app/domains/productos/producto.model';
import { UntypedFormControl, Validators } from '@angular/forms';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ProductoService } from '../producto.service';
import { Location } from '@angular/common';
import { IonContent, Platform } from '@ionic/angular';
import { CodigoService } from '../../codigo/codigo.service';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { StockPorSucursalDialogComponent, StockPorSucursalDialogData } from '../../operaciones/movimiento-stock/stock-por-sucursal-dialog/stock-por-sucursal-dialog.component';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { InventarioProductoEstado, InventarioProductoItem, InventarioProductoItemInput } from '../../inventario/inventario.model';
import { InventarioService } from '../../inventario/inventario.service';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { EditInventarioItemDialogComponent, InventarioItemData } from '../../inventario/edit-inventario-item-dialog/edit-inventario-item-dialog.component';

export interface SearchProductoDialogData {
  mostrarPrecio: boolean;
  sucursalId?: number;
}

@UntilDestroy()
@Component({
  selector: 'app-search-producto-dialog',
  templateUrl: './search-producto-dialog.component.html',
  styleUrls: ['./search-producto-dialog.component.scss'],
  providers: [BarcodeScanner, PhotoViewer]
})
export class SearchProductoDialogComponent implements OnInit, AfterViewInit {

  @ViewChild('content', { static: false }) content: IonContent;

  @Input()
  data;

  buscarControl = new UntypedFormControl('', [Validators.required, Validators.minLength(1)])
  productosList: Producto[]

  isSearching
  onSearchTimer
  showCargarMas = true;
  mostrarPrecio = false;
  isSearchingList: boolean[] = [];
  isInventario = false;
  isVisible: boolean = false;
  selectedSucursal: Sucursal;

  isWeb = false;

  estadosList = Object.values(InventarioProductoEstado);
  cantidadById: { [id: number]: number } = {};
  vencimientoById: { [id: number]: any } = {};
  estadoById: { [id: number]: InventarioProductoEstado } = {};
  itemsByPresentacionId: { [id: number]: InventarioProductoItem[] } = {};
  displayedItemsByPresentacionId: { [id: number]: InventarioProductoItem[] } = {};

  constructor(
    private productoService: ProductoService,
    private popoverService: PopOverService,
    private modalService: ModalService,
    private dialogService: DialogoService,
    private barcodeScanner: BarcodeScanner,
    private route: ActivatedRoute,
    private _location: Location,
    private plf: Platform,
    private codigoService: CodigoService,
    private photoViewer: PhotoViewer,
    private notificacionService: NotificacionService,
    private inventarioService: InventarioService

  ) {
    this.isWeb = plf.platforms().includes('mobileweb');
  }
  trackByProductoId = (_: number, p: Producto) => p?.id;
  trackByPresentacionId = (_: number, pr: any) => pr?.id;
  trackByInventarioItemId = (_: number, it: InventarioProductoItem) => it?.id;

  ngAfterViewInit(): void {
    this.content.scrollEvents = true;
  }

  ngOnInit() {
    if (this.data?.data?.mostrarPrecio != null) {
      this.mostrarPrecio = this.data.data.mostrarPrecio;
    }

    if (this.data?.data?.isInventario == true) {
      this.isInventario = true;
      this.selectedSucursal = this.data?.data?.sucursal;
      console.log('es inventario', this.selectedSucursal);
    }

    this.isWeb ? null : this.onCameraClick()

    this.displayedItemsByPresentacionId = {};
  }

  onBuscarClick() {
    this.onSearchProducto(this.buscarControl.value, null)
  }

  onSearchProducto(text: string, offset?: number) {
    let isPesable = false;
    let peso;
    let codigo;
    this.isSearching = true;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }
    if (text == "" || text == null || text == " ") {
      console.log("text is ", text);
      this.isSearching = false;
    } else {
      if (text.length == 13 && text.substring(0, 2) == '20') {
        isPesable = true;
        codigo = text.substring(2, 7)
        peso = +text.substring(7, 12) / 1000
        text = codigo
      }
      this.onSearchTimer = setTimeout(async () => {
        if (isPesable) {
          (await this.codigoService.onGetCodigoPorCodigo(codigo)).pipe(untilDestroyed(this)).subscribe(codigoRes => {
            if (codigoRes.length == 1) {
              this.onPresentacionClick(codigoRes[0]?.presentacion, codigoRes[0]?.presentacion?.producto, peso);
            }
          })
        } else {
          (await this.productoService.onSearch(text, offset)).pipe(untilDestroyed(this)).subscribe((res) => {
            if (offset == null) {
              this.productosList = res;
              if (this.productosList.length === 0) {
                this.notificacionService.warn('Producto no encontrado');
              }
              this.showCargarMas = true
            } else {
              if (res?.length > 0) this.showCargarMas = true
              const arr = [...this.productosList.concat(res)];
              this.productosList = arr;
            }
            this.isSearching = false;
          });
        }

      }, 1000);
    }
  }

  onAvatarClick(image) {
    this.photoViewer.show(image, '')
  }

  onMasProductos() {
    this.showCargarMas = false;
    this.onSearchProducto(this.buscarControl.value, this.productosList?.length)
  }

  async onProductoClick(producto: Producto, index) {
    if (producto?.presentaciones == null) {
      (await this.productoService.getProducto(producto.id)).pipe(untilDestroyed(this)).subscribe((res) => {
        this.productosList[index].presentaciones = res.presentaciones;
      });
    }
    if (this.data?.data?.sucursalId != null && producto?.stockPorProducto == null) {
      this.isSearchingList[index] = true;
      (await this.productoService.onGetStockPorSucursal(producto.id, this.data?.data?.sucursalId)).pipe(untilDestroyed(this)).subscribe(res => {
        this.isSearchingList[index] = false;
        if (res != null) {
          setTimeout(() => {
            this.productosList[index].stockPorProducto = res;
          }, 2000);
        }
      })
    }
  }

  onPresentacionClick(presentacion: Presentacion, producto: Producto, peso?: number) {
    this.modalService.closeModal({ presentacion: presentacion, producto: producto, peso: peso })
  }

  async onAccordionChangeProducto(event: any, producto: Producto) {
  }

  async onAccordionChangePresentacion(event: any, producto: Producto) {
    const valueRaw = event?.detail?.value;
    if (valueRaw == null) return;
    const presentacionId = typeof valueRaw === 'number' ? valueRaw : parseInt(valueRaw, 10);
    if (!Number.isFinite(presentacionId)) return;
    await this.cargarItemsInventariosAnteriores(presentacionId);
  }

  async onAccordionTogglePresentacion(event: any, presentacionId: number, producto: Producto) {
    if (event.detail.open && presentacionId) {
      await this.cargarItemsInventariosAnteriores(presentacionId);
    }
  }

  private async cargarItemsInventariosAnteriores(presentacionId: number) {
    const invPro = this.data?.data?.invPro;
    if (!this.isInventario || !presentacionId || !invPro?.id) return;

    (await this.inventarioService.onGetItemsDeInventariosAnteriores(invPro.id, presentacionId, 0, 20))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        const items = res || [];
        this.itemsByPresentacionId[presentacionId] = items;
        this.displayedItemsByPresentacionId[presentacionId] = [...items];
      }, (error) => {
        console.error('Error al cargar items de inventarios', error);
      });
  }
  private removeItemFromDisplay(presentacionId: number, itemId: number) {
    if (this.displayedItemsByPresentacionId[presentacionId]) {
      this.displayedItemsByPresentacionId[presentacionId] =
        this.displayedItemsByPresentacionId[presentacionId].filter(it => it.id !== itemId);
    }
  }
  private addItemToDisplay(presentacionId: number, newItem: InventarioProductoItem) {
    if (!this.displayedItemsByPresentacionId[presentacionId]) {
      this.displayedItemsByPresentacionId[presentacionId] = [];
    }
    const exists = this.displayedItemsByPresentacionId[presentacionId]
      .some(item => item.id === newItem.id);

    if (!exists) {
      this.displayedItemsByPresentacionId[presentacionId].unshift(newItem);
    }
  }

  async onEditarItem(item: InventarioProductoItem, invProId: number) {
    const data: InventarioItemData = {
      inventarioProducto: { id: invProId } as any,
      inventarioProductoItem: item,
      presentacion: item.presentacion,
      producto: item.presentacion?.producto,
      fromPreviousInventory: true
    };

    this.modalService.openModal(EditInventarioItemDialogComponent, data).then(async (result: any) => {
      const role = result?.role;
      const payload: any = result?.data ?? null;
      if (!payload || role === 'cancel' || role === 'backdrop') {
        return;
      }
      {
        payload.id = null;
        payload.inventarioProductoId = invProId;
        if (!payload.presentacionId && item.presentacion?.id) {
          payload.presentacionId = item.presentacion.id;
        }

        console.log('Guardando nuevo item en inventario', payload);
        (await this.inventarioService.onSaveInventarioProductoItem(payload))
          .pipe(untilDestroyed(this))
          .subscribe(async (savedItem) => {
            if (savedItem) {
              const presentacionId = item.presentacion?.id;
              this.inventarioService.inventarioItemSaved$.next({
                item: savedItem,
                inventarioProductoId: invProId
              });
              this.removeItemFromDisplay(presentacionId, item.id);

              this.notificacionService.open('Vencimiento agregado al inventario', TipoNotificacion.SUCCESS, 2);
            }
          }, (error) => {
            console.error('Error al guardar item:', error);
            this.notificacionService.open('Error al guardar el vencimiento', TipoNotificacion.DANGER, 2);
          });
      }
    });
  }

  async onEliminarItem(item: InventarioProductoItem, presentacionId: number, invProId: number) {
    this.dialogService.open('Confirmar', '¿Desea quitar este vencimiento del inventario')
      .then(async (res) => {
        if (res.role === 'aceptar') {
          this.removeItemFromDisplay(presentacionId, item.id);
          if (item.inventarioProducto?.id === invProId && item.id) {
            (await this.inventarioService.onDeleteInventarioProductoItem(item.id))
              .pipe(untilDestroyed(this))
              .subscribe(() => {
                this.notificacionService.open('Vencimiento quitado del inventario', TipoNotificacion.SUCCESS, 2);
              });
          } else {
            this.notificacionService.open('se limpio correctamente', TipoNotificacion.SUCCESS, 2);
          }
        }
      });
  }

  async onGuardarPresentacion(presentacion: Presentacion, producto: Producto) {
    if (!this.isInventario) { return; }
    const cantidad = this.cantidadById[presentacion.id];
    const venc = this.vencimientoById[presentacion.id];
    const estado = this.estadoById[presentacion.id] || InventarioProductoEstado.BUENO;
    if (cantidad == null || cantidad < 0 || venc == null) {
      this.notificacionService.warn('Complete la cantidad y el vencimiento');
      return;
    }
    const invPro = this.data?.data?.invPro;
    const vencStr = typeof venc === 'string'
      ? (venc.includes('/') ? this.convertToIsoDate(venc) : venc)
      : dateToString(new Date(venc));
    const input: InventarioProductoItemInput = {
      id: null,
      inventarioProductoId: invPro?.id,
      zonaId: invPro?.zona?.id,
      presentacionId: presentacion?.id,
      cantidad: +cantidad,
      cantidadFisica: null,
      vencimiento: vencStr,
      estado: estado,
      usuarioId: null
    } as any;

    (await this.productoService.onGetStockPorSucursal(producto?.id, this.selectedSucursal?.id))
      .pipe(untilDestroyed(this))
      .subscribe(async (stockResponse) => {
        if (stockResponse == null) {
          this.notificacionService.warn('No se pudo obtener el stock actual');
          return;
        }
        input.cantidadFisica = stockResponse;
        (await this.inventarioService.onSaveInventarioProductoItem(input))
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null) {
              this.inventarioService.inventarioItemSaved$.next({ item: res, inventarioProductoId: invPro?.id });
              this.cantidadById[presentacion.id] = null;
              this.vencimientoById[presentacion.id] = null;
              this.estadoById[presentacion.id] = InventarioProductoEstado.BUENO;
            }
          });
      });
  }

  private convertToIsoDate(value: string): string {
    const parts = value.split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return value;
  }

  onBack() {
    if (this.modalService?.currentModal != null) {
      this.modalService.closeModal(null)
    } else {
      this._location.back()
    }
  }

  onCameraClick() {
    this.barcodeScanner.scan().then(barcodeData => {
      this.buscarControl.setValue(barcodeData.text)
      this.onSearchProducto(this.buscarControl.value, null)
    })
  }

  onVerStock(producto) {
    let data: StockPorSucursalDialogData = {
      producto: producto
    }
    this.modalService.openModal(StockPorSucursalDialogComponent, data).then(res => {

    })
  }

  onScroll(event: any) {
    const scrollTop = event.detail.scrollTop;
    this.isVisible = scrollTop > 10;
  }

  scrollToTop() {
    this.content.scrollToTop(500);
  }

  onVencChange(presentacionId: number, ev: any) {
    this.vencimientoById[presentacionId] = ev?.detail?.value;
  }
}