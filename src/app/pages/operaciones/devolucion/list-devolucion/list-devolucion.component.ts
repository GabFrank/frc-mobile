import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { MainService } from 'src/app/services/main.service';
import { EstadoDevolucion } from '../devolucion.enums';
import { DevolucionService } from '../devolucion.service';

@UntilDestroy()
@Component({
  selector: 'app-list-devolucion',
  templateUrl: './list-devolucion.component.html',
  styleUrls: ['./list-devolucion.component.scss'],
})
export class ListDevolucionComponent implements OnInit {
  EstadoDevolucion = EstadoDevolucion;

  devoluciones: any[] = [];
  sucursales: Sucursal[] = [];

  // Filtros: usuario actual (precargado), sucursal (default todas), estado (default todos).
  sucursalId: number | null = null;
  estado: EstadoDevolucion | null = null;

  private pagina = 0;
  private readonly size = 15;
  hayMas = false;
  cargando = false;

  constructor(
    private router: Router,
    private devolucionService: DevolucionService,
    private sucursalService: SucursalService,
    private mainService: MainService
  ) {}

  async ngOnInit() {
    (await this.sucursalService.onGetAllSucursales())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.sucursales = (res || []).filter(
          (s) => s.nombre != 'SERVIDOR' && s.nombre != 'COMPRAS'
        );
      });
    this.cargar(true);
  }

  private get usuarioId(): number {
    return this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
  }

  async cargar(reset = true): Promise<void> {
    if (reset) {
      this.pagina = 0;
      this.devoluciones = [];
    }
    this.cargando = true;
    (
      await this.devolucionService.onGetDevolucionesConFiltros({
        usuarioId: this.usuarioId,
        sucursalId: this.sucursalId ?? undefined,
        estado: this.estado ?? undefined,
        page: this.pagina,
        size: this.size,
      })
    )
      .pipe(untilDestroyed(this))
      .subscribe((page) => {
        this.cargando = false;
        const nuevos = (page?.getContent || []).map((d: any) => ({
          ...d,
          _color: this.colorEstado(d.estado),
          _proveedor: d.proveedor?.persona?.nombre || null,
        }));
        this.devoluciones = [...this.devoluciones, ...nuevos];
        this.hayMas = page?.hasNext === true;
      });
  }

  onFiltrar(): void {
    this.cargar(true);
  }

  onLoadMore(event: any): void {
    if (this.hayMas) {
      this.pagina++;
      this.cargar(false).then(() => event.target.complete());
    } else {
      event.target.complete();
    }
  }

  onRefresh(event: any): void {
    this.cargar(true).then(() => event.target.complete());
  }

  onNueva(): void {
    this.router.navigate(['/operaciones/devolucion/nueva']);
  }

  onAbrir(d: any): void {
    this.router.navigate(['/operaciones/devolucion/detalle', d.id]);
  }

  onVolver(): void {
    this.router.navigate(['/home']);
  }

  private colorEstado(estado: string): string {
    switch (estado) {
      case EstadoDevolucion.PENDIENTE:
        return 'medium';
      case EstadoDevolucion.SEPARADO:
        return 'warning';
      case EstadoDevolucion.COLECTADO:
        return 'tertiary';
      case EstadoDevolucion.RETIRADO:
        return 'primary';
      case EstadoDevolucion.CANJEADO:
      case EstadoDevolucion.ACREDITADO:
        return 'success';
      case EstadoDevolucion.DESCARTADO:
      case EstadoDevolucion.CANCELADA:
        return 'danger';
      default:
        return 'medium';
    }
  }
}
