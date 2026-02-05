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
    private cargandoService: CargandoService
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
        console.log(res2);

        this.selectedPageInfo = res2;
        this.itemList = this.selectedPageInfo.getContent;
      });
    }
  }

  onItemClick(item: PedidoRecepcionProductoDto, i) {
    this.modalService.openModal(
      RecepcionProductoVerificacionDialogComponent,
      {
        recepcionMercaderia: this.selectedRecepcionMercaderia,
        pedidoRecepcionProducto: item,
        presentacion: this.selectedPresentacion || item.producto.presentaciones[0]
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

  onFinalizarRecepcion() {
    this.dialogoService.open('Atención!', '¿Realmente desea finalizar esta recepción?').then(async res => {
      if (res.role === 'aceptar') {
        (await this.recepcionMercaderiaService.onFinalizarRecepcionMercaderia(this.selectedRecepcionMercaderia.id))
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res != null) {
              this.selectedRecepcionMercaderia = res;
            }
          });
      }
    });
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

  onSolicitarPago() {
    this.dialogoService.open('Atención!', '¿Realmente desea solicitar el pago de esta recepción?').then(async res => {
      if (res.role === 'aceptar') {
        // TODO: Adaptar ruta de solicitar pago cuando se migre ese componente
        // Por ahora mantener la ruta original pero con el ID de recepcionMercaderia
        this.router.navigate(['/operaciones/pedidos/solicitar-pago-nota-recepcion/', this.selectedRecepcionMercaderia.id]);
      }
    });
  }
}
