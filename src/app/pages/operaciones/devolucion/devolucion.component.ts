import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { Codigo } from 'src/app/domains/productos/codigo.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { CodigoService } from 'src/app/pages/codigo/codigo.service';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { ProveedorService } from 'src/app/pages/personas/proveedor/proveedor.service';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { ModalService, ModalSize } from 'src/app/services/modal.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { DevolucionItemDialogComponent, DevolucionItemDialogData } from './devolucion-item-dialog/devolucion-item-dialog.component';
import { EstadoDevolucion, TipoDevolucion } from './devolucion.enums';
import { Devolucion, DevolucionInput, DevolucionItemDraft, DevolucionItemInput, MotivoAveria } from './devolucion.model';
import { DevolucionService } from './devolucion.service';

@UntilDestroy()
@Component({
  selector: 'app-devolucion',
  templateUrl: './devolucion.component.html',
  styleUrls: ['./devolucion.component.scss'],
})
export class DevolucionComponent implements OnInit {
  TipoDevolucion = TipoDevolucion;

  tipo: TipoDevolucion = TipoDevolucion.SIN_PROVEEDOR;
  motivo: string;
  observacion: string;

  proveedorTexto: string;
  proveedoresList: Proveedor[] = [];
  selectedProveedor: Proveedor;
  buscandoProveedor = false;

  motivosAveria: MotivoAveria[] = [];
  items: DevolucionItemDraft[] = [];

  guardando = false;

  constructor(
    private _location: Location,
    private devolucionService: DevolucionService,
    private proveedorService: ProveedorService,
    private codigoService: CodigoService,
    private barcodeScanner: BarcodeScannerService,
    private modalService: ModalService,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private mainService: MainService
  ) {}

  ngOnInit() {
    this.cargarMotivosAveria();
  }

  async cargarMotivosAveria() {
    (await this.devolucionService.onGetMotivosAveriaActivos())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.motivosAveria = res.filter((m) => m.activo);
        }
      });
  }

  onTipoChange(ev: any) {
    this.tipo = ev?.detail?.value as TipoDevolucion;
    if (this.tipo === TipoDevolucion.SIN_PROVEEDOR) {
      this.selectedProveedor = null;
      this.proveedoresList = [];
      this.proveedorTexto = null;
    }
  }

  async onBuscarProveedor() {
    const texto = this.proveedorTexto?.trim();
    if (!texto) {
      this.notificacionService.warn('Ingrese un nombre o documento');
      return;
    }
    this.buscandoProveedor = true;
    (await this.proveedorService.onSearch(texto))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.buscandoProveedor = false;
        this.proveedoresList = res || [];
        if (this.proveedoresList.length === 0) {
          this.notificacionService.warn('Proveedor no encontrado');
        }
      });
  }

  onSelectProveedor(proveedor: Proveedor) {
    this.selectedProveedor = proveedor;
    this.proveedoresList = [];
  }

  onQuitarProveedor() {
    this.selectedProveedor = null;
  }

  onEscanear() {
    this.barcodeScanner.scan().subscribe((res) => {
      if (!res.cancelled && res.text != null && res.text !== '') {
        this.onBuscarProductoPorCodigo(res.text);
      }
    });
  }

  async onBuscarProductoPorCodigo(codigoBarra: string) {
    (await this.codigoService.onGetCodigoPorCodigo(codigoBarra))
      .pipe(untilDestroyed(this))
      .subscribe((codigos: Codigo[]) => {
        if (codigos && codigos.length > 0) {
          const codigo = codigos[0];
          const presentacion = codigo.presentacion;
          const producto = presentacion?.producto;
          if (producto == null) {
            this.notificacionService.warn('Producto no encontrado');
            return;
          }
          this.abrirDialogoItem(producto, presentacion);
        } else {
          this.notificacionService.warn('Producto no encontrado');
        }
      });
  }

  abrirDialogoItem(producto: Producto, presentacion: Presentacion) {
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
      .openModal(DevolucionItemDialogComponent, data, ModalSize.MEDIUM)
      .then((res) => {
        const draft: DevolucionItemDraft = res?.data;
        if (draft != null) {
          this.items.push(draft);
          this.notificacionService.success('Item agregado');
        }
      });
  }

  onEliminarItem(index: number) {
    this.dialogoService
      .open('Atención', '¿Desea quitar este item de la devolución?', true)
      .then((res) => {
        if (res.role === 'aceptar') {
          this.items.splice(index, 1);
        }
      });
  }

  private buildInput(): DevolucionInput | null {
    if (this.tipo === TipoDevolucion.CON_PROVEEDOR && this.selectedProveedor == null) {
      this.notificacionService.warn('Seleccione un proveedor');
      return null;
    }
    if (this.items.length === 0) {
      this.notificacionService.warn('Agregue al menos un producto');
      return null;
    }

    const usuarioId = this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
    const sucursalOrigenId = this.mainService.sucursalActual?.id;

    const itemsInput: DevolucionItemInput[] = this.items.map((it) => ({
      id: null,
      devolucionId: null,
      productoId: it.producto?.id,
      presentacionId: it.presentacion?.id,
      motivoAveriaId: it.motivoAveria?.id,
      cantidad: it.cantidad,
      motivo: it.motivo || null,
      lote: it.lote || null,
      vencimiento: it.vencimiento || null,
    }));

    return {
      id: null,
      tipo: this.tipo,
      proveedorId: this.selectedProveedor?.id ?? null,
      sucursalOrigenId,
      fecha: dateToString(new Date()),
      motivo: this.motivo ? this.motivo.toUpperCase() : null,
      estado: EstadoDevolucion.PENDIENTE,
      observacion: this.observacion ? this.observacion.toUpperCase() : null,
      usuarioId,
      items: itemsInput,
    };
  }

  async onGuardar(pasarASeparado = false) {
    const input = this.buildInput();
    if (input == null) return;

    this.guardando = true;
    (await this.devolucionService.onSaveDevolucion(input))
      .pipe(first(), untilDestroyed(this))
      .subscribe(
        async (res: Devolucion) => {
          this.guardando = false;
          if (res != null) {
            if (pasarASeparado) {
              await this.avanzarASeparado(res);
            } else {
              this.notificacionService.success('Devolución creada');
              this.limpiar();
            }
          }
        },
        () => {
          this.guardando = false;
        }
      );
  }

  private async avanzarASeparado(devolucion: Devolucion) {
    const usuarioId = this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
    (await this.devolucionService.onAvanzarEstado(devolucion.id, EstadoDevolucion.SEPARADO, usuarioId))
      .pipe(first(), untilDestroyed(this))
      .subscribe(() => {
        this.notificacionService.success('Devolución creada y separada');
        this.limpiar();
      });
  }

  private limpiar() {
    this.items = [];
    this.motivo = null;
    this.observacion = null;
    this.selectedProveedor = null;
    this.proveedorTexto = null;
    this.proveedoresList = [];
    this.tipo = TipoDevolucion.SIN_PROVEEDOR;
  }

  onBack() {
    this._location.back();
  }
}
