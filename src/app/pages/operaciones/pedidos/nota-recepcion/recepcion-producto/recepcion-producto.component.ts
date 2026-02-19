import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RecepcionMercaderia, RecepcionMercaderiaEstado } from '../../recepcion-mercaderia/recepcion-mercaderia.model';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RecepcionMercaderiaService } from '../../recepcion-mercaderia/recepcion-mercaderia.service';
import { PageInfo } from 'src/app/app.component';
import { PedidoRecepcionProductoDto, PedidoRecepcionProductoEstado } from '../nota-recepcion-agrupada/pedido-recepcion-producto-dto.model';
import { ModalService, ModalSize } from 'src/app/services/modal.service';
import { RecepcionProductoVerificacionDialogComponent } from '../recepcion-producto-verificacion-dialog/recepcion-producto-verificacion-dialog.component';
import { ActionSheetController } from '@ionic/angular';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { ProductoService } from 'src/app/pages/producto/producto.service';
import { CodigoService } from 'src/app/pages/codigo/codigo.service';
import { Codigo } from 'src/app/domains/productos/codigo.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { ProductoVerificacionDialogComponent } from 'src/app/pages/producto/producto-verificacion-dialog/producto-verificacion-dialog.component';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { DialogoService } from 'src/app/services/dialogo.service';
import { CargandoService } from 'src/app/services/cargando.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { first } from 'rxjs/operators';
import { QrGeneratorComponent } from 'src/app/components/qr-generator/qr-generator.component';
import { PopOverService, PopoverSize } from 'src/app/services/pop-over.service';
import { codificarQr, QrData } from 'src/app/generic/utils/qrUtils';
import { TipoEntidad } from 'src/app/domains/enums/tipo-entidad.enum';
import { MotivoRechazoFisico, MotivoRechazoFisicoLabels } from '../../recepcion-mercaderia/recepcion-mercaderia-item.model';
import { ConstanciaRecepcionPdfDialogComponent } from '../constancia-recepcion-pdf-dialog/constancia-recepcion-pdf-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-producto',
  templateUrl: './recepcion-producto.component.html',
  styleUrls: ['./recepcion-producto.component.scss']
})
export class RecepcionProductoComponent implements OnInit {
  pageIndex = 0;
  pageSize = 10;
  selectedRecepcionMercaderia: RecepcionMercaderia;
  selectedPageInfo: PageInfo<PedidoRecepcionProductoDto>;
  itemList: PedidoRecepcionProductoDto[];
  selectedEstado: PedidoRecepcionProductoEstado = null;
  selectedPresentacion: Presentacion;

  constructor(
    private _location: Location,
    private route: ActivatedRoute,
    private recepcionMercaderiaService: RecepcionMercaderiaService,
    private router: Router,
    private modalService: ModalService,
    private actionSheetController: ActionSheetController,
    private menuActionService: MenuActionService,
    private barcodeScanner: BarcodeScannerService,
    private productoService: ProductoService,
    private codigoService: CodigoService,
    private dialogoService: DialogoService,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private popoverService: PopOverService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((res) => {
      let recepcionMercaderiaId = res.get('id');
      if (recepcionMercaderiaId != null) {
        this.onBuscarRecepcionMercaderia(recepcionMercaderiaId);
      }
    });
  }

  async onBuscarRecepcionMercaderia(id) {
    (
      await this.recepcionMercaderiaService.onGetRecepcionMercaderiaPorId(
        +id
      )
    ).subscribe(async (res) => {
      if (res != null) {
        this.selectedRecepcionMercaderia = new RecepcionMercaderia();
        Object.assign(this.selectedRecepcionMercaderia, res);
        this.selectedRecepcionMercaderia.cantNotas = res.notas?.length || 0;
        this.onGetPedidoItem();
      }
    });
  }

  async onGetPedidoItem() {
    if (this.selectedRecepcionMercaderia) {
      (
        await this.recepcionMercaderiaService.onGetPedidoRecepcionProductoPorRecepcionMercaderia(
          this.selectedRecepcionMercaderia.id,
          this.selectedEstado,
          this.pageIndex,
          this.pageSize
        )
      ).subscribe((res2) => {
        console.log('Items recibidos:', res2);

        this.selectedPageInfo = res2;
        this.itemList = this.selectedPageInfo.getContent;
        
        // Debug: Verificar datos de items para deshacer verificación
        this.itemList.forEach((item, index) => {
          console.log(`Item ${index}:`, {
            producto: item.producto?.descripcion,
            estado: item.estado,
            totalCantidadRecibidaPorUnidad: item.totalCantidadRecibidaPorUnidad,
            totalCantidadRechazadaPorUnidad: item.totalCantidadRechazadaPorUnidad,
            recepcionEstado: this.selectedRecepcionMercaderia?.estado,
            puedeDeshacer: (item.estado === 'RECIBIDO' || item.estado === 'RECIBIDO_PARCIALMENTE') || 
                          (this.selectedRecepcionMercaderia?.estado === 'EN_PROCESO' && 
                           (item.totalCantidadRecibidaPorUnidad > 0 || item.totalCantidadRechazadaPorUnidad > 0))
          });
        });
      });
    }
  }

  onItemClick(item: PedidoRecepcionProductoDto, i) {
    this.modalService.openModal(
      RecepcionProductoVerificacionDialogComponent,
      {
        recepcionMercaderia: this.selectedRecepcionMercaderia,
        pedidoRecepcionProducto: item,
        presentacion:
          item.presentacionInicialSugerida ||
          this.selectedPresentacion ||
          item.producto.presentaciones[0]
      }
    ).then(res => {
      if (res?.data != null) {
        // Recargar la lista para obtener los valores actualizados del backend
        // El backend ahora calcula totalCantidadRechazadaPorUnidad y actualiza el estado correctamente
        this.onGetPedidoItem();
      }
    });
  }

  handlePagination(e) {
    this.pageIndex = e - 1;
    this.onGetPedidoItem();
  }

  onModificarNotas() { }

  onBack() {
    this._location.back();
  }

  async openFilterActionSheet() {
    this.menuActionService.presentActionSheet([
      {
        texto: 'Todos',
        role: null
      },
      {
        texto: 'Pendientes',
        role: PedidoRecepcionProductoEstado.PENDIENTE
      },
      {
        texto: 'Recibidos',
        role: PedidoRecepcionProductoEstado.RECIBIDO
      },
      {
        texto: 'Recibidos Parcialmente',
        role: PedidoRecepcionProductoEstado.RECIBIDO_PARCIALMENTE
      }
    ]).then(res => {
      this.selectedEstado = res?.role as PedidoRecepcionProductoEstado;
      this.onGetPedidoItem();
    });
  }


  applyFilter(filter: string) {
    // Implement your filter logic here
    console.log('Filter applied:', filter);
  }

  onBuscarProducto() {
    // this.barcodeScanner.scan().subscribe(res => {
    //   let codigoBarra = res.text;
    //   if(codigoBarra != null){
    this.onBuscarProductoPorCodigoBarra("7840058000019");
    //   }
    // });
  }
  async onBuscarProductoPorCodigoBarra(codigoBarra: string) {
    // First, get the Codigo object by barcode
    (await this.codigoService.onGetCodigoPorCodigo(codigoBarra)).subscribe((codigos: Codigo[]) => {
      if (codigos && codigos.length > 0) {
        const codigo = codigos[0];
        const presentacion = codigo.presentacion;
        const producto = presentacion.producto;
        this.selectedPresentacion = presentacion;

        this.modalService.openModal(
          ProductoVerificacionDialogComponent,
          {
            producto: producto
          },
          ModalSize.MEDIUM
        ).then(async dialogRes => {
          if (dialogRes?.data) {
            (await this.recepcionMercaderiaService.onGetPedidoRecepcionProductoPorRecepcionMercaderiaAndProducto(
              this.selectedRecepcionMercaderia.id,
              producto.id,
              this.selectedEstado
            )).subscribe((res2) => {
              if (res2 != null) {
                this.itemList = [];
                this.itemList.push(res2);
                this.onItemClick(res2, 0);
              }
            });
          }
        });
      }
    });
  }

  async openVerificacionDialog(producto: Producto) {
    const result = await this.modalService.openModal(
      ProductoVerificacionDialogComponent,
      { data: { producto } }
    );

    return result?.data; // will be true if confirmed, false if cancelled
  }

  async onFinalizarRecepcion() {
    const itemsPendientes = await this.obtenerItemsPendientes();
    if (itemsPendientes.length > 0) {
      const nombresProductos = itemsPendientes
        .map(i => i.producto?.descripcion || 'Producto')
        .slice(0, 5)
        .join(', ');
      const textoAdicional = itemsPendientes.length > 5
        ? ` y ${itemsPendientes.length - 5} más`
        : '';
      const mensaje = `Hay ${itemsPendientes.length} item(s) pendiente(s) que serán marcados como rechazados: ${nombresProductos}${textoAdicional}. ¿Desea continuar?`;
      this.dialogoService.open('Atención', mensaje, true).then(async res => {
        if (res.role === 'aceptar') {
          await this.mostrarDialogoMotivoYFinalizar(itemsPendientes);
        }
      });
    } else {
      this.dialogoService.open('Atención!', '¿Realmente desea finalizar esta recepción?', true).then(async res => {
        if (res.role === 'aceptar') {
          await this.ejecutarFinalizar(null);
        }
      });
    }
  }

  private async obtenerItemsPendientes(): Promise<PedidoRecepcionProductoDto[]> {
    const pageObs = await this.recepcionMercaderiaService.onGetPedidoRecepcionProductoPorRecepcionMercaderia(
      this.selectedRecepcionMercaderia.id,
      null,
      0,
      500
    );
    const page = await pageObs.pipe(first()).toPromise();
    if (!page?.getContent) return [];
    return page.getContent.filter(item => {
      const aRecibir = item.totalCantidadARecibirPorUnidad ?? 0;
      const recibido = item.totalCantidadRecibidaPorUnidad ?? 0;
      const rechazado = item.totalCantidadRechazadaPorUnidad ?? 0;
      return (aRecibir - recibido - rechazado) > 0;
    });
  }

  private async mostrarDialogoMotivoYFinalizar(itemsPendientes: PedidoRecepcionProductoDto[]) {
    const motivoOpciones = Object.values(MotivoRechazoFisico).map(m => ({
      text: MotivoRechazoFisicoLabels[m] || m,
      role: m
    }));
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione el motivo de rechazo para los items pendientes',
      buttons: [
        ...motivoOpciones.map(o => ({ text: o.text, role: o.role })),
        { text: 'Cancelar', role: 'cancel', cssClass: 'cancelar-btn' }
      ],
      mode: 'ios'
    });
    await actionSheet.present();
    const res = await actionSheet.onDidDismiss();
    const role = res?.role as string | undefined;
    if (role && role !== 'cancel' && Object.values(MotivoRechazoFisico).includes(role as MotivoRechazoFisico)) {
      await this.ejecutarFinalizar({ motivoRechazo: role });
    }
  }

  private async ejecutarFinalizar(rechazoPendientes: { motivoRechazo: string } | null) {
    (await this.recepcionMercaderiaService.onFinalizarRecepcionMercaderia(
      this.selectedRecepcionMercaderia.id,
      rechazoPendientes ?? undefined
    ))
      .pipe(untilDestroyed(this))
      .subscribe(
        res => {
          if (res != null) {
            this.selectedRecepcionMercaderia = res;
            this.notificacionService.success('Recepción finalizada correctamente');
          }
        },
        err => this.notificacionService.danger(err?.message || 'Error al finalizar')
      );
  }

  onReabrirRecepcion() {
    this.dialogoService.open('Atención!', '¿Realmente desea reabrir esta recepción?').then(async res => {
      if (res.role === 'aceptar') {
        (await this.recepcionMercaderiaService.onReabrirRecepcionMercaderia(this.selectedRecepcionMercaderia.id))
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res != null) {
              this.selectedRecepcionMercaderia = res;
            }
          });
      }
    });
  }

  onNuevaRecepcion() {
    this.router.navigate(['/operaciones/pedidos/recibir-nota-recepcion/']);
  }

  /**
   * Actualiza la vista después de deshacer verificación.
   * La recepción se mantiene aunque quede vacía, permitiendo agregar más items.
   */
  private actualizarVistaDespuesDeshacer() {
    this.onGetPedidoItem();
    this.onBuscarRecepcionMercaderia(this.selectedRecepcionMercaderia.id);
  }

  onShare() {
    if (!this.selectedRecepcionMercaderia?.id) return;
    const codigo = new QrData();
    codigo.tipoEntidad = TipoEntidad.RECEPCION_MERCADERIA;
    codigo.idCentral = this.selectedRecepcionMercaderia.id;
    codigo.idOrigen = this.selectedRecepcionMercaderia.id;
    codigo.sucursalId = this.selectedRecepcionMercaderia.sucursalRecepcion?.id;
    this.popoverService.open(
      QrGeneratorComponent,
      codificarQr(codigo),
      PopoverSize.XS
    );
  }

  async onGenerarConstancia() {
    if (!this.selectedRecepcionMercaderia?.id) return;
    try {
      const obs = await this.recepcionMercaderiaService.onGenerarConstanciaRecepcionPDF(this.selectedRecepcionMercaderia.id);
      obs.pipe(first(), untilDestroyed(this)).subscribe(
        (res: any) => {
          const data = res?.data ?? res;
          if (data?.pdfBase64) {
            this.modalService.openModal(ConstanciaRecepcionPdfDialogComponent, {
              pdfBase64: data.pdfBase64,
              nombreArchivo: data.nombreArchivo || `constancia-recepcion-${this.selectedRecepcionMercaderia.id}.pdf`
            }, ModalSize.LARGE);
          } else {
            this.notificacionService.danger('No se recibió el PDF');
          }
        },
        (err) => {
          this.notificacionService.danger(err?.message || 'Error al generar constancia');
        }
      );
    } catch (e) {
      this.notificacionService.danger(e?.message || 'Error al generar constancia');
    }
  }

  /** TODO: Se implementará futuramente. Navega a crear solicitud de pago con recepción y proveedor pre-cargados. */
  onSolicitarPago() {
    this.dialogoService.open('Atención!', '¿Realmente desea solicitar el pago de esta recepción?').then(async res => {
      if (res.role === 'aceptar') {
        const recepcionId = this.selectedRecepcionMercaderia?.id ?? null;
        const proveedorId = this.selectedRecepcionMercaderia?.proveedor?.id ?? null;
        this.router.navigate(['/operaciones/solicitud-pago/crear'], {
          queryParams: {
            ...(recepcionId != null && { recepcionMercaderiaId: recepcionId }),
            ...(proveedorId != null && { proveedorId })
          }
        });
      }
    });
  }

  async onDeshacerVerificacion(item: PedidoRecepcionProductoDto, event: Event) {
    event.stopPropagation(); // Evitar que se abra el diálogo de verificación
    
    // Verificar si se puede deshacer la verificación
    const puedeDeshacer = 
      item.estado === PedidoRecepcionProductoEstado.RECIBIDO || 
      item.estado === PedidoRecepcionProductoEstado.RECIBIDO_PARCIALMENTE ||
      (this.selectedRecepcionMercaderia?.estado === RecepcionMercaderiaEstado.EN_PROCESO &&
       (item.totalCantidadRecibidaPorUnidad > 0 || item.totalCantidadRechazadaPorUnidad > 0));

    if (!puedeDeshacer) {
      this.notificacionService.warn('Solo se puede deshacer la verificación de productos que fueron verificados previamente');
      return;
    }

    this.dialogoService.open(
      'Atención!', 
      '¿Realmente desea deshacer la verificación de este producto? Esta acción eliminará todos los items de recepción asociados a este producto.'
    ).then(async res => {
      if (res.role === 'aceptar') {
        const loading = await this.cargandoService.open();
        try {
          // Detectar si hay múltiples notas para este producto
          const notaRecepcionItemsObs = await this.recepcionMercaderiaService
            .onBuscarNotaRecepcionItemsPorProductoYRecepcion(
              this.selectedRecepcionMercaderia.id,
              item.producto.id
            );
          
          const notaRecepcionItems = await notaRecepcionItemsObs
            .pipe(first())
            .toPromise();

          if (notaRecepcionItems && notaRecepcionItems.length > 1) {
            // Múltiples notas: usar deshacerVerificacionPorProducto
            const resultObs = await this.recepcionMercaderiaService.onDeshacerVerificacionPorProducto(
              this.selectedRecepcionMercaderia.id,
              item.producto.id
            );
            
            const result = await resultObs.pipe(first()).toPromise();
            
            if (result === true) {
              this.notificacionService.success('Verificación deshecha correctamente');
              this.actualizarVistaDespuesDeshacer();
            } else {
              this.notificacionService.warn('No se pudo deshacer la verificación');
            }
          } else {
            // Un solo item: usar resetearVerificacion (si está disponible)
            // Por ahora, también usar deshacerVerificacionPorProducto para consistencia
            const resultObs = await this.recepcionMercaderiaService.onDeshacerVerificacionPorProducto(
              this.selectedRecepcionMercaderia.id,
              item.producto.id
            );
            
            const result = await resultObs.pipe(first()).toPromise();
            
            if (result === true) {
              this.notificacionService.success('Verificación deshecha correctamente');
              this.actualizarVistaDespuesDeshacer();
            } else {
              this.notificacionService.warn('No se pudo deshacer la verificación');
            }
          }
        } catch (error) {
          console.error('Error al deshacer verificación:', error);
          this.notificacionService.danger(
            error?.message || 'Error al deshacer la verificación. Verifique que la recepción no haya sido finalizada hace más de 24 horas.'
          );
        } finally {
          this.cargandoService.close(loading);
        }
      }
    });
  }
}
