import { Component, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VentaTarjeta } from '../venta-tarjeta.model';
import { VentaTarjetaService } from '../venta-tarjeta.service';
import { CajaService } from '../../caja/caja.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { PdvCaja } from '../../caja/caja.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-venta-tarjeta',
  templateUrl: './list-venta-tarjeta.component.html',
  styleUrls: ['./list-venta-tarjeta.component.scss']
})
export class ListVentaTarjetaComponent implements OnInit, ViewWillEnter {

  list: VentaTarjeta[] = [];
  cajaActual: PdvCaja = null;
  pendientes: number = 0;
  cargando = false;

  constructor(
    private ventaTarjetaService: VentaTarjetaService,
    private cajaService: CajaService,
    private mainService: MainService,
    private notificacionService: NotificacionService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  async ngOnInit() {
    await this.cargarCajaYLista();
  }

  ionViewWillEnter() {
    if (this.cajaActual) {
      const sucId = this.cajaActual.sucursal?.id || this.cajaActual.sucursalId;
      this.cargarLista(Number(this.cajaActual.id), sucId);
    }
  }

  async cargarCajaYLista() {
    this.cargando = true;
    const usuarioId = this.mainService.usuarioActual?.id;
    if (!usuarioId) {
      this.notificacionService.open('No hay usuario autenticado', TipoNotificacion.DANGER, 3);
      this.cargando = false;
      return;
    }

    // Usar caja en caché para evitar el proxy lento hacia las filiales
    if (this.cajaService.selectedCaja?.activo) {
      this.cajaActual = this.cajaService.selectedCaja;
      const sucId = this.cajaActual.sucursal?.id || this.cajaActual.sucursalId;
      this.cargarLista(Number(this.cajaActual.id), sucId);
      return;
    }

    (await this.cajaService.onGetByUsuarioIdAndAbierto(usuarioId))
      .pipe(untilDestroyed(this))
      .subscribe(async (cajas: PdvCaja[]) => {
        if (!cajas || cajas.length === 0) {
          this.notificacionService.open('No tiene una caja abierta', TipoNotificacion.DANGER, 3);
          this.cargando = false;
          return;
        }
        this.cajaActual = cajas[0];
        this.cajaService.selectedCaja = this.cajaActual;
        const sucId = this.cajaActual.sucursal?.id || this.cajaActual.sucursalId;
        this.cargarLista(Number(this.cajaActual.id), sucId);
      });
  }

  cargarLista(cajaId: number, sucId: number) {
    this.ventaTarjetaService.onGetPorCaja(cajaId, sucId)
      .pipe(untilDestroyed(this))
      .subscribe(items => {
        this.list = items;
        this.cargando = false;
      }, () => {
        this.cargando = false;
      });
  }

  async onRefresh(event: any) {
    this.cajaService.selectedCaja = null;
    await this.cargarCajaYLista();
    event.target.complete();
  }

  irAEscanear() {
    this.router.navigate(['scan'], { relativeTo: this.route });
  }

  irARegistrar(item: VentaTarjeta) {
    this.router.navigate(['registro'], {
      relativeTo: this.route,
      state: {
        ventaId: item.venta?.id,
        ventaTarjetaId: item.id,
        cajaId: Number(this.cajaActual.id),
        monto: item.monto,
        sucursalId: item.sucursalId
      }
    });
  }

  esGuaranies(item: VentaTarjeta): boolean {
    const simbolo = item.terminalPos?.moneda?.simbolo;
    return !simbolo || simbolo === 'Gs.' || simbolo === '₲';
  }

  onFiltrar() {

  }

  onBack() {
    this.location.back();
  }
}
