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
import { ImagePopoverComponent } from 'src/app/components/image-popover/image-popover.component';
import { Location } from '@angular/common';
import { IonContent, Platform, IonItemSliding } from '@ionic/angular';
import { CodigoService } from '../../codigo/codigo.service';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { StockPorSucursalDialogComponent, StockPorSucursalDialogData } from '../../operaciones/movimiento-stock/stock-por-sucursal-dialog/stock-por-sucursal-dialog.component';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { InventarioService } from '../../inventario/inventario.service';
import { InventarioProductoEstado } from '../../inventario/inventario.model';

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
export class SearchProductoDialogComponent implements OnInit, AfterViewInit{

  @ViewChild('content', {static: false}) content: IonContent;

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
  ngAfterViewInit(): void {
    this.content.scrollEvents = true;
  }

  ngOnInit() {
    if (this.data?.data?.mostrarPrecio != null) {
      this.mostrarPrecio = this.data.data.mostrarPrecio;
    }

    if(this.data?.data?.isInventario == true){
      this.isInventario = true;
      this.selectedSucursal = this.data?.data?.sucursal;
      console.log('es inventario', this.selectedSucursal);

    }

    this.isWeb ? null : this.onCameraClick()

    console.log(this.data);

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
            console.log(codigoRes);
            if (codigoRes.length == 1) {
              this.onPresentacionClick(codigoRes[0]?.presentacion, codigoRes[0]?.presentacion?.producto, peso);
            }
          })
        } else {
          (await this.productoService.onSearch(text, offset)).pipe(untilDestroyed(this)).subscribe((res) => {
            if (offset == null) {
              this.productosList = res;
              if(this.productosList.length === 0){
                this.notificacionService.warn('Producto no encontrado');
              }
              // this.isSearchingList = new Array(this.isSearchingList.length)
              this.showCargarMas = true
            } else {
              if (res?.length > 0) this.showCargarMas = true
              const arr = [...this.productosList.concat(res)];
              this.productosList = arr;
              // this.isSearchingList = new Array(this.isSearchingList.length)
            }
            this.isSearching = false;
          });
        }

      }, 1000);
    }
  }

  onAvatarClick(image) {
    // this.popoverService.open(ImagePopoverComponent, {
    //   image
    // }, PopoverSize.MD)
    this.photoViewer.show(image, '')
  }

  onMasProductos() {
    this.showCargarMas = false;
    this.onSearchProducto(this.buscarControl.value, this.productosList?.length)
  }

  async onProductoClick(producto: Producto, index) {
    if (producto?.presentaciones == null) {
      (await this.productoService.getProducto(producto.id)).pipe(untilDestroyed(this)).subscribe((res) => {
        console.log(res);
        this.productosList[index].presentaciones = res.presentaciones;
      });
    }
    if (this.data?.data?.sucursalId != null && producto?.stockPorProducto == null) {
      this.isSearchingList[index] = true;
      (await this.productoService.onGetStockPorSucursal(producto.id, this.data?.data?.sucursalId)).pipe(untilDestroyed(this)).subscribe(res => {
        this.isSearchingList[index] = false;
        console.log(res);
        if (res != null) {
          setTimeout(() => {
            this.productosList[index].stockPorProducto = res;
          }, 2000);
        }
      })
    }
  }

  onPresentacionClick(presentacion: Presentacion, producto: Producto, peso?: number) {
    // this.dialogService.open('Atención', `Seleccionaste el producto ${producto.descripcion} con la presentacion de ${presentacion.cantidad} unidades.`)
    //   .then(res => {
    //     if (res.role == 'aceptar') {

    //     }
    //   })
    this.modalService.closeModal({ presentacion: presentacion, producto: producto, peso: peso })

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

  onScroll(event: any){
    const scrollTop = event.detail.scrollTop;
    this.isVisible = scrollTop > 10;
  }

  scrollToTop(){
    this.content.scrollToTop(500);
  }

  async onVerificarProducto(presentacion: Presentacion, producto: Producto, slidingItem: IonItemSliding) {
    slidingItem.close();

    if (!this.isInventario || !this.data?.data?.inventarioId) {
      this.notificacionService.warn('No se puede verificar el producto fuera del contexto de inventario');
      return;
    }

    try {
      const inventarioProductoId = Number(this.data.data.inventarioProductoId);
      const presentacionId = Number(presentacion.id);
      const usuarioId = Number(localStorage.getItem("usuarioId"));
      
      const stockReal = producto?.stockPorProducto ? (producto.stockPorProducto / presentacion.cantidad) : 0;
      
      const inventarioProductoItemInput = {
        inventarioProductoId: inventarioProductoId,
        presentacionId: presentacionId,
        cantidad: stockReal,
        cantidadFisica: stockReal,
        cantidadAnterior: stockReal,
        verificado: true,
        revisado: false,
        estado: InventarioProductoEstado.BUENO,
        usuarioId: usuarioId,
        fechaVerificado: null
      };

      try {
        if (producto.id) {
          try {
            if (producto.vencimiento === true && stockReal > 0) {
              const fechaDefecto = new Date();
              fechaDefecto.setMonth(fechaDefecto.getMonth() + 6);
              const fechaVencimientoDefecto = `${fechaDefecto.getFullYear()}-${String(fechaDefecto.getMonth() + 1).padStart(2, '0')}-${String(fechaDefecto.getDate()).padStart(2, '0')}T23:59:59`;
              
              inventarioProductoItemInput['vencimiento'] = fechaVencimientoDefecto;
            } else {
              inventarioProductoItemInput['vencimiento'] = null;
            }
          } catch (error) {
            console.warn('Error al verificar vencimiento del producto:', error);
          }
        }

        const itemsExistentesObservable = await this.inventarioService.onGetInventarioProItem(inventarioProductoId, 0);
        
        itemsExistentesObservable.subscribe((itemsExistentes) => {
          
          if (Array.isArray(itemsExistentes) && itemsExistentes.length > 0) {
            const itemExistente = itemsExistentes.find(item => 
              Number(item.presentacion?.id) === Number(presentacionId)
            );
            
            if (itemExistente) {
              
              if (itemExistente.id) {
                inventarioProductoItemInput['id'] = itemExistente.id;
              }
              
              if (stockReal > 0 && itemExistente.vencimiento) {
                let vencimientoStr;
                if (typeof itemExistente.vencimiento === 'string') {
                  const vencimientoString = String(itemExistente.vencimiento);
                  if (vencimientoString.includes('T')) {
                    vencimientoStr = vencimientoString;
                  } else if (vencimientoString.includes(' ')) {
                    vencimientoStr = vencimientoString.replace(' ', 'T');
                  } else {
                    vencimientoStr = `${vencimientoString}T23:59:59`;
                  }
                } else {
                  const fechaVenc = new Date(itemExistente.vencimiento);
                  vencimientoStr = fechaVenc.toISOString().split('.')[0]; 
                }
                inventarioProductoItemInput['vencimiento'] = vencimientoStr;
              } else {
                inventarioProductoItemInput['vencimiento'] = null;
              }
            } 
          }
          this.guardarVerificacion(inventarioProductoItemInput);
        }, (error) => {
          console.warn('No se pudo obtener información del item existente:', error);
          this.guardarVerificacion(inventarioProductoItemInput);
        });
      } catch (error) {
        console.warn('Error al intentar obtener item existente:', error);
        this.guardarVerificacion(inventarioProductoItemInput);
      }
    } catch (error) {
      console.error('Error al verificar producto:', error);
      this.notificacionService.danger('Error al verificar el producto: ' + (error as any)?.message);
    }
  }

  private async guardarVerificacion(inventarioProductoItemInput: any) {
    console.log("Enviando datos para guardar:", JSON.stringify(inventarioProductoItemInput));

    (await this.inventarioService.onSaveInventarioProductoItem(inventarioProductoItemInput))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.notificacionService.success('Producto verificado correctamente');
          this.modalService.closeModal(res);
        } else {
          this.notificacionService.warn('No se pudo verificar el producto');
          this.modalService.closeModal(null);
        }
      }, error => {
        console.error('Error detallado:', error);
      });
  }
}
