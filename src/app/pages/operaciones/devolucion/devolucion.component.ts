import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { ProveedorService } from 'src/app/pages/personas/proveedor/proveedor.service';
import { SearchProductoDialogComponent } from 'src/app/pages/producto/search-producto-dialog/search-producto-dialog.component';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { ModalService, ModalSize } from 'src/app/services/modal.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { DevolucionItemDialogComponent, DevolucionItemDialogData } from './devolucion-item-dialog/devolucion-item-dialog.component';
import { EstadoDevolucion, TipoDevolucion } from './devolucion.enums';
import { ImpresionEtiquetaService } from './impresion-etiqueta.service';
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

  sucursales: Sucursal[] = [];
  sucursalOrigen: Sucursal;

  guardando = false;

  constructor(
    private _location: Location,
    private devolucionService: DevolucionService,
    private proveedorService: ProveedorService,
    private sucursalService: SucursalService,
    private modalService: ModalService,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private mainService: MainService,
    private impresionEtiquetaService: ImpresionEtiquetaService
  ) {}

  ngOnInit() {
    this.cargarMotivosAveria();
    this.cargarSucursales();
  }

  async cargarSucursales() {
    (await this.sucursalService.onGetAllSucursales())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.sucursales = (res || []).filter(
          (s) => s.nombre != 'SERVIDOR' && s.nombre != 'COMPRAS'
        );
        // Preseleccionar la sucursal del usuario logueado.
        const actualId = this.mainService.sucursalActual?.id;
        this.sucursalOrigen =
          this.sucursales.find((s) => s.id === actualId) ?? this.sucursales[0];
      });
  }

  compareSucursal = (a: Sucursal, b: Sucursal): boolean => a?.id === b?.id;

  onSucursalChange(ev: any) {
    const id = ev?.detail?.value?.id;
    this.sucursalOrigen = this.sucursales.find((s) => s.id === id) ?? ev?.detail?.value;
  }

  async cargarMotivosAveria() {
    (await this.devolucionService.onGetMotivosAveriaActivos())
      .pipe(untilDestroyed(this))
      .subscribe(
        (res) => {
          if (res != null) {
            this.motivosAveria = res.filter((m) => m.activo);
          }
        },
        () => {}
      );
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

  /**
   * Agregar producto: abre el buscador (mismo patrón que inventarios/transferencias)
   * que enciende la cámara por defecto y deja buscar a mano si se cancela el scan.
   * Devuelve { producto, presentacion } al elegir.
   */
  onAgregarProducto() {
    if (this.sucursalOrigen == null) {
      this.notificacionService.warn('Seleccione la sucursal de origen');
      return;
    }
    const sucursalId = this.sucursalOrigen?.id;
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
      .openModal(DevolucionItemDialogComponent, data, ModalSize.LARGE)
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
    if (this.sucursalOrigen == null) {
      this.notificacionService.warn('Seleccione la sucursal de origen');
      return null;
    }

    const usuarioId = this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
    const sucursalOrigenId = this.sucursalOrigen?.id;

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
          if (res != null) {
            if (pasarASeparado) {
              // Mantener guardando=true hasta que termine (o falle) el segundo
              // mutation, para no re-habilitar los botones mientras avanza el
              // estado y evitar crear una devolución duplicada por doble tap.
              await this.avanzarASeparado(res);
            } else {
              this.notificacionService.success('Devolución creada');
              this.limpiar();
              this._location.back();
            }
          }
          this.guardando = false;
        },
        () => {
          this.guardando = false;
        }
      );
  }

  private avanzarASeparado(devolucion: Devolucion): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const usuarioId = this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');
      (await this.devolucionService.onAvanzarEstado(devolucion.id, EstadoDevolucion.SEPARADO, usuarioId))
        .pipe(first(), untilDestroyed(this))
        .subscribe(
          async () => {
            this.notificacionService.success('Devolución creada y separada');
            await this.impresionEtiquetaService.preguntarEImprimir(devolucion.id);
            this.limpiar();
            this._location.back();
            resolve();
          },
          () => {
            // La devolución ya quedó creada en PENDIENTE y el servicio ya notificó
            // el error. No recrear: sólo resolvemos para re-habilitar el botón.
            resolve();
          }
        );
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
