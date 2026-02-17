import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { SolicitudPagoService } from '../solicitud-pago.service';
import { SolicitudPagoInput, SolicitudPagoEstado } from '../solicitud-pago.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { Moneda } from 'src/app/pages/operaciones/moneda/moneda.model';
import { FormaPago } from 'src/app/domains/forma-pago/forma-pago.model';
import { NotaRecepcion } from 'src/app/pages/operaciones/pedidos/nota-recepcion/nota-recepcion.model';
import { MonedaService } from 'src/app/pages/operaciones/moneda/moneda.service';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { FormasPagoGQL } from '../graphql/formasPago';
import { ModalService } from 'src/app/services/modal.service';
import {
  GenericListDialogComponent,
  GenericListDialogData,
  TableData
} from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { ProveedoresSearchByPersonaPageGQL } from 'src/app/pages/personas/proveedor/graphql/proveedorSearchByPersonaPage';
import { ProveedorService } from 'src/app/pages/personas/proveedor/proveedor.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { first } from 'rxjs/operators';
import { dateToString } from 'src/app/generic/utils/dateUtils';

@Component({
  selector: 'app-solicitud-pago-create',
  templateUrl: './solicitud-pago-create.component.html',
  styleUrls: ['./solicitud-pago-create.component.scss']
})
export class SolicitudPagoCreateComponent implements OnInit {
  form: FormGroup;
  selectedProveedor: Proveedor;
  monedaList: Moneda[] = [];
  formaPagoList: FormaPago[] = [];
  notasAgregadas: NotaRecepcion[] = [];
  numeroNotaControl = new FormControl();
  montoTotalDisplay = 0;
  proveedorNombreDisplay = '';
  saving = false;
  /** True cuando se llega desde una recepción (proveedor y notas pre-cargados; buscar como ícono). */
  desdeRecepcion = false;

  constructor(
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private solicitudPagoService: SolicitudPagoService,
    private monedaService: MonedaService,
    private genericService: GenericCrudService,
    private formasPagoGQL: FormasPagoGQL,
    private modalService: ModalService,
    private proveedorSearchPage: ProveedoresSearchByPersonaPageGQL,
    private proveedorService: ProveedorService,
    private notificacionService: NotificacionService
  ) {
    this.form = new FormGroup({
      monedaId: new FormControl(null),
      formaPagoId: new FormControl(null),
      fechaPagoPropuesta: new FormControl(null),
      observaciones: new FormControl('')
    });
  }

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParams || {};
    const proveedorId = queryParams.proveedorId != null ? +queryParams.proveedorId : null;
    const recepcionMercaderiaId = queryParams.recepcionMercaderiaId != null ? +queryParams.recepcionMercaderiaId : null;
    this.desdeRecepcion = recepcionMercaderiaId != null;

    if (proveedorId != null) {
      this.selectedProveedor = { id: proveedorId, persona: { nombre: '' } } as Proveedor;
      this.proveedorNombreDisplay = 'Proveedor preseleccionado';
      this.loadProveedorNombre(proveedorId);
    }
    Promise.all([this.loadMonedas(), this.loadFormasPago()]).then(() => {
      if (recepcionMercaderiaId != null) {
        this.loadDatosInicialesPorRecepcion(recepcionMercaderiaId);
      }
    });
  }

  private loadProveedorNombre(proveedorId: number) {
    this.proveedorService.onGetPorId(proveedorId).then(obs => {
      obs.pipe(first()).subscribe(p => {
        if (p?.persona?.nombre != null) {
          this.proveedorNombreDisplay = String(p.persona.nombre).toUpperCase();
        }
      });
    });
  }

  private loadDatosInicialesPorRecepcion(recepcionMercaderiaId: number) {
    this.solicitudPagoService.onDatosInicialesSolicitudPagoPorRecepcion(recepcionMercaderiaId).then(obs => {
      obs.pipe(first()).subscribe(datos => {
        if (!datos) return;
        const monedaId = datos.monedaId != null ? Number(datos.monedaId) : null;
        const formaPagoId = datos.formaPagoId != null ? Number(datos.formaPagoId) : null;
        if (monedaId != null) {
          const moneda = this.monedaList.find(m => Number(m.id) === monedaId);
          this.form.get('monedaId').setValue(moneda != null ? moneda.id : monedaId);
        }
        if (formaPagoId != null) {
          const formaPago = this.formaPagoList.find(f => Number(f.id) === formaPagoId);
          this.form.get('formaPagoId').setValue(formaPago != null ? formaPago.id : formaPagoId);
        }
        if (datos.fechaPagoPropuesta != null) this.form.get('fechaPagoPropuesta').setValue(datos.fechaPagoPropuesta);
        if (datos.notas?.length) {
          this.notasAgregadas = [...datos.notas];
          this.updateMontoTotal();
        }
      });
    });
  }

  private loadMonedas(): Promise<void> {
    return this.monedaService.onGetAll().then(obs => obs.pipe(first()).toPromise()).then((list: Moneda[]) => {
      this.monedaList = list || [];
    });
  }

  private loadFormasPago(): Promise<void> {
    return this.genericService
      .onGet(this.formasPagoGQL, { page: 0, size: 200 }, false)
      .then(obs => obs.pipe(first()).toPromise())
      .then((list: FormaPago[]) => {
        this.formaPagoList = Array.isArray(list) ? list : [];
      });
  }

  onBack() {
    this.location.back();
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
      query: this.proveedorSearchPage,
      paginator: true
    };
    this.modalService.openModal(GenericListDialogComponent, data).then(res => {
      if (res?.data != null) {
        this.selectedProveedor = res.data;
        this.proveedorNombreDisplay = (res.data.persona?.nombre || '').toString().toUpperCase();
      }
    });
  }

  async onAgregarNota() {
    const numero = this.numeroNotaControl.value;
    if (numero == null || numero === '' || !this.selectedProveedor?.id) {
      this.notificacionService.warn('Seleccione proveedor e ingrese número de nota');
      return;
    }
    const num = typeof numero === 'number' ? numero : parseInt(String(numero).trim(), 10);
    if (isNaN(num)) {
      this.notificacionService.warn('Número de nota inválido');
      return;
    }
    try {
      const obs = await this.solicitudPagoService.onNotaRecepcionDisponibleParaPagoPorNumero(
        num,
        this.selectedProveedor.id
      );
      const nota = await obs.pipe(first()).toPromise();
      if (!nota) {
        this.notificacionService.warn('No se encontró nota disponible para pago con ese número y proveedor');
        return;
      }
      const yaAgregada = this.notasAgregadas.some(n => n.id === nota.id);
      if (yaAgregada) {
        this.notificacionService.warn('Esa nota ya está en la lista');
        return;
      }
      this.notasAgregadas.push(nota);
      this.numeroNotaControl.setValue(null);
      this.updateMontoTotal();
    } catch (e) {
      this.notificacionService.danger('Error al buscar la nota');
    }
  }

  onQuitarNota(index: number) {
    this.notasAgregadas.splice(index, 1);
    this.updateMontoTotal();
  }

  private updateMontoTotal() {
    this.montoTotalDisplay = this.notasAgregadas.reduce((sum, n) => sum + (n.valorTotal || n.valor || 0), 0);
  }

  async onGuardar() {
    if (!this.selectedProveedor?.id) {
      this.notificacionService.warn('Seleccione un proveedor');
      return;
    }
    const monedaId = this.form.get('monedaId').value;
    const formaPagoId = this.form.get('formaPagoId').value;
    if (!monedaId || !formaPagoId) {
      this.notificacionService.warn('Seleccione moneda y forma de pago');
      return;
    }
    if (!this.notasAgregadas.length) {
      this.notificacionService.warn('Agregue al menos una nota de recepción');
      return;
    }
    const input: SolicitudPagoInput = {
      proveedorId: this.selectedProveedor.id,
      montoTotal: this.montoTotalDisplay,
      monedaId,
      formaPagoId,
      estado: SolicitudPagoEstado.PENDIENTE,
      notaRecepcionIds: this.notasAgregadas.map(n => n.id),
      observaciones: (this.form.get('observaciones').value || '').toString().trim().toUpperCase() || undefined
    };
    const fp = this.form.get('fechaPagoPropuesta').value;
    if (fp) {
      const dateStr = typeof fp === 'string' ? fp : (fp instanceof Date ? dateToString(fp) : null);
      if (dateStr) {
        input.fechaPagoPropuesta = dateStr.length <= 10 ? dateStr + ' 00:00' : dateStr;
      }
    }
    this.saving = true;
    try {
      const obs = await this.solicitudPagoService.onSaveSolicitudPago(input);
      obs.pipe(first()).subscribe({
        next: () => {
          this.notificacionService.success('Solicitud de pago creada');
          this.router.navigate(['/operaciones/solicitud-pago']);
        },
        error: () => {
          this.saving = false;
        }
      });
    } catch (e) {
      this.saving = false;
      this.notificacionService.danger('Error al guardar');
    }
  }
}
