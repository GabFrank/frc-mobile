import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacionService } from '../notificacion.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { NotificacionDestinatario, NotificacionesUsuarioVariables } from '../models/notificacion.model';
import { ModalController } from '@ionic/angular';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { PageInfo } from 'src/app/app.component';

interface NotificacionUI {
  id: number;
  titulo: string;
  descripcion: string;
  tiempo: string;
  icono: string;
  color: string;
  leida: boolean;
  conteoComentarios: number;
}

@Component({
  selector: 'app-notificacion',
  templateUrl: './notificacion.component.html',
  styleUrls: ['./notificacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionComponent implements OnInit {
  private readonly notificacionService = inject(NotificacionService);
  private readonly modalCtrl = inject(ModalController);
  private readonly fb = inject(UntypedFormBuilder);
  private readonly router = inject(Router);

  public readonly notificaciones$: Observable<NotificacionUI[]> = this.notificacionService.notificaciones$.pipe(
    map(notificaciones => notificaciones.map(n => this.mapearAModeloUI(n)))
  );

  public readonly cargando$ = this.notificacionService.cargando$;

  public seleccionadoRango: { fechaInicio: string | null, fechaFin: string | null } = { fechaInicio: null, fechaFin: null };
  public formulario: UntypedFormGroup;
  public datosPagina: PageInfo<NotificacionDestinatario>;
  public indicePagina: number = 0;

  constructor() {
    this.formulario = this.fb.group({
      leidas: [null],
      estadoTablero: [null]
    });

    const fin = new Date();
    fin.setHours(23, 59, 59, 999);
    const inicio = new Date();
    inicio.setDate(fin.getDate() - 7);
    inicio.setHours(0, 0, 0, 0);
    this.seleccionadoRango = {
      fechaInicio: inicio.toISOString(),
      fechaFin: fin.toISOString()
    };
  }

  ngOnInit() {
    this.cargarDatos();
  }

  private cargarDatos() {
    const variables: NotificacionesUsuarioVariables = {
      page: this.indicePagina,
      size: 10,
      fechaInicio: this.seleccionadoRango.fechaInicio || undefined,
      fechaFin: this.seleccionadoRango.fechaFin || undefined,
      leidas: this.formulario.get('leidas')?.value,
      estadoTablero: this.formulario.get('estadoTablero')?.value
    };

    this.notificacionService['notificacionesUsuarioQuery'].fetch(variables).subscribe(response => {
      if (response && response.data && response.data.notificacionesUsuario) {
        const data = response.data.notificacionesUsuario;
        this.datosPagina = {
          getTotalPages: data.totalPages,
          getTotalElements: data.totalElements,
          getNumberOfElements: data.content.length,
          isFirst: data.pageNumber === 0,
          isLast: data.pageNumber === data.totalPages - 1,
          hasNext: data.pageNumber < data.totalPages - 1,
          hasPrevious: data.pageNumber > 0,
          getPageable: null,
          getContent: data.content
        };
        this.notificacionService['_notificaciones$'].next(data.content);
      }
    });
  }

  async abrirCalendario() {
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
      defaultScrollTo: this.seleccionadoRango?.fechaInicio ? new Date(this.seleccionadoRango.fechaInicio) : new Date(),
      defaultDateRange: this.seleccionadoRango?.fechaInicio && this.seleccionadoRango?.fechaFin ?
        { from: new Date(this.seleccionadoRango.fechaInicio), to: new Date(this.seleccionadoRango.fechaFin) } : undefined
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
      const fechaInicio = new Date(date.from.string);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(date.to.string);
      fechaFin.setHours(23, 59, 59, 999);
      this.seleccionadoRango = {
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString()
      };
      this.cargarDatos();
    }
  }

  alBuscar() {
    this.cargarDatos();
  }

  alReiniciarFiltro() {
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);
    const inicio = new Date();
    inicio.setDate(fin.getDate() - 7);
    inicio.setHours(0, 0, 0, 0);
    this.seleccionadoRango = {
      fechaInicio: inicio.toISOString(),
      fechaFin: fin.toISOString()
    };
    this.formulario.reset();
    this.cargarDatos();
  }

  private mapearAModeloUI(n: NotificacionDestinatario): NotificacionUI {
    const tipo = n.notificacion.tipo?.toLowerCase() || 'default';
    const mapeo: Record<string, { icono: string; color: string }> = {
      'pago': { icono: 'checkmark', color: 'green' },
      'orden': { icono: 'cube', color: 'orange' },
      'descuento': { icono: 'pricetag', color: 'purple' },
      'cancelado': { icono: 'close', color: 'red' },
      'default': { icono: 'notifications', color: 'orange' }
    };
    const estilo = mapeo[tipo] || mapeo['default'];
    return {
      id: n.notificacion.id,
      titulo: n.notificacion.titulo,
      descripcion: n.notificacion.mensaje,
      tiempo: this.obtenerHaceCuanto(n.creadoEn),
      icono: estilo.icono,
      color: estilo.color,
      leida: n.leida,
      conteoComentarios: n.notificacion.conteoComentarios || 0
    };
  }

  private obtenerHaceCuanto(fecha: Date | string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    const ahora = new Date();
    const difSegundos = Math.floor((ahora.getTime() - d.getTime()) / 1000);
    if (difSegundos < 0) return 'Recién';
    if (difSegundos < 60) return 'Recién';
    if (difSegundos < 3600) return `Hace ${Math.floor(difSegundos / 60)} min`;
    if (difSegundos < 86400) return `Hace ${Math.floor(difSegundos / 3600)} hs`;
    if (difSegundos < 172800) return 'Hace un día';
    return `Hace ${Math.floor(difSegundos / 86400)} días`;
  }

  identificarPorId(index: number, item: NotificacionUI): number {
    return item.id;
  }

  alRefrescar(event: any) {
    this.indicePagina = 0;
    const variables: NotificacionesUsuarioVariables = {
      page: this.indicePagina,
      size: 10,
      fechaInicio: this.seleccionadoRango.fechaInicio || undefined,
      fechaFin: this.seleccionadoRango.fechaFin || undefined,
      leidas: this.formulario.get('leidas')?.value,
      estadoTablero: this.formulario.get('estadoTablero')?.value
    };

    this.notificacionService['notificacionesUsuarioQuery'].fetch(variables).subscribe(response => {
      if (response && response.data && response.data.notificacionesUsuario) {
        const data = response.data.notificacionesUsuario;
        this.datosPagina = {
          getTotalPages: data.totalPages,
          getTotalElements: data.totalElements,
          getNumberOfElements: data.content.length,
          isFirst: data.pageNumber === 0,
          isLast: data.pageNumber === data.totalPages - 1,
          hasNext: data.pageNumber < data.totalPages - 1,
          hasPrevious: data.pageNumber > 0,
          getPageable: null,
          getContent: data.content
        };
        this.notificacionService['_notificaciones$'].next(data.content);
      }
      event.target.complete();
    });
  }

  marcarComoLeida(notificacion: NotificacionUI) {
    if (notificacion.leida) return;
    this.notificacionService.marcarComoLeida(notificacion.id).subscribe(exito => {
      if (exito) {
        this.cargarDatos();
      }
    });
  }

  irAComentarios(event: Event, notificacion: NotificacionUI) {
    event.stopPropagation();
    this.router.navigate(['notificacion', 'comentarios', notificacion.id]);
  }

  alCambiarPagina(pagina: number) {
    this.indicePagina = pagina - 1;
    this.cargarDatos();
  }
}
