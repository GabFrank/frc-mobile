import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { SearchProductoDialogComponent } from 'src/app/pages/producto/search-producto-dialog/search-producto-dialog.component';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { ModalService, ModalSize } from 'src/app/services/modal.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import {
  DevolucionItemDialogComponent,
  DevolucionItemDialogData,
} from '../devolucion-item-dialog/devolucion-item-dialog.component';
import { EstadoDevolucion } from '../devolucion.enums';
import { ImpresionEtiquetaService } from '../impresion-etiqueta.service';
import {
  Devolucion,
  DevolucionItemDraft,
  DevolucionItemInput,
  MotivoAveria,
} from '../devolucion.model';
import { DevolucionService } from '../devolucion.service';

/**
 * Detalle de una devolución existente. Permite retomar una devolución guardada
 * (recuperar acceso tras cerrar la app): ver estado e items y, si sigue en
 * PENDIENTE, agregar/quitar productos y marcarla como separada.
 */
@UntilDestroy()
@Component({
  selector: 'app-detalle-devolucion',
  templateUrl: './detalle-devolucion.component.html',
  styleUrls: ['./detalle-devolucion.component.scss'],
})
export class DetalleDevolucionComponent implements OnInit {
  EstadoDevolucion = EstadoDevolucion;

  devolucion: Devolucion & any;
  motivosAveria: MotivoAveria[] = [];
  cargando = true;
  procesando = false;

  constructor(
    private route: ActivatedRoute,
    private _location: Location,
    private devolucionService: DevolucionService,
    private modalService: ModalService,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private mainService: MainService,
    private impresionEtiquetaService: ImpresionEtiquetaService
  ) {}

  ngOnInit() {
    this.cargarMotivosAveria();
    const id = +this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargar(id);
    } else {
      this.cargando = false;
    }
  }

  async cargarMotivosAveria() {
    (await this.devolucionService.onGetMotivosAveriaActivos())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) this.motivosAveria = res.filter((m) => m.activo);
      });
  }

  async cargar(id: number) {
    this.cargando = true;
    (await this.devolucionService.onGetDevolucionById(id))
      .pipe(first(), untilDestroyed(this))
      .subscribe(
        (res) => {
          this.cargando = false;
          this.devolucion = res;
        },
        () => {
          this.cargando = false;
        }
      );
  }

  get esPendiente(): boolean {
    return this.devolucion?.estado === EstadoDevolucion.PENDIENTE;
  }

  /** Sin proveedor + SEPARADO: puede descartarse (merma) — cierra el flujo. */
  get canDescartar(): boolean {
    return (
      this.devolucion?.estado === EstadoDevolucion.SEPARADO &&
      this.devolucion?.proveedor == null
    );
  }

  get colorEstado(): string {
    switch (this.devolucion?.estado) {
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
      default:
        return 'danger';
    }
  }

  onAgregarProducto() {
    const sucursalId = this.devolucion?.sucursalOrigen?.id;
    this.modalService
      .openModal(
        SearchProductoDialogComponent,
        { data: { mostrarPrecio: false, sucursalId } },
        ModalSize.LARGE
      )
      .then((res) => {
        const sel = res?.data;
        if (sel?.producto && sel?.presentacion) {
          this.abrirDialogoItem(sel.producto, sel.presentacion);
        }
      });
  }

  private abrirDialogoItem(producto: Producto, presentacion: Presentacion) {
    if (this.motivosAveria.length === 0) {
      this.notificacionService.warn('No hay motivos de avería disponibles');
      return;
    }
    const data: DevolucionItemDialogData = {
      producto,
      presentacion,
      motivosAveria: this.motivosAveria,
    };
    this.modalService
      .openModal(DevolucionItemDialogComponent, data, ModalSize.LARGE)
      .then((res) => {
        const draft: DevolucionItemDraft = res?.data;
        if (draft != null) this.persistirItem(draft);
      });
  }

  private async persistirItem(draft: DevolucionItemDraft) {
    const input: DevolucionItemInput = {
      id: null,
      devolucionId: this.devolucion.id,
      productoId: draft.producto?.id,
      presentacionId: draft.presentacion?.id,
      motivoAveriaId: draft.motivoAveria?.id,
      cantidad: draft.cantidad,
      motivo: draft.motivo || null,
      lote: draft.lote || null,
      vencimiento: draft.vencimiento || null,
    };
    this.procesando = true;
    (await this.devolucionService.onSaveDevolucionItem(input))
      .pipe(first(), untilDestroyed(this))
      .subscribe(
        (res) => {
          this.procesando = false;
          if (res != null) {
            this.notificacionService.success('Producto agregado');
            this.cargar(this.devolucion.id);
          }
        },
        () => {
          this.procesando = false;
        }
      );
  }

  onEliminarItem(item: any) {
    this.dialogoService
      .open('Atención', '¿Quitar este producto de la devolución?', true)
      .then(async (res) => {
        if (res.role !== 'aceptar') return;
        this.procesando = true;
        (await this.devolucionService.onDeleteDevolucionItem(item.id))
          .pipe(first(), untilDestroyed(this))
          .subscribe(
            () => {
              this.procesando = false;
              this.cargar(this.devolucion.id);
            },
            () => {
              this.procesando = false;
            }
          );
      });
  }

  onMarcarSeparado() {
    if (!this.devolucion?.items?.length) {
      this.notificacionService.warn('Agregue al menos un producto');
      return;
    }
    this.dialogoService
      .open('Separar', '¿Marcar esta devolución como separada?', true)
      .then(async (res) => {
        if (res.role !== 'aceptar') return;
        const usuarioId =
          this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
        this.procesando = true;
        (
          await this.devolucionService.onAvanzarEstado(
            this.devolucion.id,
            EstadoDevolucion.SEPARADO,
            usuarioId
          )
        )
          .pipe(first(), untilDestroyed(this))
          .subscribe(
            (r) => {
              this.procesando = false;
              if (r != null) {
                this.notificacionService.success('Devolución separada');
                this.cargar(this.devolucion.id);
                this.impresionEtiquetaService.preguntarEImprimir(this.devolucion.id);
              }
            },
            () => {
              this.procesando = false;
            }
          );
      });
  }

  /** Descarta (merma) una devolución sin proveedor ya separada. Cierra el flujo. */
  onDescartar() {
    this.dialogoService
      .open('Descartar', '¿Descartar como merma? Genera el gasto de pérdida.', true)
      .then(async (res) => {
        if (res.role !== 'aceptar') return;
        const usuarioId =
          this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
        this.procesando = true;
        (
          await this.devolucionService.onAvanzarEstado(
            this.devolucion.id,
            EstadoDevolucion.DESCARTADO,
            usuarioId
          )
        )
          .pipe(first(), untilDestroyed(this))
          .subscribe(
            (r) => {
              this.procesando = false;
              if (r != null) {
                this.notificacionService.success('Devolución descartada');
                this.cargar(this.devolucion.id);
              }
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
