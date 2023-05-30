import { ImagePopoverComponent } from './../../../components/image-popover/image-popover.component';
import { ModificarItemDialogComponent } from './../modificar-item-dialog/modificar-item-dialog.component';
import { PopOverService, PopoverSize } from './../../../services/pop-over.service';
import { ActionMenuData } from './../../../services/menu-action.service';
import { MainService } from 'src/app/services/main.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ActivatedRoute } from '@angular/router';
import { TransferenciaService } from './../transferencia.service';
import { EtapaTransferencia, Transferencia, TransferenciaEstado, TransferenciaItem, TransferenciaItemMotivoModificacion, TransferenciaItemMotivoRechazo } from './../transferencia.model';
import { Component, OnInit, isDevMode } from '@angular/core';
import { Location } from '@angular/common';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { updateDataSourceWithId } from 'src/app/generic/utils/numbersUtils';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { CargandoService } from 'src/app/services/cargando.service';
import { Platform } from '@ionic/angular';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { TipoEntidad } from 'src/app/domains/enums/tipo-entidad.enum';
import { CodigoService } from '../../codigo/codigo.service';
import { rejects } from 'assert';
import { codificarQr, QrData } from 'src/app/generic/utils/qrUtils';
import { QrGeneratorComponent } from 'src/app/components/qr-generator/qr-generator.component';
import { DialogoService } from 'src/app/services/dialogo.service';
import { TransferListItem } from 'worker_threads';
import { UntypedFormControl, Validators } from '@angular/forms';
import { comparatorLike } from 'src/app/generic/utils/string-utils';


@UntilDestroy()
@Component({
  selector: 'app-info-transferencia',
  templateUrl: './info-transferencia.component.html',
  styleUrls: ['./info-transferencia.component.scss'],
  providers: [BarcodeScanner]
})
export class InfoTransferenciaComponent implements OnInit {

  selectedTransferencia: Transferencia;
  selectedResponsable: Usuario;

  isWeb = false;
  page = 1;
  size = 20;
  isLastPage = false;


  isPreTransferenciaCreacion = false;
  isPreTransferenciaOrigen = false;
  isPreparacionMercaderia = false;
  isPreparacionMercaderiaConcluida = false;
  isTransporteVerificacion = false;
  isTransporteEnCamino = false;
  isTransporteEnDestino = false;
  isRecepcionEnVerificacion = false;
  isRecepcionConcluida = false;
  isAllConfirmedPreparacion = false;
  isAllConfirmedTransporte = false;
  isAllConfirmedRecepcion = false;
  actionMenuOptionsList: ActionMenuData[];
  puedeEditar = false;
  filteredTransferenciaItemList: TransferenciaItem[]
  buscarControl = new UntypedFormControl(null, [Validators.required, Validators.minLength(1)])

  constructor(
    private transferenciaService: TransferenciaService,
    private route: ActivatedRoute,
    private _location: Location,
    private mainService: MainService,
    private menuActionService: MenuActionService,
    private popoverService: PopOverService,
    private barcodeScanner: BarcodeScanner,
    private cargandoService: CargandoService,
    private plf: Platform,
    private notificacionService: NotificacionService,
    private codigoService: CodigoService,
    private dialogoService: DialogoService

  ) {
    this.isWeb = this.plf.platforms().includes('mobileweb')

  }

  ngOnInit() {
    //innicializar arrays
    this.actionMenuOptionsList = []

    setTimeout(() => {
      this.route.paramMap.subscribe(res => {
        console.log(res);
        this.buscarTransferencia(res.get('id'))
      });
    }, 1000);

    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      setTimeout(() => {
        this.onFilterTransferenciaItem()
      }, 100);
    })

  }

  onBuscarFocus() {
    this.page = 1;
  }

  async buscarTransferencia(id) {
    if (id != null) {
      (await this.transferenciaService.onGetTransferencia(id))
        .pipe(untilDestroyed(this))
        .subscribe(async res => {
          if (res != null) {
            this.selectedTransferencia = res;
            this.selectedTransferencia.transferenciaItemList = [];
            this.verificarEtapa()
          }
        })
    }
  }

  async getTransferenciaItemList(): Promise<Boolean> {
    return new Promise(async (resolve, rejects) => {
      (await this.transferenciaService.onGetTransferenciaItensPorTransferenciaId(this.selectedTransferencia.id)).pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.selectedTransferencia.transferenciaItemList = res;
            resolve(true)
          } else {
            rejects()
          }
        })
    })
  }

  onFilterTransferenciaItem() {
    let end = 5;
    let auxList = []
    end = this.page * 5;

    if (this.buscarControl.valid) {
      this.filteredTransferenciaItemList = this.selectedTransferencia.transferenciaItemList.filter(ti => {
        return comparatorLike(this.buscarControl.value?.toUpperCase(), ti.presentacionPreTransferencia.producto.descripcion) || comparatorLike(this.buscarControl.value?.toUpperCase(), ti.presentacionPreTransferencia.producto?.codigoPrincipal);
      }).slice(0, end);
    } else {
      this.filteredTransferenciaItemList = this.selectedTransferencia.transferenciaItemList.slice(0, end);
    }
  }

  onBack() {
    this._location.back()
  }

  async verificarEtapa() {
    console.log(this.selectedTransferencia);
    this.setAllEtapasFalse()
    let isItemLoaded = await this.getTransferenciaItemList();
    if (isItemLoaded) {
      this.onVerificarConfirmados()
      this.onFilterTransferenciaItem()
      console.log(this.selectedTransferencia);
      switch (this.selectedTransferencia?.etapa) {
        case EtapaTransferencia.PRE_TRANSFERENCIA_CREACION:
          this.isPreTransferenciaCreacion = true;
          this.selectedResponsable = this.selectedTransferencia?.usuarioPreTransferencia;
          break;
        case EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN:
          this.isPreTransferenciaOrigen = true;
          this.selectedResponsable = this.selectedTransferencia?.usuarioPreTransferencia;
          break;
        case EtapaTransferencia.PREPARACION_MERCADERIA:
          this.isPreparacionMercaderia = true;
          this.selectedResponsable = this.selectedTransferencia?.usuarioPreparacion;
          this.actionMenuOptionsList = [
            { texto: 'Verificar', role: 'verificar' },
            { texto: 'Confirmar', role: 'confirmar' },
            { texto: 'Desconfirmar', role: 'desconfirmar' },
            { texto: 'Modif. cantidad', role: 'cantidad' },
            { texto: 'Modif. vencimiento', role: 'vencimiento' },
            { texto: 'Rechazar', role: 'rechazar' }
          ]
          break;
        case EtapaTransferencia.PREPARACION_MERCADERIA_CONCLUIDA:
          this.selectedResponsable = this.selectedTransferencia?.usuarioPreparacion;
          this.isPreparacionMercaderiaConcluida = true;
          this.actionMenuOptionsList = []
          break;
        case EtapaTransferencia.TRANSPORTE_VERIFICACION:
          this.isTransporteVerificacion = true;
          this.selectedResponsable = this.selectedTransferencia?.usuarioTransporte;
          this.actionMenuOptionsList = [
            { texto: 'Verificar', role: 'verificar' },
            { texto: 'Confirmar', role: 'confirmar' },
            { texto: 'Desconfirmar', role: 'desconfirmar' },
            { texto: 'Rechazar', role: 'rechazar' },
          ]
          break;
        case EtapaTransferencia.TRANSPORTE_EN_CAMINO:
          this.selectedResponsable = this.selectedTransferencia?.usuarioTransporte;
          this.isTransporteEnCamino = true;
          this.actionMenuOptionsList = []
          break;
        case EtapaTransferencia.TRANSPORTE_EN_DESTINO:
          this.isTransporteEnDestino = true;
          this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
          this.actionMenuOptionsList = []
          break;
        case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
          this.isRecepcionEnVerificacion = true;
          this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
          this.actionMenuOptionsList = [
            { texto: 'Verificar', role: 'verificar' },
            { texto: 'Confirmar', role: 'confirmar' },
            { texto: 'Desconfirmar', role: 'desconfirmar' },
            { texto: 'Rechazar', role: 'rechazar' },
          ]
          break;
        case EtapaTransferencia.RECEPCION_CONCLUIDA:
          this.isRecepcionConcluida = true;
          this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
          this.actionMenuOptionsList = []
          break;
        default:
          break;
      }

      if (this.selectedResponsable.id == this.mainService.usuarioActual.id || this.selectedResponsable.id == null) {
        this.puedeEditar = true;
      }
    }

  }

  setAllEtapasFalse() {
    this.isPreTransferenciaCreacion = false;
    this.isPreTransferenciaOrigen = false;
    this.isPreparacionMercaderia = false;
    this.isPreparacionMercaderiaConcluida = false;
    this.isTransporteVerificacion = false;
    this.isTransporteEnCamino = false;
    this.isTransporteEnDestino = false;
    this.isRecepcionEnVerificacion = false;
    this.isRecepcionConcluida = false;
  }

  onVerificarConfirmados() {
    let okPreparacion = true;
    let okTransporte = true;
    let okRecepcion = true;
    this.selectedTransferencia?.transferenciaItemList.find(i => {
      if (this.selectedTransferencia.etapa == EtapaTransferencia.PREPARACION_MERCADERIA && i.cantidadPreparacion == null && i.vencimientoPreparacion == null && i.motivoRechazoPreparacion == null) {
        okPreparacion = false;
      } else if (this.selectedTransferencia.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION && i.cantidadTransporte == null && i.vencimientoTransporte == null && i.motivoRechazoTransporte == null) {
        okTransporte = false;
      } else if (this.selectedTransferencia.etapa == EtapaTransferencia.TRANSPORTE_EN_CAMINO && i.cantidadTransporte == null && i.vencimientoTransporte == null && i.motivoRechazoTransporte == null) {
        okTransporte = false;
      } else if (this.selectedTransferencia.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION && i.cantidadRecepcion == null && i.vencimientoRecepcion == null && i.motivoRechazoRecepcion == null) {
        okRecepcion = false;
      }
    })
    this.isAllConfirmedPreparacion = okPreparacion;
    this.isAllConfirmedTransporte = okTransporte;
    this.isAllConfirmedRecepcion = okRecepcion;
  }

  onItemPress(item) {
    this.actionMenuOptionsList.length > 0 ? this.menuActionService.presentActionSheet(this.actionMenuOptionsList).then(res => {
      let role = res.role;
      switch (role) {
        case 'verificar':
          this.onVerificarProducto(item)
          break;
        case 'confirmar':
          this.onConfirm(item)
          break;
        case 'desconfirmar':
          this.onDesconfirm(item)
          break;
        case 'cantidad':
          this.onModifCantidad(item)
          break;
        case 'vencimiento':
          this.onModifVencimiento(item)
          break;
        case 'rechazar':
          this.onRechazar(item)
          break;

        default:
          break;
      }
    }) : null;
  }

  async onAvanzarEtapa(etapa) {
    let ok = true;
    if (etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
      ok = await this.onVerificarSucursal() || isDevMode();
    }
    ok ? this.transferenciaService.onAvanzarEtapa(this.selectedTransferencia, etapa)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.selectedTransferencia.etapa = etapa;
          if (etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
            this.selectedTransferencia.usuarioTransporte = this.mainService.usuarioActual;
          } else if (etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
            this.selectedTransferencia.usuarioPreparacion = this.mainService.usuarioActual;
          } else if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
          } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_CAMINO) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_TRANSITO;
          } else if (etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_DESTINO;
            this.selectedTransferencia.usuarioRecepcion = this.mainService.usuarioActual;
          }
          this.verificarEtapa()
        }
      })
      :
      null;
  }

  async onConfirm(item: TransferenciaItem) {
    let newItem = new TransferenciaItem;
    item = Object.assign(newItem, item)
    if (this.selectedTransferencia?.etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
      item.cantidadPreparacion = item.cantidadPreTransferencia;
      item.presentacionPreparacion = item.presentacionPreTransferencia;
      item.vencimientoPreparacion = item?.vencimientoPreTransferencia;
      item.motivoModificacionPreparacion = null;
      item.motivoRechazoPreparacion = null;
    } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
      item.cantidadTransporte = item.cantidadPreparacion;
      item.presentacionTransporte = item.presentacionPreparacion;
      item.vencimientoTransporte = item?.vencimientoPreparacion;
      item.motivoModificacionTransporte = null;
      item.motivoRechazoTransporte = null;
    } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
      item.cantidadRecepcion = item.cantidadTransporte;
      item.presentacionRecepcion = item.presentacionTransporte;
      item.vencimientoRecepcion = item?.vencimientoTransporte;
      item.motivoModificacionRecepcion = null;
      item.motivoRechazoRecepcion = null;
    }
    (await this.transferenciaService.onSaveTransferenciaItem(item.toInput()))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          let index = this.selectedTransferencia.transferenciaItemList.findIndex(i => i.id == res.id)
          this.selectedTransferencia.transferenciaItemList.splice(index, 1)
          let index2 = this.filteredTransferenciaItemList.findIndex(i => i.id == res.id)
          this.filteredTransferenciaItemList.splice(index2, 1)
        }
        this.onVerificarConfirmados()
      })
  }


  async onDesconfirm(item: TransferenciaItem) {
    let newItem = new TransferenciaItem;
    item = Object.assign(newItem, item)
    if (this.selectedTransferencia?.etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
      item.cantidadPreparacion = null
      item.presentacionPreparacion = null
      item.vencimientoPreparacion = null
      item.motivoModificacionPreparacion = null;
      item.motivoRechazoPreparacion = null;
    } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
      item.cantidadTransporte = null
      item.presentacionTransporte = null
      item.vencimientoTransporte = null
      item.motivoModificacionTransporte = null;
      item.motivoRechazoTransporte = null;
    } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
      item.cantidadRecepcion = null
      item.presentacionRecepcion = null
      item.vencimientoRecepcion = null
      item.motivoModificacionRecepcion = null;
      item.motivoRechazoRecepcion = null;
    }
    (await this.transferenciaService.onSaveTransferenciaItem(item.toInput()))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.selectedTransferencia.transferenciaItemList = updateDataSourceWithId(this.selectedTransferencia.transferenciaItemList, item, item.id)
          this.filteredTransferenciaItemList = updateDataSourceWithId(this.filteredTransferenciaItemList, item, item.id)
        }
        this.onVerificarConfirmados()
      })
  }

  onRechazar(item) {
    let newItem = new TransferenciaItem;
    item = Object.assign(newItem, item)
    this.menuActionService.presentActionSheet([
      { texto: 'Falta de producto', role: TransferenciaItemMotivoRechazo.FALTA_PRODUCTO },
      { texto: 'Producto averiado', role: TransferenciaItemMotivoRechazo.PRODUCTO_AVERIADO },
      { texto: 'Producto equivocado', role: TransferenciaItemMotivoRechazo.PRODUCTO_EQUIVOCADO },
      { texto: 'Producto vencido', role: TransferenciaItemMotivoRechazo.PRODUCTO_VENCIDO },
    ]).then(async res => {
      switch (this.selectedTransferencia.etapa) {
        case EtapaTransferencia.PREPARACION_MERCADERIA:
          item.cantidadPreparacion = null;
          item.motivoModificacionPreparacion = null
          item.vencimientoPreparacion = null
          item.motivoRechazoPreparacion = res.role;
          break;
        case EtapaTransferencia.TRANSPORTE_VERIFICACION:
          item.cantidadTransporte = null;
          item.motivoModificacionTransporte = null
          item.vencimientoTransporte = null
          item.motivoRechazoTransporte = res.role;
          break;
        case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
          item.cantidadRecepcion = null;
          item.motivoModificacionRecepcion = null
          item.vencimientoRecepcion = null
          item.motivoRechazoRecepcion = res.role;
          break;
        default:
          break;
      }
      (await this.transferenciaService.onSaveTransferenciaItem(item.toInput()))
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.selectedTransferencia.transferenciaItemList = updateDataSourceWithId(this.selectedTransferencia.transferenciaItemList, item, item.id)
            this.filteredTransferenciaItemList = updateDataSourceWithId(this.filteredTransferenciaItemList, item, item.id)
          }
          this.onVerificarConfirmados()
        })
    });
  }

  onModifCantidad(item) {
    this.onModificarItem(item, true, false)
  }
  onModifVencimiento(item) {
    this.onModificarItem(item, false, true)
  }

  onModificarItem(item: TransferenciaItem, isCantidad?, isVencimiento?) {
    let newItem = new TransferenciaItem;
    item = Object.assign(newItem, item)
    this.popoverService.open(ModificarItemDialogComponent, {
      isCantidad,
      isVencimiento,
    }, PopoverSize.XS).then(async res => {
      if (res.data != null) {
        if (isCantidad) {
          if (this.selectedTransferencia?.etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
            item.presentacionPreparacion = item.presentacionPreTransferencia;
            item.vencimientoPreparacion = item.vencimientoPreTransferencia;
            item.cantidadPreparacion = res.data?.cantidad;
            item.motivoModificacionPreparacion = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
            item.cantidadTransporte = res.data?.cantidad;
            item.vencimientoTransporte = item.vencimientoPreparacion;
            item.presentacionTransporte = item.presentacionPreparacion
            item.motivoModificacionTransporte = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            item.cantidadRecepcion = res.data?.cantidad;
            item.vencimientoRecepcion = item.vencimientoTransporte;
            item.presentacionRecepcion = item.presentacionTransporte;
            item.motivoModificacionRecepcion = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          }
        } else if (isVencimiento) {
          if (this.selectedTransferencia?.etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
            item.vencimientoPreparacion = res.data?.vencimiento;
            item.presentacionPreparacion = item.presentacionPreTransferencia;
            item.cantidadPreparacion = item.cantidadPreTransferencia;
            item.motivoModificacionPreparacion = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
          } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
            item.vencimientoTransporte = res.data?.vencimiento;
            item.presentacionTransporte = item.presentacionPreparacion;
            item.cantidadTransporte = item.cantidadPreparacion;
            item.motivoModificacionTransporte = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
          } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            item.vencimientoRecepcion = res.data?.vencimiento;
            item.presentacionRecepcion = item.presentacionTransporte;
            item.cantidadRecepcion = item.cantidadTransporte;
            item.motivoModificacionRecepcion = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
          }
        }
        (await this.transferenciaService.onSaveTransferenciaItem(item.toInput()))
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res != null) {
              this.selectedTransferencia.transferenciaItemList = updateDataSourceWithId(this.selectedTransferencia.transferenciaItemList, res, res.id)
              this.filteredTransferenciaItemList = updateDataSourceWithId(this.filteredTransferenciaItemList, res, res.id)

            }
            this.onVerificarConfirmados()
          })
      }

    })
  }

  onAvatarClick(image) {
    this.popoverService.open(ImagePopoverComponent, {
      image
    }, PopoverSize.MD)
  }

  async onVerificarSucursal(): Promise<boolean> {
    let loading = await this.cargandoService.open('Abriendo camara...')
    setTimeout(() => {
      this.cargandoService.close(loading)
    }, 1000);
    return this.barcodeScanner.scan().then(async barcodeData => {
      this.notificacionService.open('Escaneado con éxito!', TipoNotificacion.SUCCESS, 1)
      let codigo: string = barcodeData.text;
      let arr = codigo.split('-')
      let prefix = arr[2]
      let sucId: number = +arr[1]
      if (prefix == TipoEntidad.SUCURSAL && sucId != null) {
        if (this.selectedTransferencia?.sucursalDestino?.id == sucId) {
          return true;
        }
      } else {
        this.notificacionService.openItemNoEncontrado()
        return false;
      }
    }).catch(err => {
      this.notificacionService.openAlgoSalioMal()
      return false;
    });

  }

  onVerificarProducto(item: TransferenciaItem) {
    let producto = item?.presentacionPreTransferencia?.producto;
    if (producto?.id != null) {
      this.barcodeScanner.scan().then(async res => {
        if (res.text != null) {
          (await this.codigoService.onGetCodigoPorCodigo(res.text)).subscribe(codigoRes => {
            if (codigoRes.length > 0) {
              if (codigoRes.find(c => c.presentacion?.producto?.id == producto?.id) != null) {
                this.notificacionService.success("Producto correcto!!")
              } else {
                this.notificacionService.danger("Producto no corresponde")
              }
            } else {
              this.notificacionService.danger("Código no encontrado")
            }
          })
        } else {
          this.notificacionService.danger("Error en leer código")
        }
      })
    }
  }

  onCargarMenos() {
    this.page--;
    if(this.page==0) this.page = 1;
    this.onFilterTransferenciaItem()
  }

  onCargarMas() {
    this.page++;
    this.onFilterTransferenciaItem()
  }

  onShare() {
    let codigo = new QrData;
    codigo.tipoEntidad = TipoEntidad.TRANSFERENCIA;
    codigo.idCentral = this.selectedTransferencia?.id;
    codigo.idOrigen = this.selectedTransferencia?.id;
    this.popoverService.open(QrGeneratorComponent, codificarQr(codigo), PopoverSize.XS)
  }


  onBuscarClick() { }
  onCameraClick() { }

}
