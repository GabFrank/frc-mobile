import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SolicitudPagoService } from '../solicitud-pago.service';
import { SolicitudPago, SolicitudPagoPage, SolicitudPagoEstado } from '../solicitud-pago.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { ModalService, ModalSize } from 'src/app/services/modal.service';
import {
  GenericListDialogComponent,
  GenericListDialogData,
  TableData
} from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { ProveedoresSearchByPersonaPageGQL } from 'src/app/pages/personas/proveedor/graphql/proveedorSearchByPersonaPage';
import { ProveedorService } from 'src/app/pages/personas/proveedor/proveedor.service';
import { SolicitudPagoPdfDialogComponent } from '../solicitud-pago-pdf-dialog/solicitud-pago-pdf-dialog.component';
import { first } from 'rxjs/operators';
import { CargandoService } from 'src/app/services/cargando.service';
import { NotificacionService } from 'src/app/services/notificacion.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-solicitud-pago-list',
  templateUrl: './solicitud-pago-list.component.html',
  styleUrls: ['./solicitud-pago-list.component.scss']
})
export class SolicitudPagoListComponent implements OnInit {
  page: SolicitudPagoPage;
  list: SolicitudPago[] = [];
  selectedProveedor: Proveedor;
  selectedEstado: string = '';
  filterProveedorNombre = '';
  estadoOpciones: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: SolicitudPagoEstado.PENDIENTE, label: 'Pendiente' },
    { value: SolicitudPagoEstado.PARCIAL, label: 'Parcial' },
    { value: SolicitudPagoEstado.CONCLUIDO, label: 'Concluido' },
    { value: SolicitudPagoEstado.CANCELADO, label: 'Cancelado' }
  ];
  currentPageIndex = 0;
  loading = false;

  constructor(
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private solicitudPagoService: SolicitudPagoService,
    private modalService: ModalService,
    private proveedorSearchPage: ProveedoresSearchByPersonaPageGQL,
    private proveedorService: ProveedorService,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService
  ) {}

  async ngOnInit() {
    const proveedorId = this.route.snapshot.queryParams?.proveedorId;
    if (proveedorId) {
      this.selectedProveedor = { id: +proveedorId, persona: { nombre: '' } } as Proveedor;
      this.filterProveedorNombre = '';
      try {
        const obs = await this.proveedorService.onGetPorId(+proveedorId);
        const p = await obs.pipe(first()).toPromise();
        if (p) {
          this.selectedProveedor = p;
          this.filterProveedorNombre = (p.persona?.nombre != null ? String(p.persona.nombre).toUpperCase() : '');
        }
      } catch {
        // ignore
      }
    }
    this.loadPage(0);
  }

  loadPage(pageIndex: number) {
    this.loading = true;
    const proveedorId = this.selectedProveedor?.id;
    const estado = this.selectedEstado || undefined;
    this.solicitudPagoService
      .onSolicitudesPagoPaginated(pageIndex, PAGE_SIZE, proveedorId, estado)
      .then(obs => obs.pipe(first()).toPromise())
      .then((page: SolicitudPagoPage) => {
        this.page = page;
        const content = page?.getContent || [];
        this.list = content.map(item => ({
          ...item,
          proveedorNombreDisplay: item?.proveedor?.persona?.nombre != null
            ? String(item.proveedor.persona.nombre).toUpperCase()
            : '-',
          estadoLabelDisplay: this.getEstadoLabelFor(item)
        }));
        this.currentPageIndex = pageIndex;
      })
      .catch(() => {})
      .finally(() => (this.loading = false));
  }

  onBack() {
    this.location.back();
  }

  onNuevaSolicitud() {
    const queryParams: any = {};
    if (this.selectedProveedor?.id) {
      queryParams.proveedorId = this.selectedProveedor.id;
    }
    this.router.navigate(['/operaciones/solicitud-pago/crear'], { queryParams });
  }

  onFiltrar() {
    this.loadPage(0);
  }

  onBuscarProveedor() {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id', width: 80, nested: false },
      { id: 'persona', nombre: 'Nombre', width: 200, nested: true, nestedId: 'nombre' }
    ];
    const data: GenericListDialogData = {
      tableData,
      titulo: 'Buscar proveedor',
      search: true,
      texto: this.filterProveedorNombre?.toUpperCase(),
      query: this.proveedorSearchPage,
      paginator: true
    };
    this.modalService.openModal(GenericListDialogComponent, data).then(res => {
      if (res?.data != null) {
        this.selectedProveedor = res.data;
        this.filterProveedorNombre = (res.data.persona?.nombre || '').toString();
        this.loadPage(0);
      }
    });
  }

  onQuitarProveedor() {
    this.selectedProveedor = null;
    this.filterProveedorNombre = '';
    this.loadPage(0);
  }

  async onImprimir(item: SolicitudPago) {
    if (!item?.id) return;
    const loading = await this.cargandoService.open('Generando PDF...', false);
    this.solicitudPagoService
      .onImprimirSolicitudPagoPDF(item.id)
      .then(obs => obs.pipe(first()).toPromise())
      .then((pdfBase64: string) => {
        this.cargandoService.close(loading);
        if (pdfBase64) {
          this.modalService.openModal(SolicitudPagoPdfDialogComponent, {
            pdfBase64,
            nombreArchivo: `solicitud-pago-${item.numeroSolicitud || item.id}.pdf`
          }, ModalSize.LARGE);
        } else {
          this.notificacionService.danger('No se pudo generar el PDF');
        }
      })
      .catch(() => {
        this.cargandoService.close(loading);
        this.notificacionService.danger('Error al generar el PDF');
      });
  }

  private getEstadoLabelFor(item: SolicitudPago): string {
    const e = item?.estado;
    if (!e) return '-';
    const opt = this.estadoOpciones.find(o => o.value === e);
    return opt ? opt.label : e;
  }

  prevPage() {
    if (this.page?.hasPrevious) {
      this.loadPage(this.currentPageIndex - 1);
    }
  }

  nextPage() {
    if (this.page?.hasNext) {
      this.loadPage(this.currentPageIndex + 1);
    }
  }
}
