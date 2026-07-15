import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { PdfViewerService } from 'src/app/services/pdf-viewer.service';
import { DevolucionService } from '../devolucion.service';

type Modo = 'COLECTA' | 'RETIRO';

/**
 * Historial de operaciones (cabeceras reales):
 *  - COLECTA: operaciones ColectaDevolucion (origen -> destino).
 *  - RETIRO: operaciones RetiroDevolucion (por proveedor).
 * Permite reimprimir (remito del retiro / etiquetas por linea), revertir la
 * operacion completa o una linea (transiciones seguras del backend).
 */
@UntilDestroy()
@Component({
  selector: 'app-historial-operaciones',
  templateUrl: './historial-operaciones.component.html',
  styleUrls: ['./historial-operaciones.component.scss'],
})
export class HistorialOperacionesComponent implements OnInit {
  modo: Modo = 'RETIRO';
  titulo = 'Historial';

  operaciones: any[] = [];

  private pagina = 0;
  private readonly size = 20;
  hayMas = false;
  cargando = false;
  procesando = false;

  constructor(
    private route: ActivatedRoute,
    private _location: Location,
    private devolucionService: DevolucionService,
    private pdfViewerService: PdfViewerService,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private mainService: MainService
  ) {}

  ngOnInit() {
    this.modo = (this.route.snapshot.data['modo'] as Modo) || 'RETIRO';
    this.titulo = this.esColecta ? 'Historial de colectas' : 'Historial de retiros';
    this.cargar(true);
  }

  get esColecta(): boolean {
    return this.modo === 'COLECTA';
  }

  private get usuarioId(): number {
    return this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
  }

  async cargar(reset = true): Promise<void> {
    if (reset) {
      this.pagina = 0;
      this.operaciones = [];
    }
    this.cargando = true;
    const obs = this.esColecta
      ? await this.devolucionService.onGetColectas(this.pagina, this.size)
      : await this.devolucionService.onGetRetiros(this.pagina, this.size);
    obs.pipe(first(), untilDestroyed(this)).subscribe((page) => {
      this.cargando = false;
      // Estado en el que deben estar las lineas para poder revertir esta operacion:
      // colecta -> COLECTADO, retiro -> RETIRADO. Si alguna avanzo mas (ej. una
      // colecta cuya devolucion ya fue retirada), no se puede revertir.
      const estadoOp = this.esColecta ? 'COLECTADO' : 'RETIRADO';
      const nuevos = (page?.getContent || []).map((op: any) => {
        const revertida = op.estado === 'REVERTIDO';
        const devs = (op.devoluciones || []).map((d: any) => ({
          ...d,
          _rev: !revertida && d.estado === estadoOp,
        }));
        const revertible = !revertida && devs.length > 0 && devs.every((d: any) => d.estado === estadoOp);
        return {
          ...op,
          devoluciones: devs,
          _titulo: this.esColecta
            ? op.sucursalOrigen?.nombre + ' → ' + op.sucursalDestino?.nombre
            : op.proveedor?.persona?.nombre || 'Proveedor',
          _revertida: revertida,
          _revertible: revertible,
        };
      });
      this.operaciones = [...this.operaciones, ...nuevos];
      this.hayMas = page?.hasNext === true;
    });
  }

  onLoadMore(event: any) {
    if (this.hayMas) {
      this.pagina++;
      this.cargar(false).then(() => event.target.complete());
    } else {
      event.target.complete();
    }
  }

  onRefresh(event: any) {
    this.cargar(true).then(() => event.target.complete());
  }

  /** Reimprimir: remito (retiro) o etiquetas (colecta, por linea). */
  async onReimprimir(op: any) {
    if (this.esColecta) return;
    (await this.devolucionService.onGetRemitoRetiro(op.id))
      .pipe(first(), untilDestroyed(this))
      .subscribe(async (base64) => {
        if (base64) {
          await this.pdfViewerService.openPdfFromBase64(base64, `comprobante_retiro_${op.id}.pdf`);
        }
      });
  }

  async onReimprimirEtiquetas(devolucionId: number) {
    (await this.devolucionService.onGetEtiquetasSeparadoPdf(devolucionId))
      .pipe(first(), untilDestroyed(this))
      .subscribe(async (base64) => {
        if (base64) {
          await this.pdfViewerService.openPdfFromBase64(base64, `etiquetas_devolucion_${devolucionId}.pdf`);
        }
      });
  }

  /** Revertir toda la operacion. */
  onRevertirOperacion(op: any) {
    const que = this.esColecta ? 'la colecta' : 'el retiro';
    this.dialogoService
      .open('Revertir', `¿Revertir ${que} completo? Se deshace toda la operación.`, true)
      .then(async (res) => {
        if (res?.role !== 'aceptar') return;
        this.procesando = true;
        const obs = this.esColecta
          ? await this.devolucionService.onRevertirColecta(op.id, this.usuarioId)
          : await this.devolucionService.onRevertirRetiro(op.id, this.usuarioId);
        obs.pipe(first(), untilDestroyed(this)).subscribe(
          (r) => {
            this.procesando = false;
            if (r != null) {
              this.notificacionService.success('Operación revertida');
              this.cargar(true);
            }
          },
          () => {
            this.procesando = false;
          }
        );
      });
  }

  /** Revertir una linea (una devolucion) de la operacion. */
  onRevertirLinea(devolucion: any) {
    this.dialogoService
      .open('Revertir', `¿Revertir ${devolucion.identificador || '#' + devolucion.id}?`, true)
      .then(async (res) => {
        if (res?.role !== 'aceptar') return;
        this.procesando = true;
        (await this.devolucionService.onRevertirEstado(devolucion.id, this.usuarioId))
          .pipe(first(), untilDestroyed(this))
          .subscribe(
            (r) => {
              this.procesando = false;
              if (r != null) {
                this.notificacionService.success('Devolución revertida');
                this.cargar(true);
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
