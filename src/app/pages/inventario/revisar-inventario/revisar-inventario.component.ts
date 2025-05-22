import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InventarioService } from '../inventario.service';
import { Inventario, InventarioProductoItem } from '../inventario.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { PageInfo } from 'src/app/app.component';

@UntilDestroy()
@Component({
  selector: 'app-revisar-inventario',
  templateUrl: './revisar-inventario.component.html',
  styleUrls: ['./revisar-inventario.component.scss'],
})
export class RevisarInventarioComponent implements OnInit {
  selectedInventario: Inventario;
  itemsParaRevisar: InventarioProductoItem[] = [];
  inventarioId: string;
  pageIndex = 0;
  pageSize = 10;
  selectedPageInfo: PageInfo<InventarioProductoItem>;
  filtroActual: string | null = 'todo';

  constructor(
    private _location: Location,
    private route: ActivatedRoute,
    private inventarioService: InventarioService,
    private notificacionService: NotificacionService,
    private menuActionService: MenuActionService
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(params => {
      this.inventarioId = params.get('id');
      if (this.inventarioId) {
        this.cargarInventario();
      }
    });
  }

  async cargarInventario() {
    (await this.inventarioService.onGetInventario(this.inventarioId))
      .pipe(untilDestroyed(this))
      .subscribe((inventario: Inventario) => {
        if (inventario) {
          this.selectedInventario = inventario;
          this.cargarItemsRevisados();
        } else {
          this.notificacionService.danger(`No se encontró el inventario con ID: ${this.inventarioId}`);
        }
      });
  }

  async cargarItemsRevisados() {
    (await this.inventarioService.onGetInventarioItemsParaRevisar(
      this.inventarioId,
      this.filtroActual,
      this.pageIndex,
      this.pageSize
    ))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        
        if (res != null) {
          this.selectedPageInfo = res;
          
          if (Array.isArray(res.getContent)) {
            this.itemsParaRevisar = [...res.getContent];
          } else if (Array.isArray(res)) {
            this.itemsParaRevisar = [...res];
          } else {
            this.itemsParaRevisar = [];
          }
          
          if (this.itemsParaRevisar.length === 0 && this.filtroActual !== 'todo') {
            this.notificacionService.warn('No se encontraron productos con el criterio seleccionado');
          }
        } else {
          this.itemsParaRevisar = [];
        }
      }, error => {
        this.itemsParaRevisar = [];
        this.notificacionService.danger('Error al cargar los productos para revisar');
      });
  }

  getEstadoVisual(item: InventarioProductoItem): string {
    if (!item) return 'Desconocido';
    
    if (item.verificado === true && item.revisado === false) {
      return 'Cantidad exacta';
    }
    if (item.revisado === true && item.verificado === false) {
      return 'Modificado';
    }
    
    return 'Sin estado';
  }

  onBack(){
    this._location.back();
  }

  openFilterMenu() {
    this.menuActionService.presentActionSheet([
      { texto: 'Todos los productos', role: 'todo' },
      { texto: 'Cantidades exactas primero', role: 'cantidadExacta' },
      { texto: 'Modificados primero', role: 'modificado' }
    ]).then(res => {
      const role = res.role;
      if (role && role !== 'dismiss' && role !== 'backdrop' && role !== this.filtroActual) {
        this.applyFilterAndReload(role);
      }
    });
  }

  applyFilterAndReload(role: string | null) {
    this.filtroActual = role;
    this.pageIndex = 0;
    this.cargarItemsRevisados();
  }

  handlePagination(e: number) {
    this.pageIndex = e - 1;
    this.cargarItemsRevisados();
  }

  trackById(index: number, item: InventarioProductoItem): any {
    return item ? item.id : index;
  }
}
