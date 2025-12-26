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

interface NotificationUIModel {
  id: number;
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
  leida: boolean;
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

  public readonly notifications$: Observable<NotificationUIModel[]> = this.notificacionService.notificaciones$.pipe(
    map(notifications => notifications.map(n => this.mapToUIModel(n)))
  );

  public readonly loading$ = this.notificacionService.cargando$;

  public selectedRange: { fechaInicio: string | null, fechaFin: string | null } = { fechaInicio: null, fechaFin: null };
  public form: UntypedFormGroup;
  public pageData: PageInfo<NotificacionDestinatario>;
  public pageIndex: number = 0;

  constructor() {
    this.form = this.fb.group({
      leidas: [null],
      estadoTablero: [null]
    });

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(end.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    this.selectedRange = {
      fechaInicio: start.toISOString(),
      fechaFin: end.toISOString()
    };
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    const variables: NotificacionesUsuarioVariables = {
      page: this.pageIndex,
      size: 10,
      fechaInicio: this.selectedRange.fechaInicio || undefined,
      fechaFin: this.selectedRange.fechaFin || undefined,
      leidas: this.form.get('leidas')?.value,
      estadoTablero: this.form.get('estadoTablero')?.value
    };

    this.notificacionService['notificacionesUsuarioQuery'].fetch(variables).subscribe(response => {
      if (response && response.data && response.data.notificacionesUsuario) {
        const data = response.data.notificacionesUsuario;
        this.pageData = {
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
      const fechaInicio = new Date(date.from.string);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(date.to.string);
      fechaFin.setHours(23, 59, 59, 999);
      this.selectedRange = {
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString()
      };
      this.loadData();
    }
  }

  onBuscar() {
    this.loadData();
  }

  onResetFiltro() {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(end.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    this.selectedRange = {
      fechaInicio: start.toISOString(),
      fechaFin: end.toISOString()
    };
    this.form.reset();
    this.loadData();
  }

  private mapToUIModel(n: NotificacionDestinatario): NotificationUIModel {
    const tipo = n.notificacion.tipo?.toLowerCase() || 'default';
    const mapping: Record<string, { icon: string; color: string }> = {
      'pago': { icon: 'checkmark', color: 'green' },
      'orden': { icon: 'cube', color: 'orange' },
      'descuento': { icon: 'pricetag', color: 'purple' },
      'cancelado': { icon: 'close', color: 'red' },
      'default': { icon: 'notifications', color: 'orange' }
    };
    const style = mapping[tipo] || mapping['default'];
    return {
      id: n.notificacion.id,
      title: n.notificacion.titulo,
      description: n.notificacion.mensaje,
      time: this.getTimeAgo(n.creadoEn),
      icon: style.icon,
      color: style.color,
      leida: n.leida
    };
  }

  private getTimeAgo(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffInSeconds < 0) return 'Just now';
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 172800) return 'A day ago';
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  trackById(index: number, item: NotificationUIModel): number {
    return item.id;
  }

  doRefresh(event: any) {
    this.pageIndex = 0;
    const variables: NotificacionesUsuarioVariables = {
      page: this.pageIndex,
      size: 10,
      fechaInicio: this.selectedRange.fechaInicio || undefined,
      fechaFin: this.selectedRange.fechaFin || undefined,
      leidas: this.form.get('leidas')?.value,
      estadoTablero: this.form.get('estadoTablero')?.value
    };

    this.notificacionService['notificacionesUsuarioQuery'].fetch(variables).subscribe(response => {
      if (response && response.data && response.data.notificacionesUsuario) {
        const data = response.data.notificacionesUsuario;
        this.pageData = {
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

  markAsRead(notification: NotificationUIModel) {
    if (notification.leida) return;
    this.notificacionService.marcarComoLeida(notification.id).subscribe(success => {
      if (success) {
        this.loadData();
      }
    });
  }

  goToComments(event: Event, notification: NotificationUIModel) {
    event.stopPropagation();
    this.router.navigate(['notificacion', 'comentarios', notification.id]);
  }

  onPageChange(page: number) {
    this.pageIndex = page - 1;
    this.loadData();
  }
}
