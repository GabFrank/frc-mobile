import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { PdfViewerService } from 'src/app/services/pdf-viewer.service';
import { EstadoDevolucion } from '../devolucion.enums';
import { DevolucionService } from '../devolucion.service';

type Modo = 'COLECTA' | 'RETIRO';

interface HistItem {
  id: number;
  identificador: string;
  proveedor: string;
  origen: string;
  destino: string;
  fecha: string;
  colectadoEn: string;
}

interface Grupo {
  titulo: string;
  subtitulo: string;
  ids: number[];
  items: HistItem[];
}

/**
 * Historial de operaciones de devolución (dos modos):
 *  - COLECTA: devoluciones COLECTADO, agrupadas por depósito destino.
 *  - RETIRO: devoluciones RETIRADO, agrupadas por proveedor.
 * Permite reimprimir el PDF (remito del retiro / etiquetas de la colecta) y
 * revertir un estado hacia atrás (solo transiciones seguras del backend).
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

  private flat: HistItem[] = [];
  grupos: Grupo[] = [];

  private pagina = 0;
  private readonly size = 30;
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
    this.titulo = this.modo === 'COLECTA' ? 'Historial de colectas' : 'Historial de retiros';
    this.cargar(true);
  }

  get esColecta(): boolean {
    return this.modo === 'COLECTA';
  }

  private get estado(): EstadoDevolucion {
    return this.esColecta ? EstadoDevolucion.COLECTADO : EstadoDevolucion.RETIRADO;
  }

  async cargar(reset = true): Promise<void> {
    if (reset) {
      this.pagina = 0;
      this.flat = [];
    }
    this.cargando = true;
    (
      await this.devolucionService.onGetDevolucionesConFiltros({
        estado: this.estado,
        page: this.pagina,
        size: this.size,
      })
    )
      .pipe(first(), untilDestroyed(this))
      .subscribe((page) => {
        this.cargando = false;
        const nuevos: HistItem[] = (page?.getContent || []).map((d: any) => ({
          id: d.id,
          identificador: d.identificador || '#' + d.id,
          proveedor: d.proveedor?.persona?.nombre || 'Sin proveedor',
          origen: d.sucursalOrigen?.nombre || '',
          destino: d.sucursalUbicacion?.nombre || '',
          fecha: d.fecha,
          colectadoEn: d.colectadoEn,
        }));
        this.flat = [...this.flat, ...nuevos];
        this.hayMas = page?.hasNext === true;
        this.agrupar();
      });
  }

  private agrupar() {
    const map = new Map<string, Grupo>();
    for (const it of this.flat) {
      let clave: string;
      let titulo: string;
      let subtitulo: string;
      if (this.esColecta) {
        const dia = (it.colectadoEn || '').substring(0, 10);
        clave = it.destino + '|' + dia;
        titulo = it.destino || 'Depósito';
        subtitulo = `${it.origen} → ${it.destino}`;
      } else {
        clave = it.proveedor;
        titulo = it.proveedor;
        subtitulo = '';
      }
      let g = map.get(clave);
      if (g == null) {
        g = { titulo, subtitulo, ids: [], items: [] };
        map.set(clave, g);
      }
      g.ids.push(it.id);
      g.items.push(it);
    }
    // Subtitulo con conteo/fecha ya que se conoce el grupo completo.
    this.grupos = Array.from(map.values()).map((g) => ({
      ...g,
      subtitulo: this.esColecta
        ? g.subtitulo
        : `${g.items.length} devolución(es)`,
    }));
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

  /** Reimprimir: remito (retiro, por grupo) o etiquetas (colecta, por item). */
  async onReimprimirGrupo(g: Grupo) {
    if (this.esColecta) return; // en colecta se reimprime por item
    (await this.devolucionService.onGetRemito(g.ids))
      .pipe(first(), untilDestroyed(this))
      .subscribe(async (base64) => {
        if (base64) {
          await this.pdfViewerService.openPdfFromBase64(
            base64,
            `comprobante_retiro_${g.ids.join('-')}.pdf`
          );
        }
      });
  }

  async onReimprimirEtiquetas(it: HistItem) {
    (await this.devolucionService.onGetEtiquetasSeparadoPdf(it.id))
      .pipe(first(), untilDestroyed(this))
      .subscribe(async (base64) => {
        if (base64) {
          await this.pdfViewerService.openPdfFromBase64(
            base64,
            `etiquetas_devolucion_${it.id}.pdf`
          );
        }
      });
  }

  onRevertir(it: HistItem) {
    const destinoEstado = this.esColecta ? 'SEPARADO' : 'estado anterior';
    this.dialogoService
      .open(
        'Revertir',
        `¿Revertir ${it.identificador} a ${destinoEstado}? Se deshace la operación.`,
        true
      )
      .then(async (res) => {
        if (res?.role !== 'aceptar') return;
        const usuarioId =
          this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
        this.procesando = true;
        (await this.devolucionService.onRevertirEstado(it.id, usuarioId))
          .pipe(first(), untilDestroyed(this))
          .subscribe(
            (r) => {
              this.procesando = false;
              if (r != null) {
                this.notificacionService.success(`${it.identificador} revertida`);
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
