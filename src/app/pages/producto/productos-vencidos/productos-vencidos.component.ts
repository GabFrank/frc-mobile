import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';

import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { Sector } from 'src/app/domains/sector/sector.model';
import { SectorService } from 'src/app/domains/sector/sector.service';
import { Zona } from 'src/app/domains/zona/zona.model';
import { ZonaService } from 'src/app/domains/zona/zona.service';
import { Producto } from 'src/app/domains/productos/producto.model';
import { SearchProductoDialogComponent } from '../search-producto-dialog/search-producto-dialog.component';
import { ModalService } from 'src/app/services/modal.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { InventarioProductoItem } from '../../inventario/inventario.model';
import { ProductosVencidosGQL } from '../graphql/productosVencidos';
import { PageInfo } from 'src/app/app.component';
import { dateToString } from 'src/app/generic/utils/dateUtils';

export interface ProductosVencidosFilters {
  startDate?: string;
  endDate?: string;
  sucursalIdList?: number[];
  sectorIdList?: number[];
  zonaIdList?: number[];
  productoIdList?: number[];
  soloRealmenteVencidos?: boolean;
  page: number;
  size: number;
}

export type InventarioProductoItemView = InventarioProductoItem & {
  vencimientoColor: string;
  diasVencimientoTexto: string;
  diasVencimientoClase: string;
};

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-productos-vencidos',
  templateUrl: './productos-vencidos.component.html',
  styleUrls: ['./productos-vencidos.component.scss'],
})
export class ProductosVencidosComponent implements OnInit {
  form: UntypedFormGroup;
  itemsList: InventarioProductoItemView[] = [];
  selectedPageInfo: PageInfo<InventarioProductoItem> | null = null;
  pageIndex: number = 0;
  pageSize: number = 15;
  
  sucursalList: Sucursal[] = [];
  sectorList: Sector[] = [];
  zonaList: Zona[] = [];
  
  selectedSucursales: Sucursal[] = [];
  selectedSector: Sector | null = null;
  selectedZona: Zona | null = null;
  selectedProducto: Producto | null = null;
  
  selectedRange: { fechaInicio: string | null, fechaFin: string | null } = { fechaInicio: null, fechaFin: null };
  soloRealmenteVencidos: boolean = false;
  
  isLoading: boolean = false;
  isLoadingMore: boolean = false;
  hasMorePages: boolean = true;
  
  private readonly vencimientoColorCache = new Map<string, string>();
  private readonly diasDiferenciaCache = new Map<string, number>();
  
  private filtersSubject = new BehaviorSubject<ProductosVencidosFilters>({
    page: 0,
    size: 15
  });
  
  private readonly COLORS = {
    SUCCESS: "#4caf50",
    WARNING: "#ff9800",
    DANGER: "#f44336",
    DEFAULT: "#ffffff"
  };

  constructor(
    private _location: Location,
    private fb: UntypedFormBuilder,
    private sucursalService: SucursalService,
    private sectorService: SectorService,
    private zonaService: ZonaService,
    private modalService: ModalService,
    private modalCtrl: ModalController,
    private notificacionService: NotificacionService,
    private productosVencidosGQL: ProductosVencidosGQL
  ) {
    this.form = this.fb.group({
      sucursalSelect: [[]],
      sectorSelect: [null],
      zonaSelect: [null],
      productoInput: ['']
    });
  }

  ngOnInit() {
    this.loadInitialData();
    this.initializeSubscriptions();
    
    this.form.get('sucursalSelect')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((sucursalIds: number[]) => {
        this.onSucursalChange(sucursalIds);
      });
      
    this.form.get('sectorSelect')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((sectorId: number) => {
        this.onSectorChange(sectorId);
      });
  }

  private initializeSubscriptions(): void {
    this.filtersSubject.asObservable().pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => {
        // Si cambió la página, no resetear (es para cargar más)
        if (prev.page !== curr.page && curr.page > 0) {
          return false; // Permitir cargar más
        }
        // Si cambió cualquier otro filtro, resetear
        const prevCopy = { ...prev, page: 0 };
        const currCopy = { ...curr, page: 0 };
        return JSON.stringify(prevCopy) === JSON.stringify(currCopy);
      }),
      switchMap((filters) => {
        // Si es página 0, resetear la lista
        if (filters.page === 0) {
          this.itemsList = [];
          this.hasMorePages = true;
        }
        return this.loadProductosVencidos(filters);
      }),
      untilDestroyed(this)
    ).subscribe();
  }

  private loadInitialData(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    // Formatear fechas sin horas para el rango
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    this.selectedRange = {
      fechaInicio: startStr,
      fechaFin: endStr
    };
    
    this.pageIndex = 0;
    this.pageSize = 15;
    this.loadSucursales();
  }

  async loadSucursales() {
    try {
      (await this.sucursalService.onGetAllSucursales())
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.sucursalList = res.filter(s => s.nombre != 'SERVIDOR' && s.nombre != 'COMPRAS');
        });
    } catch (error) {
      console.error('Error loading sucursales:', error);
    }
  }

  onSucursalChange(sucursalIds: number[]): void {
    // Si se seleccionó "TODAS" (-1), seleccionar todas las sucursales
    if (sucursalIds?.includes(-1)) {
      const todasLasSucursales = this.sucursalList.map(s => s.id);
      // Usar setTimeout para evitar el ciclo infinito de cambios
      setTimeout(() => {
        this.form.get('sucursalSelect')?.setValue(todasLasSucursales, { emitEvent: false });
        this.selectedSucursales = [...this.sucursalList];
        this.selectedSector = null;
        this.selectedZona = null;
        this.sectorList = [];
        this.zonaList = [];
        this.form.get('sectorSelect')?.setValue(null);
        this.form.get('zonaSelect')?.setValue(null);
        this.pageIndex = 0;
        this.itemsList = [];
        this.hasMorePages = true;
        this.updateFilters();
      }, 0);
      return;
    }
    
    // Filtrar el valor especial -1 (TODAS) si existe
    const idsFiltrados = sucursalIds?.filter(id => id !== -1) || [];
    
    if (idsFiltrados.length === 0) {
      this.selectedSucursales = [];
      this.selectedSector = null;
      this.selectedZona = null;
      this.sectorList = [];
      this.zonaList = [];
      this.form.get('sectorSelect')?.setValue(null);
      this.form.get('zonaSelect')?.setValue(null);
      this.pageIndex = 0;
      this.itemsList = [];
      this.hasMorePages = true;
      this.updateFilters();
      return;
    }

    this.selectedSucursales = this.sucursalList.filter(s => idsFiltrados.includes(s.id));
    
    // Si solo hay una sucursal seleccionada, cargar sectores
    if (this.selectedSucursales.length === 1) {
      this.loadSectores(this.selectedSucursales[0].id);
    } else {
      // Si hay múltiples sucursales, limpiar sectores y zonas
      this.selectedSector = null;
      this.selectedZona = null;
      this.sectorList = [];
      this.zonaList = [];
      this.form.get('sectorSelect')?.setValue(null);
      this.form.get('zonaSelect')?.setValue(null);
    }
    
    this.pageIndex = 0;
    this.itemsList = [];
    this.hasMorePages = true;
    this.updateFilters();
  }

  onSeleccionarTodasSucursales(): void {
    // Este método se llama cuando se hace clic en "TODAS"
    // El valor -1 se agregará al array y será manejado en onSucursalChange
  }

  async loadSectores(sucursalId: number) {
    try {
      (await this.sectorService.onGetSectores(sucursalId))
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.sectorList = res?.filter(s => s.activo) || [];
        });
    } catch (error) {
      console.error('Error loading sectores:', error);
      this.sectorList = [];
    }
  }

  onSectorChange(sectorId: number): void {
    this.selectedSector = this.sectorList.find(s => s.id === sectorId) || null;
    this.selectedZona = null;
    this.zonaList = [];
    this.form.get('zonaSelect')?.setValue(null);
    
    if (sectorId && this.selectedSector?.zonaList) {
      this.zonaList = this.selectedSector.zonaList.filter(z => z.activo);
    }
    
    this.pageIndex = 0;
    this.itemsList = [];
    this.hasMorePages = true;
    this.updateFilters();
  }

  onZonaChange(zonaId: number): void {
    this.selectedZona = this.zonaList.find(z => z.id === zonaId) || null;
    this.pageIndex = 0;
    this.itemsList = [];
    this.hasMorePages = true;
    this.updateFilters();
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
      defaultDateRange: this.selectedRange?.fechaInicio && this.selectedRange?.fechaFin ? 
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
      this.pageIndex = 0;
      this.itemsList = [];
      this.hasMorePages = true;
      this.updateFilters();
    }
  }

  async openBuscadorProducto() {
    const sucursalIds = this.form.get('sucursalSelect')?.value || [];
    const sucursalId = sucursalIds.length === 1 ? sucursalIds[0] : null;
    
    const modal = await this.modalCtrl.create({
      component: SearchProductoDialogComponent,
      componentProps: {
        data: {
          mostrarPrecio: false,
          sucursalId: sucursalId,
          abrirCamara: false
        }
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.producto) {
      this.selectedProducto = data.producto;
      this.form.get('productoInput')?.setValue(data.producto.descripcion);
      this.pageIndex = 0;
      this.itemsList = [];
      this.hasMorePages = true;
      this.updateFilters();
    }
  }

  onClearProducto() {
    this.selectedProducto = null;
    this.form.get('productoInput')?.setValue('');
    this.pageIndex = 0;
    this.itemsList = [];
    this.hasMorePages = true;
    this.updateFilters();
  }

  onBuscar() {
    this.pageIndex = 0;
    this.itemsList = [];
    this.hasMorePages = true;
    this.updateFilters();
  }

  onResetFiltro() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    // Formatear fechas sin horas para el rango
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    this.selectedRange = {
      fechaInicio: startStr,
      fechaFin: endStr
    };
    
    this.form.get('sucursalSelect')?.setValue([]);
    this.form.get('sectorSelect')?.setValue(null);
    this.form.get('zonaSelect')?.setValue(null);
    this.form.get('productoInput')?.setValue('');
    
    this.selectedSucursales = [];
    this.selectedSector = null;
    this.selectedZona = null;
    this.selectedProducto = null;
    this.soloRealmenteVencidos = false;
    this.sectorList = [];
    this.zonaList = [];
    
    this.vencimientoColorCache.clear();
    this.diasDiferenciaCache.clear();
    
    this.pageIndex = 0;
    this.itemsList = [];
    this.hasMorePages = true;
    this.updateFilters();
  }

  toggleSoloRealmenteVencidos() {
    this.soloRealmenteVencidos = !this.soloRealmenteVencidos;
    this.pageIndex = 0;
    this.itemsList = [];
    this.hasMorePages = true;
    this.updateFilters();
  }

  private infiniteScrollEvent: any = null;

  private loadProductosVencidos(filters: ProductosVencidosFilters) {
    if (filters.page === 0) {
      this.isLoading = true;
      this.isLoadingMore = false;
    } else {
      this.isLoadingMore = true;
      this.isLoading = false;
    }
    
    return this.productosVencidosGQL.fetch(filters).pipe(
      tap(result => {
        this.handleProductosVencidosResponse(result, filters.page === 0);
        this.isLoading = false;
        this.isLoadingMore = false;
        
        // Completar el evento de infinite scroll si existe
        if (this.infiniteScrollEvent) {
          this.infiniteScrollEvent.target.complete();
          this.infiniteScrollEvent = null;
        }
      })
    );
  }

  private handleProductosVencidosResponse(result: any, isNewSearch: boolean = false): void {
    if (!result?.data?.productosVencidos) {
      console.error('Estructura de respuesta inválida');
      this.setEmptyData();
      return;
    }

    const pageData = result.data.productosVencidos;
    const productosVencidos = pageData.getContent || [];
    const enriched: InventarioProductoItemView[] = productosVencidos.map((item: InventarioProductoItem) => {
      const dias = item?.vencimiento ? this.calculateDiasDiferencia(item.vencimiento) : null;
      const vencimientoColor = this.resolveVencimientoColor(dias);
      const diasVencimientoTexto = this.resolveDiasVencimientoTexto(dias);
      const diasVencimientoClase = this.resolveDiasVencimientoClase(dias);
      return {
        ...item,
        vencimientoColor,
        diasVencimientoTexto,
        diasVencimientoClase,
      } as InventarioProductoItemView;
    });

    if (isNewSearch) {
      this.itemsList = enriched;
    } else {
      // Agregar nuevos items a la lista existente, evitando duplicados
      const existingIds = new Set(this.itemsList.map(item => item.id));
      const newItems = enriched.filter(item => !existingIds.has(item.id));
      this.itemsList = [...this.itemsList, ...newItems];
    }
    
    this.selectedPageInfo = pageData;
    this.hasMorePages = pageData.hasNext || false;
  }

  private setEmptyData(): void {
    this.itemsList = [];
    this.selectedPageInfo = null;
  }

  private updateFilters(): void {
    const sucursalIdList = this.selectedSucursales.length > 0 
      ? this.selectedSucursales.map(s => s.id) 
      : null;
    
    const filters: ProductosVencidosFilters = {
      startDate: this.selectedRange?.fechaInicio || null,
      endDate: this.selectedRange?.fechaFin || null,
      sucursalIdList: sucursalIdList,
      sectorIdList: this.selectedSector ? [this.selectedSector.id] : null,
      zonaIdList: this.selectedZona ? [this.selectedZona.id] : null,
      productoIdList: this.selectedProducto ? [this.selectedProducto.id] : null,
      soloRealmenteVencidos: this.soloRealmenteVencidos,
      page: this.pageIndex,
      size: this.pageSize
    };

    this.filtersSubject.next(filters);
  }

  private resolveVencimientoColor(diasDiferencia: number | null): string {
    if (diasDiferencia == null) return this.COLORS.DEFAULT;
    if (diasDiferencia < 0) return this.COLORS.DANGER;
    if (diasDiferencia <= 7) return this.COLORS.WARNING;
    return this.COLORS.SUCCESS;
  }

  private calculateDiasDiferencia(vencimiento: string | Date): number {
    const cacheKey = typeof vencimiento === 'string' ? vencimiento : vencimiento.toISOString();

    if (this.diasDiferenciaCache.has(cacheKey)) {
      return this.diasDiferenciaCache.get(cacheKey)!;
    }

    const vencimientoDate = new Date(vencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    vencimientoDate.setHours(0, 0, 0, 0);

    const dias = Math.ceil((vencimientoDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    this.diasDiferenciaCache.set(cacheKey, dias);

    return dias;
  }

  private resolveDiasVencimientoTexto(dias: number | null): string {
    if (dias == null) return '-';
    if (dias < 0) return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
    if (dias === 0) return 'Vence hoy';
    return `${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`;
  }

  private resolveDiasVencimientoClase(dias: number | null): string {
    if (dias == null) return '';
    if (dias < 0) return 'dias-vencimiento-cell vencido';
    if (dias <= 7) return 'dias-vencimiento-cell por-vencer';
    return 'dias-vencimiento-cell vigente';
  }

  loadMore(event: any) {
    if (!this.hasMorePages || this.isLoadingMore || this.isLoading) {
      if (event) {
        event.target.complete();
      }
      return;
    }

    // Guardar el evento para completarlo cuando termine la carga
    this.infiniteScrollEvent = event;
    this.pageIndex++;
    this.updateFilters();
  }

  trackById(index: number, item: any): any {
    return item?.id || index;
  }

  onBack() {
    this._location.back();
  }
}
