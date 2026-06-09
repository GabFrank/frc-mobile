import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SolicitudGastosService } from '../../services/solicitud-gastos.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';
import { ModalController, NavController } from '@ionic/angular';
import { MainService } from '../../../../../services/main.service';

interface SolicitudListaItem extends PreGasto {
  estadoBadgeColor: string;
}

@Component({
  selector: 'app-list-solicitud-gastos',
  templateUrl: './list-solicitud-gastos.component.html',
  styleUrls: ['./list-solicitud-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListSolicitudGastosComponent implements OnInit {
  solicitudes: SolicitudListaItem[] = [];
  cargando = false;
  pagina = 0;
  hayMas = false;

  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = new Date().toISOString().split('T')[0];

  constructor(
    private solicitudService: SolicitudGastosService,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router,
    public mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  async cargarSolicitudes(reset = true): Promise<void> {
    if (reset) {
      this.pagina = 0;
      this.solicitudes = [];
    }
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const inicio = `${this.fechaInicio}T00:00:00`;
      const fin = `${this.fechaFin}T23:59:59`;

      const respuesta = await this.solicitudService.getMisSolicitudes(this.pagina, 15, inicio, fin);
      const nuevosItems = (respuesta?.getContent ?? []).map((item) => ({
        ...item,
        estadoBadgeColor: this.resolverBadgeColor(item.estado),
      }));
      this.solicitudes = [...this.solicitudes, ...nuevosItems];
      this.hayMas = respuesta?.hasNext === true;
    } catch (error) {
      console.error('Error al cargar solicitudes', error);
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onRefresh(event: CustomEvent): void {
    this.cargarSolicitudes(true).then(() => {
      (event.target as HTMLIonRefresherElement).complete();
    });
  }

  onLoadMore(event: CustomEvent): void {
    if (this.hayMas) {
      this.pagina++;
      this.cargarSolicitudes(false).then(() => {
        (event.target as HTMLIonInfiniteScrollElement).complete();
      });
    } else {
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }
  }

  onDateChange(): void {
    this.cargarSolicitudes(true);
  }

  onBack(): void {
    this.navCtrl.back();
  }

  async openCalendar(): Promise<void> {
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: 'SELECCIONAR FECHA',
      monthFormat: 'MMMM yyyy',
      format: 'YYYY-MM-DD',
      doneLabel: 'LISTO',
      weekdays: ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'],
      canBackwardsSelected: true,
      closeIcon: true,
      weekStart: 1,
      defaultScrollTo: this.fechaInicio ? new Date(this.fechaInicio) : new Date(),
      defaultDateRange: this.fechaInicio && this.fechaFin
        ? { from: new Date(this.fechaInicio), to: new Date(this.fechaFin) }
        : undefined,
    };

    const myCalendar = await this.modalCtrl.create({
      component: CalendarModal,
      backdropDismiss: false,
      cssClass: 'myCalendar-class',
      componentProps: { options },
    });

    await myCalendar.present();

    const event = await myCalendar.onDidDismiss();
    const date = event.data;
    if (date?.from && date?.to) {
      this.fechaInicio = date.from.string.split('T')[0];
      this.fechaFin = date.to.string.split('T')[0];
      this.cargarSolicitudes(true);
    }
  }

  onShareWhatsApp(item: PreGasto): void {
    const monto = item.montoSolicitado ? item.montoSolicitado.toLocaleString('es-PY') : '0';
    const simbolo = item.moneda?.simbolo || 'Gs.';
    const nombreUsuario = this.mainService.usuarioActual?.persona?.nombre
      || this.mainService.usuarioActual?.nickname
      || 'Usuario';
    const text = `Solicitud de Gasto N°${item.id}\nSolicitante: ${nombreUsuario}\nDescripción: ${item.descripcion || 'Sin descripción'}\nMonto: ${simbolo} ${monto}\nEstado: ${item.estadoEtiqueta || item.estado}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  onVerDetalle(item: PreGasto): void {
    const sucursalId = item.sucursalId || item.sucursalCaja?.id || 0;
    this.router.navigate([
      '/operaciones/solicitud-gastos/detalle',
      item.id,
      sucursalId,
    ]);
  }

  private resolverBadgeColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'AUTORIZADO': return 'success';
      case 'RECHAZADO': return 'danger';
      case 'COMPLETADO': return 'secondary';
      case 'TRAMITE': return 'primary';
      default: return 'medium';
    }
  }
}
