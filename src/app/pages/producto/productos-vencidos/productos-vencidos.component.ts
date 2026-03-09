import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
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
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { InventarioProductoItem } from '../../inventario/inventario.model';
import { ProductosVencidosGQL } from '../graphql/productosVencidos';
import { PageInfo } from 'src/app/app.component';

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
  private todasSucursalesSeleccionadas: boolean = false;
  private processingIonChange: boolean = false;

  isLoading: boolean = false;
  isLoadingMore: boolean = false;
  hasMorePages: boolean = true;

  private readonly vencimientoColorCache = new Map<string, string>();
  private readonly diasDiferenciaCache = new Map<string, number>();

  private filtersSubject = new BehaviorSubject<ProductosVencidosFilters>({
    page: 0,
    size: 15
  });
  private forceRefresh = false;

  private readonly COLORS = {
    SUCCESS: "#4caf50",
    WARNING: "#ff9800",
    DANGER: "#f44336",
    DEFAULT: "#ffffff"
  };

  constructor(
    private _location: Location,
    private router: Router,
    private fb: UntypedFormBuilder,
    private sucursalService: SucursalService,
    private sectorService: SectorService,
    private zonaService: ZonaService,
    private modalService: ModalService,
    private modalCtrl: ModalController,
    private notificacionService: NotificacionService,
    private productosVencidosGQL: ProductosVencidosGQL,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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
        if (!this.processingIonChange) {
          this.processSucursalChange(sucursalIds);
        }
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
        if (this.forceRefresh) {
          this.forceRefresh = false;
          return false;
        }
        if (prev.page !== curr.page && curr.page > 0) {
          return false;
        }
        const prevCopy = { ...prev, page: 0 };
        const currCopy = { ...curr, page: 0 };
        return JSON.stringify(prevCopy) === JSON.stringify(currCopy);
      }),
      switchMap((filters) => {
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

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    this.selectedRange = {
      fechaInicio: startStr,
      fechaFin: endStr
    };

    this.pageIndex = 0;
    this.pageSize = 15;

    this.updateFilters();

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

  private forcePopoverUpdate(selectedValues: number[]): void {
    const popover = document.querySelector('ion-popover');
    if (!popover) {
      setTimeout(() => this.forcePopoverUpdate(selectedValues), 50);
      return;
    }

    const findAllCheckboxes = (root: Element | ShadowRoot): any[] => {
      const checkboxes: any[] = [];

      const normalCheckboxes = root.querySelectorAll('ion-checkbox');
      checkboxes.push(...Array.from(normalCheckboxes));

      root.querySelectorAll('*').forEach((el: any) => {
        if (el.shadowRoot) {
          checkboxes.push(...findAllCheckboxes(el.shadowRoot));
        }
      });

      return checkboxes;
    };

    const allCheckboxes = findAllCheckboxes(popover);

    const allOptions = popover.querySelectorAll('ion-select-option');

    const valueToOption = new Map<number, Element>();
    allOptions.forEach((option: any) => {
      let value: number | null = null;

      const ngReflectValue = option.getAttribute('ng-reflect-value');
      if (ngReflectValue) {
        const parsed = parseInt(ngReflectValue, 10);
        if (!isNaN(parsed)) value = parsed;
      }

      if (value === null) {
        const valueAttr = option.getAttribute('value');
        if (valueAttr) {
          const parsed = parseInt(valueAttr, 10);
          if (!isNaN(parsed)) value = parsed;
        }
      }

      if (value !== null) {
        valueToOption.set(value, option);
      }
    });

    allCheckboxes.forEach((checkbox: any) => {
      let option = checkbox.closest('ion-select-option');

      if (!option) {
        const optionValue = checkbox.getAttribute('ng-reflect-value') || checkbox.value;
        if (optionValue) {
          const parsed = parseInt(optionValue, 10);
          if (!isNaN(parsed)) {
            option = valueToOption.get(parsed) || null;
          }
        }
      }

      if (option) {
        let value: number | null = null;
        const ngReflectValue = option.getAttribute('ng-reflect-value');
        if (ngReflectValue) {
          const parsed = parseInt(ngReflectValue, 10);
          if (!isNaN(parsed)) value = parsed;
        }

        if (value === null) {
          const valueAttr = option.getAttribute('value');
          if (valueAttr) {
            const parsed = parseInt(valueAttr, 10);
            if (!isNaN(parsed)) value = parsed;
          }
        }

        if (value !== null) {
          const shouldBeChecked = selectedValues.includes(value);

          if (checkbox.checked !== shouldBeChecked) {
            checkbox.checked = shouldBeChecked;

            checkbox.setAttribute('checked', shouldBeChecked ? 'true' : null);

            if (checkbox.__checked !== undefined) {
              checkbox.__checked = shouldBeChecked;
            }
            if (checkbox._checked !== undefined) {
              checkbox._checked = shouldBeChecked;
            }

            if (typeof checkbox.setChecked === 'function') {
              checkbox.setChecked(shouldBeChecked);
            }

            const changeEvent = new CustomEvent('ionChange', {
              detail: { checked: shouldBeChecked, value: value },
              bubbles: true,
              cancelable: true
            });
            checkbox.dispatchEvent(changeEvent);

            checkbox.dispatchEvent(new Event('input', { bubbles: true }));

            if (typeof checkbox.forceUpdate === 'function') {
              checkbox.forceUpdate();
            }
            if (typeof checkbox.updateChecked === 'function') {
              checkbox.updateChecked();
            }
          }
        }
      }
    });

    this.cdr.markForCheck();
    this.cdr.detectChanges();

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 10);
  }

  private updatePopoverCheckboxes(selectedValues: number[]): void {
    const popover = document.querySelector('ion-popover');
    if (!popover) return;

    const findInShadow = (element: any, selector: string): any[] => {
      const results: any[] = [];
      if (element.shadowRoot) {
        const found = element.shadowRoot.querySelectorAll(selector);
        results.push(...Array.from(found));
        element.shadowRoot.querySelectorAll('*').forEach((child: any) => {
          if (child.shadowRoot) {
            results.push(...findInShadow(child, selector));
          }
        });
      }
      return results;
    };

    let options = Array.from(popover.querySelectorAll('ion-select-option'));

    if (popover.shadowRoot) {
      options = options.concat(Array.from(popover.shadowRoot.querySelectorAll('ion-select-option')));
      options = options.concat(findInShadow(popover, 'ion-select-option'));
    }

    options.forEach((option: any) => {
      let value: number | null = null;

      const ngReflectValue = option.getAttribute('ng-reflect-value');
      if (ngReflectValue) {
        const parsed = parseInt(ngReflectValue, 10);
        if (!isNaN(parsed)) {
          value = parsed;
        }
      }

      if (value === null) {
        const valueAttr = option.getAttribute('value');
        if (valueAttr) {
          const parsed = parseInt(valueAttr, 10);
          if (!isNaN(parsed)) {
            value = parsed;
          }
        }
      }

      if (value === null && (option as any).value !== undefined) {
        const optionValue = (option as any).value;
        if (typeof optionValue === 'number') {
          value = optionValue;
        } else if (typeof optionValue === 'string') {
          const parsed = parseInt(optionValue, 10);
          if (!isNaN(parsed)) {
            value = parsed;
          }
        }
      }

      if (value !== null) {
        let checkbox = option.querySelector('ion-checkbox');

        if (!checkbox) {
          checkbox = findInShadow(option, 'ion-checkbox')[0];
        }

        if (checkbox) {
          const shouldBeChecked = selectedValues.includes(value);
          if (checkbox.checked !== shouldBeChecked) {
            checkbox.checked = shouldBeChecked;
            if (checkbox.value !== undefined) {
              checkbox.value = shouldBeChecked;
            }
            const event = new CustomEvent('ionChange', {
              detail: { checked: shouldBeChecked, value: value },
              bubbles: true,
              cancelable: true
            });
            checkbox.dispatchEvent(event);
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    });

    this.cdr.detectChanges();
  }

  onSucursalChange(sucursalIds: number[]): void {
    this.processingIonChange = true;
    try {
      this.processSucursalChange(sucursalIds);
    } finally {
      setTimeout(() => {
        this.processingIonChange = false;
      }, 100);
    }
  }

  private processSucursalChange(sucursalIds: number[]): void {
    const todasLasSucursales = this.sucursalList.map(s => s.id);
    const idsFiltrados = sucursalIds?.filter(id => id !== -1) || [];
    const hasTodas = sucursalIds?.includes(-1);
    const previousValue = this.form.get('sucursalSelect')?.value || [];
    const hadTodas = previousValue.includes(-1);

    if (hadTodas && !hasTodas) {
      this.form.get('sucursalSelect')?.setValue([], { emitEvent: false });
      this.todasSucursalesSeleccionadas = false;

      this.ngZone.run(() => {
        requestAnimationFrame(() => {
          this.forcePopoverUpdate([]);
        });
      });

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

    if (hasTodas && !hadTodas) {
      const todasConTodas = [...todasLasSucursales, -1];
      this.form.get('sucursalSelect')?.setValue(todasConTodas, { emitEvent: false });
      this.todasSucursalesSeleccionadas = true;

      this.ngZone.run(() => {
        requestAnimationFrame(() => {
          this.forcePopoverUpdate(todasConTodas);
        });
      });

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
      return;
    }

    if (idsFiltrados.length === todasLasSucursales.length && todasLasSucursales.every(id => idsFiltrados.includes(id))) {
      const todasConTodas = [...todasLasSucursales, -1];
      this.form.get('sucursalSelect')?.patchValue(todasConTodas, { emitEvent: false });
      this.ngZone.run(() => {
        setTimeout(() => {
          this.updatePopoverCheckboxes(todasConTodas);
        }, 0);
        setTimeout(() => {
          this.updatePopoverCheckboxes(todasConTodas);
        }, 50);
      });
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
      this.todasSucursalesSeleccionadas = true;
      this.updateFilters();
      return;
    }

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
      this.todasSucursalesSeleccionadas = false;
      this.updateFilters();
      return;
    }

    this.selectedSucursales = this.sucursalList.filter(s => idsFiltrados.includes(s.id));
    this.todasSucursalesSeleccionadas = false;

    if (this.selectedSucursales.length === 1) {
      this.loadSectores(this.selectedSucursales[0].id);
    } else {
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
    this.forceRefresh = true;
    this.updateFilters();
  }

  onRetirar() {
    // Verificar que haya una sucursal específica seleccionada (no "TODAS")
    if (this.selectedSucursales.length !== 1) {
      this.notificacionService.open('Debe seleccionar una sucursal específica para retirar productos', TipoNotificacion.WARN, 2);
      return;
    }

    // Verificar que haya productos vencidos para retirar
    if (this.itemsList.length === 0) {
      this.notificacionService.open('No hay productos vencidos para retirar', TipoNotificacion.WARN, 2);
      return;
    }

    const sucursalOrigen = this.selectedSucursales[0];
    
    // Preparar los productos vencidos para pasar a la transferencia
    const productosVencidos = this.itemsList.map(item => ({
      presentacion: item.presentacion,
      cantidad: item.cantidad,
      vencimiento: item.vencimiento,
      inventarioProductoItem: item
    }));
    
    // Navegar a la pantalla de nueva transferencia con la sucursal de origen y productos vencidos
    this.router.navigate(['transferencias', 'nueva'], {
      state: {
        sucursalOrigen: sucursalOrigen,
        productosVencidos: productosVencidos
      }
    });
  }

  onResetFiltro() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

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
    this.todasSucursalesSeleccionadas = false;

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
    let productosVencidos = pageData.getContent || [];
    
    if (this.soloRealmenteVencidos) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      productosVencidos = productosVencidos.filter((item: InventarioProductoItem) => {
        if (!item.vencimiento) return false;
        const fechaVencimiento = new Date(item.vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        return fechaVencimiento <= hoy;
      });
    }
    
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
      const existingIds = new Set(this.itemsList.map(item => item.id));
      const newItems = enriched.filter(item => !existingIds.has(item.id));
      this.itemsList = [...this.itemsList, ...newItems];
    }

    if (this.soloRealmenteVencidos && productosVencidos.length !== pageData.getContent?.length) {
      this.selectedPageInfo = pageData;
      this.hasMorePages = pageData.hasNext || false;
    } else {
      this.selectedPageInfo = pageData;
      this.hasMorePages = pageData.hasNext || false;
    }
  }

  private setEmptyData(): void {
    this.itemsList = [];
    this.selectedPageInfo = null;
  }

  private updateFilters(): void {
    const sucursalIdList = this.selectedSucursales.length > 0
      ? this.selectedSucursales.map(s => s.id)
      : null;
    let endDate = this.selectedRange?.fechaFin || null;
    if (this.soloRealmenteVencidos && this.selectedRange?.fechaInicio) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      endDate = hoy.toISOString().split('T')[0];
    }

    const filters: ProductosVencidosFilters = {
      startDate: this.selectedRange?.fechaInicio || null,
      endDate: endDate,
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

    this.infiniteScrollEvent = event;
    this.pageIndex++;
    this.updateFilters();
  }

  trackById(index: number, item: any): any {
    return item?.id || index;
  }

  onBack() {
    if (this.router.url.includes('/producto/productos-vencidos')) {
      this.router.navigate(['/producto']);
    } else {
      this._location.back();
    }
  }
}
