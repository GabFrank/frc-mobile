import { ModificarItemDialogComponent } from './../modificar-item-dialog/modificar-item-dialog.component';
import { PopOverService, PopoverSize } from './../../../services/pop-over.service';
import { ActionMenuData } from './../../../services/menu-action.service';
import { MainService } from 'src/app/services/main.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ActivatedRoute } from '@angular/router';
import { TransferenciaService } from './../transferencia.service';
import { EtapaTransferencia, Transferencia, TransferenciaEstado, TransferenciaItem, TransferenciaItemMotivoModificacion, TransferenciaItemMotivoRechazo } from './../transferencia.model';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { updateDataSourceWithId } from 'src/app/generic/utils/numbersUtils';


@UntilDestroy()
@Component({
  selector: 'app-info-transferencia',
  templateUrl: './info-transferencia.component.html',
  styleUrls: ['./info-transferencia.component.scss'],
})
export class InfoTransferenciaComponent implements OnInit {

  selectedTransferencia: Transferencia;
  selectedResponsable: Usuario;

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

  constructor(
    private transferenciaService: TransferenciaService,
    private route: ActivatedRoute,
    private _location: Location,
    private mainService: MainService,
    private menuActionService: MenuActionService,
    private popoverService: PopOverService
  ) { }

  ngOnInit() {
    //innicializar arrays
    this.actionMenuOptionsList = []

    this.route.paramMap.subscribe(res => {
      this.buscarTransferencia(res.get('id'))
    });

  }

  buscarTransferencia(id) {
    if (id != null) {
      this.transferenciaService.onGetTransferencia(id)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.selectedTransferencia = res;
            console.log(res)
            this.verificarEtapa()
          }
        })
    }
  }

  onBack() {
    this._location.back()
  }

  verificarEtapa() {
    this.setAllEtapasFalse()
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
          { texto: 'Confirmar', role: 'confirmar' },
          { texto: 'Desconfirmar', role: 'desconfirmar' },
          { texto: 'Modif. cantidad', role: 'cantidad' },
          { texto: 'Modif. vencimiento', role: 'vencimiento' },
          { texto: 'Rechazar', role: 'rechazar' },
        ]
        break;
      case EtapaTransferencia.PREPARACION_MERCADERIA_CONCLUIDA:
        this.selectedResponsable = this.selectedTransferencia?.usuarioPreparacion;
        this.isPreparacionMercaderiaConcluida = true;

        break;
      case EtapaTransferencia.TRANSPORTE_VERIFICACION:
        this.isTransporteVerificacion = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioTransporte;

        break;
      case EtapaTransferencia.TRANSPORTE_EN_CAMINO:
        this.selectedResponsable = this.selectedTransferencia?.usuarioTransporte;
        this.isTransporteEnCamino = true;
        break;
      case EtapaTransferencia.TRANSPORTE_EN_DESTINO:
        this.isTransporteEnDestino = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
        break;
      case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
        this.isRecepcionEnVerificacion = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
        this.actionMenuOptionsList = [
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

    this.onVerificarConfirmados()
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
      } else if (this.selectedTransferencia.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION && i.cantidadRecepcion == null && i.vencimientoRecepcion == null && i.motivoRechazoRecepcion == null) {
        okRecepcion = false;
        console.log('es falso')
      }
    })
    this.isAllConfirmedPreparacion = okPreparacion;
    this.isAllConfirmedTransporte = okTransporte;
    this.isAllConfirmedRecepcion = okRecepcion;
  }

  onItemPress(item) {
    this.menuActionService.presentActionSheet(this.actionMenuOptionsList).then(res => {
      let role = res.role;
      switch (role) {
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
    })
  }

  onAvanzarEtapa(etapa) {
    console.log(etapa)
    this.transferenciaService.onAvanzarEtapa(this.selectedTransferencia, etapa)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.selectedTransferencia.etapa = etapa;
          if (etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
            this.selectedTransferencia.usuarioPreparacion = this.mainService.usuarioActual;
          } else if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
          } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_CAMINO) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_TRANSITO;
          } else if (etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_DESTINO;
          }
          this.verificarEtapa()
        }
      })
  }

  onConfirm(item: TransferenciaItem) {
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
    this.transferenciaService.onSaveTransferenciaItem(item.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.selectedTransferencia.transferenciaItemList = updateDataSourceWithId(this.selectedTransferencia.transferenciaItemList, item, item.id)
        }
        this.onVerificarConfirmados()
      })
  }


  onDesconfirm(item: TransferenciaItem) {
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
    this.transferenciaService.onSaveTransferenciaItem(item.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.selectedTransferencia.transferenciaItemList = updateDataSourceWithId(this.selectedTransferencia.transferenciaItemList, item, item.id)
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
    ]).then(res => {
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
      this.transferenciaService.onSaveTransferenciaItem(item.toInput())
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.selectedTransferencia.transferenciaItemList = updateDataSourceWithId(this.selectedTransferencia.transferenciaItemList, item, item.id)
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
    }, PopoverSize.XS).then(res => {
      if (res.data != null) {
        if (isCantidad) {
          if (this.selectedTransferencia?.etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
            item.cantidadPreparacion = res.data?.cantidad;
          } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
            item.cantidadTransporte = res.data?.cantidad;
          } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            item.cantidadRecepcion = res.data?.cantidad;
          }
          item.motivoModificacionPreparacion = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
        } else if (isVencimiento) {
          if (this.selectedTransferencia?.etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
            item.vencimientoPreparacion = res.data?.vencimiento;
          } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
            item.vencimientoTransporte = res.data?.vencimiento;
          } else if (this.selectedTransferencia?.etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            item.vencimientoRecepcion = res.data?.vencimiento;
          }
          item.motivoModificacionPreparacion = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
        }
        this.transferenciaService.onSaveTransferenciaItem(item.toInput())
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res != null) {
              this.selectedTransferencia.transferenciaItemList = updateDataSourceWithId(this.selectedTransferencia.transferenciaItemList, res, res.id)
            }
            this.onVerificarConfirmados()
          })
      }

    })
  }

}
