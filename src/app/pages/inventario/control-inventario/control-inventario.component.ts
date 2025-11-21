import { Router } from '@angular/router';
import { PageInfo } from 'src/app/app.component';
import { ProductoSaldoDto } from '../inventario.model';
import { InventarioService } from '../inventario.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';
import { Producto } from 'src/app/domains/productos/producto.model';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { AjustarStockDialogComponent } from '../../producto/ajustar-stock-dialog/ajustar-stock-dialog.component';
import { SearchProductoDialogComponent } from '../../producto/search-producto-dialog/search-producto-dialog.component';

@Component({
  selector: 'app-control-inventario',
  templateUrl: './control-inventario.component.html',
  styleUrls: ['./control-inventario.component.scss'],
})
export class ControlInventarioComponent implements OnInit {

  //@ViewChild('slidingRef', {static: false}) slide: HTMLIonItemSlidingElement;

  selectedRange: { fechaInicio: string | null, fechaFin: string | null } = { fechaInicio: null, fechaFin: null };
  form: UntypedFormGroup;
  itemsControl: ProductoSaldoDto[] = [];
  selectedPageInfo: PageInfo<ProductoSaldoDto> | null = null;
  pageIndex: number = 0;
  pageSize: number = 10;
  sucursales: Sucursal[] = [];
  filtroSeleccionado;
  productoSeleccionado: Producto = null;
  sucursalSeleccionada: Sucursal | null = null;
  sucursalList: Sucursal[];
  sucursalIdList: number [];

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private fb: UntypedFormBuilder,
    private sucursalService: SucursalService,
    private inventarioService: InventarioService,
    private menuActionService: MenuActionService,
    private actionSheetCtrl: ActionSheetController,
    private notificacionService: NotificacionService,
    private modalService: ModalService
  ) {
    this.form = this.fb.group({
      sucursalSelect: [null, Validators.required],
      dateRange: [null],
    });

    this.form.get('sucursalSelect')?.valueChanges.subscribe((sucursalId: number) => {
      this.assignSucursalSeleccionada(sucursalId);
    });
  }

  ngOnInit() {
    this.getSucursales();
    // eliminada suscripción a verificarFilter
  }

  updateValidators(filterValue: string) {
    const dateRangeControl = this.form.get('dateRange');
    
    if (filterValue === 'productosFaltantes') {
      dateRangeControl?.setValidators([Validators.required]);
    } else {
      dateRangeControl?.clearValidators();
    }
    
    dateRangeControl?.updateValueAndValidity();
  }

  resetPagination() {
    this.pageIndex = 0;
    this.selectedPageInfo = null;
    this.itemsControl = [];
  }

  async getSucursales(){
    (await this.sucursalService.onGetAllSucursales())
      .subscribe((res) => {
        this.sucursales = res.filter(s => s.nombre != 'SERVIDOR' && s.nombre != 'COMPRAS');
        this.sucursalIdList = this.sucursales.map(s => s.id);
        this.syncSucursalSeleccionada();
      })

  }

  onBack() {
    this.router.navigate(['inventario']);
  }

  async openCalendar() {
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: 'SELECCIONAR FECHA',
      monthFormat: 'MMMM yyyy',
      format: 'YYYY-MM-DD',
      doneLabel: 'LISTO',
      weekdays: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
      canBackwardsSelected: true,
      closeIcon: true,
      weekStart: 1,
      defaultScrollTo: this.selectedRange?.fechaInicio ? new Date(this.selectedRange.fechaInicio) : new Date(),
      defaultDateRange: this.selectedRange?.fechaInicio && this.selectedRange.fechaFin ? 
                        { from: new Date(this.selectedRange.fechaInicio), to: new Date(this.selectedRange.fechaFin) } : undefined
    };

    const myCalendar = await this.modalCtrl.create({
      component: CalendarModal,
      backdropDismiss: false,
      cssClass: 'myCalendar-class',
      componentProps: { options }
    });

    myCalendar.present();

    const event: any = await myCalendar.onDidDismiss();
    const date = event.data;
    if (date && date.from && date.to) {
      this.selectedRange = {
        fechaInicio: date.from.string.split('T')[0],
        fechaFin: date.to.string.split('T')[0]
      };
      this.form.get('dateRange')?.setValue(this.selectedRange); 
    }
  }

  onSubmit() {
    const filtroTipo = this.filtroSeleccionado;
    const sucursalId = this.form.get('sucursalSelect')?.value;
    
    // Resetear paginación antes de nueva búsqueda
    this.pageIndex = 0;
    
    if (filtroTipo === 'productosFaltantes') {
      if (this.form.valid && this.selectedRange.fechaInicio && this.selectedRange.fechaFin) {
        console.log('Rango de Fechas Seleccionado:', this.selectedRange);
        
        this.loadProductosFaltantes(sucursalId, this.selectedRange.fechaInicio, this.selectedRange.fechaFin);
      } else {
        this.form.markAllAsTouched();
      }
    } else {
      if (sucursalId && filtroTipo) {
        console.log('Formulario Enviado:', this.form.value);
        
        this.loadProductos(sucursalId, filtroTipo);
      } else {
        console.log('Debe seleccionar una sucursal y un tipo de filtro.');
        this.notificacionService.warn('Debe seleccionar una sucursal y un tipo de filtro');
        this.form.markAllAsTouched();
      }
    }
  }

  async loadProductos(sucursalId: number, filtroTipo: string) {
    if (!sucursalId) return;
    
    try {
      let observable;
      
      if (filtroTipo === 'cantidadPositiva') {
        observable = await this.inventarioService.onGetProductosConCantidadPositiva(
          sucursalId, 
          this.productoSeleccionado?.id,
          this.pageIndex, 
          this.pageSize
        );
      } else if (filtroTipo === 'cantidadNegativa') {
        observable = await this.inventarioService.onGetProductosConCantidadNegativa(
          sucursalId, 
          this.productoSeleccionado?.id,
          this.pageIndex, 
          this.pageSize
        );
      }
      
      if (observable) {
        observable.subscribe(response => {
          if (response) {
            this.selectedPageInfo = response;
            this.itemsControl = response.getContent || [];
            console.log('Productos cargados:', this.itemsControl);
          } else {
            this.itemsControl = [];
            this.selectedPageInfo = null;
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  }

  async loadProductosFaltantes(sucursalId: number, fechaInicio: string, fechaFin: string) {
    if (!sucursalId || !fechaInicio || !fechaFin) return;
    
    try {
      const observable = await this.inventarioService.onGetProductosFaltantes(
        sucursalId, 
        this.productoSeleccionado?.id,
        fechaInicio,
        fechaFin,
        this.pageIndex, 
        this.pageSize
      );
      
      if (observable) {
        observable.subscribe(response => {
          if (response) {
            this.selectedPageInfo = response;
            this.itemsControl = response.getContent || [];
          } else {
            this.itemsControl = [];
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar productos faltantes:', error);
      this.itemsControl = [];
    }
  }

  trackById(index: number, item: any): any {
    return item?.id || index;
  }

  getEstadoVisual(item: ProductoSaldoDto): string {
    if (item.saldoTotal > 0) return 'Positivo';
    if (item.saldoTotal < 0) return 'Negativo';
    return 'Sin cantidad';
  }

  getEstadoColor(item: ProductoSaldoDto): string {
    if (item.saldoTotal > 0) return 'success';
    if (item.saldoTotal < 0) return 'danger';
    return 'medium';
  }

  handlePagination(page: number): void {
    this.pageIndex = page - 1;
    
    const sucursalId = this.form.get('sucursalSelect')?.value;
    const filtroTipo = this.filtroSeleccionado;
    
    if (sucursalId && filtroTipo && filtroTipo !== 'productosFaltantes') {
      this.loadProductos(sucursalId, filtroTipo);
    } else if (sucursalId && filtroTipo === 'productosFaltantes' && this.selectedRange.fechaInicio && this.selectedRange.fechaFin) {
      this.loadProductosFaltantes(sucursalId, this.selectedRange.fechaInicio, this.selectedRange.fechaFin);
    }
  }
  
  async openFilterMenu() {
    const actionSheet = await this.actionSheetCtrl.create({
      
      buttons: [
        {
          text: 'CANTIDAD POSITIVA',
          handler: () => this.setFiltro('cantidadPositiva')
        },
        {
          text: 'CANTIDAD NEGATIVA',
          handler: () => this.setFiltro('cantidadNegativa'),
        },
        {
          text: 'PRODUCTOS FALTANTES',
          handler: () => this.setFiltro('productosFaltantes'),
        },
        {
          text: 'CANCELAR',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }
  
  setFiltro(filtro: string) {
    this.filtroSeleccionado = filtro;
    this.onSubmit();
  }

  async openBuscadorProducto() {
    const modal = await this.modalCtrl.create({
      component: SearchProductoDialogComponent,
      componentProps: {
        data: {
          mostrarPrecio: false,
          sucursalId: this.form.get('sucursalSelect').value,
          abrirCamara: false
        }
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.producto) {
      this.productoSeleccionado = data.producto;
    }
  }

  onClearProducto () {
    this.productoSeleccionado = null;
  }

  async onAjuste(item: ProductoSaldoDto, sliding?: HTMLIonItemSlidingElement) {
    const sucursalId = this.form.get('sucursalSelect')?.value;

    if (!sucursalId) {
      this.notificacionService.warn('Debe seleccionar una sucursal antes de ajustar');
      return;
    }

    const sucursal = this.sucursalSeleccionada ?? this.sucursales.find(s => s.id === sucursalId);

    if (!sucursal) {
      this.notificacionService.warn('No se encontró la sucursal seleccionada');
      return;
    }

    const producto: Producto = {
      id: item.productoId,
      descripcion: item.productoDescripcion
    } as Producto;

    const modal = await this.modalCtrl.create({
      component: AjustarStockDialogComponent,
      componentProps: {
        sucursal,
        producto,
        stockActual: item.saldoTotal
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.ajustado) {
      this.onSubmit();
      if (sliding) {
        sliding.close();
      }
    }
  }

  assignSucursalSeleccionada(sucursalId: number): void {
    this.sucursalSeleccionada = this.sucursales.find(s => s.id === sucursalId) || null;
  }

  syncSucursalSeleccionada(): void {
    const sucursalId = this.form.get('sucursalSelect')?.value;
    if (sucursalId) {
      this.assignSucursalSeleccionada(sucursalId);
    }
  }
}
