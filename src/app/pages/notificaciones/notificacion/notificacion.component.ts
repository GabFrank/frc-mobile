import { ChangeDetectionStrategy, Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacionService } from '../notificacion.service';
import { BehaviorSubject, Observable, timer, merge, Subject } from 'rxjs';
import { map, takeUntil, shareReplay } from 'rxjs/operators';
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
  esMencion: boolean;
  comentarioId?: number;
  notificacionOriginalId?: number;
}

@Component({
  selector: 'app-notificacion',
  templateUrl: './notificacion.component.html',
  styleUrls: ['./notificacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionComponent implements OnInit, OnDestroy {
  private readonly notificacionService = inject(NotificacionService);
  private readonly modalCtrl = inject(ModalController);
  private readonly fb = inject(UntypedFormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  public readonly notificaciones$: Observable<NotificacionUI[]> = this.notificacionService.notificaciones$.pipe(
    map(notificaciones => notificaciones.map(n => this.mapearAModeloUI(n)))
  );

  public readonly cargando$ = this.notificacionService.cargando$;
  private readonly disparadorRefresco$ = new BehaviorSubject<void>(undefined);

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
    const polling$ = timer(0, 5000).pipe(map(() => undefined));

    merge(polling$, this.disparadorRefresco$).pipe(
      takeUntil(this.destruir$)
    ).subscribe(() => {
      this.cargarDatos();
    });
  }

  private readonly destruir$ = new Subject<void>();

  ngOnDestroy() {
    this.destruir$.next();
    this.destruir$.complete();
  }

  private cargarDatos() {
    const variables: NotificacionesUsuarioVariables = {
      page: this.indicePagina,
      size: 10,
      fechaInicio: this.seleccionadoRango.fechaInicio || undefined,
      fechaFin: this.seleccionadoRango.fechaFin || undefined,
      leidas: this.formulario.get('leidas')?.value ? false : undefined,
      estadoTablero: this.formulario.get('estadoTablero')?.value
    };

    this.notificacionService['notificacionesUsuarioQuery'].fetch(variables, { fetchPolicy: 'network-only' }).subscribe(response => {
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
        this.cdr.markForCheck();
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
      this.disparadorRefresco$.next();
    }
  }

  alBuscar() {
    this.disparadorRefresco$.next();
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
    this.disparadorRefresco$.next();
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
    const esMencion = n.notificacion.titulo?.toLowerCase().includes('mencionado') || n.notificacion.tipo?.toLowerCase() === 'mencion';
    let comentarioId: number | undefined;
    let notificacionOriginalId: number | undefined;

    if (esMencion && n.notificacion.data) {
      try {
        const dataJson = JSON.parse(n.notificacion.data);
        comentarioId = dataJson.comentarioId;
        notificacionOriginalId = dataJson.notificacionId;
      } catch (e) {
      }
    }

    return {
      id: n.notificacion.id,
      titulo: n.notificacion.titulo,
      descripcion: n.notificacion.mensaje,
      tiempo: this.obtenerHaceCuanto(n.creadoEn),
      icono: estilo.icono,
      color: estilo.color,
      leida: n.leida,
      conteoComentarios: n.notificacion.conteoComentarios || 0,
      esMencion,
      comentarioId,
      notificacionOriginalId
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
      leidas: this.formulario.get('leidas')?.value ? false : undefined,
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
        this.disparadorRefresco$.next();
      }
    });
  }

  irAComentarios(event: Event, notificacion: NotificacionUI) {
    event.stopPropagation();
    this.router.navigate(['notificacion', 'comentarios', notificacion.id]);
  }

  verMencion(event: Event, notificacion: NotificacionUI) {
    event.stopPropagation();
    const idParaNavegar = notificacion.notificacionOriginalId || notificacion.id;
    const queryParams = notificacion.comentarioId ? { comentarioId: notificacion.comentarioId } : {};
    this.router.navigate(['notificacion', 'comentarios', idParaNavegar], { queryParams });
  }

  alCambiarPagina(pagina: number) {
    this.indicePagina = pagina - 1;
    this.disparadorRefresco$.next();
  }
}
