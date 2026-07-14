import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { EstadoDevolucion } from '../devolucion.enums';
import { DevolucionService } from '../devolucion.service';

/**
 * Colecta interna: un encargado junta las devoluciones SEPARADAS de UNA sucursal
 * (de cualquier proveedor) y las mueve a un depósito destino (estado COLECTADO).
 * Se exige elegir la sucursal de origen; solo se traen los separados de esa
 * sucursal (no todas juntas, para evitar mezclar colectas de distintos orígenes).
 */
@UntilDestroy()
@Component({
  selector: 'app-colecta-devolucion',
  templateUrl: './colecta-devolucion.component.html',
  styleUrls: ['./colecta-devolucion.component.scss'],
})
export class ColectaDevolucionComponent implements OnInit {
  sucursales: Sucursal[] = [];
  sucursalOrigen: Sucursal;
  sucursalDestino: Sucursal;

  candidatas: any[] = [];
  seleccion = new Set<number>();

  cargando = false;
  procesando = false;

  constructor(
    private _location: Location,
    private devolucionService: DevolucionService,
    private sucursalService: SucursalService,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private mainService: MainService
  ) {}

  async ngOnInit() {
    (await this.sucursalService.onGetAllSucursales())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.sucursales = (res || []).filter(
          (s) => s.nombre != 'SERVIDOR' && s.nombre != 'COMPRAS'
        );
        // Preseleccionar la sucursal del encargado como origen.
        const actualId = this.mainService.sucursalActual?.id;
        const actual = this.sucursales.find((s) => s.id === actualId);
        if (actual) {
          this.sucursalOrigen = actual;
          this.cargarCandidatas();
        }
      });
  }

  compareSucursal = (a: Sucursal, b: Sucursal): boolean => a?.id === b?.id;

  onOrigenChange(ev: any) {
    this.sucursalOrigen = this.sucursales.find((s) => s.id === ev?.detail?.value?.id) ?? ev?.detail?.value;
    this.seleccion.clear();
    this.cargarCandidatas();
  }

  onDestinoChange(ev: any) {
    this.sucursalDestino = this.sucursales.find((s) => s.id === ev?.detail?.value?.id) ?? ev?.detail?.value;
  }

  async cargarCandidatas() {
    if (this.sucursalOrigen == null) return;
    this.cargando = true;
    this.candidatas = [];
    (
      await this.devolucionService.onGetDevolucionesConFiltros({
        sucursalId: this.sucursalOrigen.id,
        estado: EstadoDevolucion.SEPARADO,
        page: 0,
        size: 200,
      })
    )
      .pipe(first(), untilDestroyed(this))
      .subscribe((page) => {
        this.cargando = false;
        // Solo las CON proveedor pueden colectarse (las sin proveedor se descartan).
        this.candidatas = (page?.getContent || [])
          .filter((d: any) => d.proveedor != null)
          .map((d: any) => ({ ...d, _proveedor: d.proveedor?.persona?.nombre || null }));
      });
  }

  toggle(id: number) {
    if (this.seleccion.has(id)) this.seleccion.delete(id);
    else this.seleccion.add(id);
  }

  get todasSeleccionadas(): boolean {
    return this.candidatas.length > 0 && this.seleccion.size === this.candidatas.length;
  }

  toggleTodas() {
    if (this.todasSeleccionadas) {
      this.seleccion.clear();
    } else {
      this.candidatas.forEach((d) => this.seleccion.add(d.id));
    }
  }

  onColectar() {
    if (this.sucursalDestino == null) {
      this.notificacionService.warn('Seleccione el depósito destino');
      return;
    }
    if (this.sucursalDestino.id === this.sucursalOrigen?.id) {
      this.notificacionService.warn('El destino debe ser distinto al origen');
      return;
    }
    if (this.seleccion.size === 0) {
      this.notificacionService.warn('Seleccione al menos una devolución');
      return;
    }
    this.dialogoService
      .open(
        'Colectar',
        `¿Enviar ${this.seleccion.size} devolución(es) a ${this.sucursalDestino.nombre}?`,
        true
      )
      .then(async (res) => {
        if (res?.role !== 'aceptar') return;
        const ids = Array.from(this.seleccion);
        const usuarioId =
          this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
        this.procesando = true;
        (await this.devolucionService.onColectarEnBloque(ids, this.sucursalDestino.id, usuarioId))
          .pipe(first(), untilDestroyed(this))
          .subscribe(
            (r) => {
              this.procesando = false;
              const okCount = (r?.resultados || []).filter((x) => x.ok).length;
              const fail = (r?.resultados || []).filter((x) => !x.ok);
              if (fail.length === 0) {
                this.notificacionService.success(`${okCount} colectada(s)`);
              } else {
                this.notificacionService.warn(
                  `${okCount} ok, ${fail.length} con error`
                );
              }
              this.seleccion.clear();
              this.cargarCandidatas();
            },
            () => {
              this.procesando = false;
            }
          );
      });
  }

  onVolver() {
    this._location.back();
  }
}
