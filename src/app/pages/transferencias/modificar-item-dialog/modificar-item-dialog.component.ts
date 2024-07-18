import { PopOverService } from './../../../services/pop-over.service';
import { Form, FormControl, Validators } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { EtapaTransferencia, Transferencia, TransferenciaItem } from '../transferencia.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { PresentacionService } from 'src/app/services/presentacion/presentacion.service';

export interface ModificarItemData {
  isCantidad;
  isVencimiento;
  item: TransferenciaItem;
  transferencia: Transferencia;
}
@Component({
  selector: 'app-modificar-item-dialog',
  templateUrl: './modificar-item-dialog.component.html',
  styleUrls: ['./modificar-item-dialog.component.scss'],
})
export class ModificarItemDialogComponent implements OnInit {

  cantidadAnterior;
  vencimientoAnterior;
  cantidadControl;
  vencimientoControl: FormControl;
  presentacionAnterior: Presentacion;
  presentacionControl: FormControl;
  presentacionList: Presentacion[];

  @Input() data: ModificarItemData;

  isCantidad = false;
  isVencimiento = false;

  constructor(private popoverService: PopOverService, private presentacionService: PresentacionService) { }

  async ngOnInit() {
    if(this.data?.item?.presentacionPreTransferencia != null){
     (await this.presentacionService.onGetPresentacionesPorProductoId(this.data.item.presentacionPreTransferencia?.producto?.id)).subscribe(presentacionRes => {
      if(presentacionRes?.length > 0){
        this.presentacionList = presentacionRes;
        // this.presentacionControl = new FormControl(this.presentacionList.find(p => p.id == this.data.item.presentacionPreTransferencia?.id), [Validators.required])
      }
     })
    }
    this.cantidadControl = new FormControl(null)
    this.vencimientoControl = new FormControl(null, [Validators.required])
    this.presentacionControl = new FormControl(null);

    if(this.data.isCantidad){
      this.isCantidad = true;
    } else if(this.data.isVencimiento){
      this.isVencimiento = true;
    }
    switch(this.data.transferencia.etapa){
      case EtapaTransferencia.PREPARACION_MERCADERIA:
        this.cantidadAnterior =   this.data.item?.cantidadPreparacion || this.data.item.cantidadPreTransferencia;
        this.vencimientoAnterior = this.data.item?.vencimientoPreparacion || this.data.item.vencimientoPreTransferencia;
        this.presentacionAnterior = this.data.item?.presentacionPreparacion || this.data.item.presentacionPreTransferencia;
        break;
      case EtapaTransferencia.TRANSPORTE_VERIFICACION:
        this.cantidadAnterior = this.data.item?.cantidadTransporte | this.data.item.cantidadPreparacion;
        this.vencimientoAnterior = this.data.item?.vencimientoTransporte || this.data.item.vencimientoPreparacion;
        this.presentacionAnterior = this.data.item?.presentacionTransporte || this.data.item.presentacionPreparacion;
        break;
        case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
        this.cantidadAnterior = this.data.item?.cantidadRecepcion | this.data.item.cantidadTransporte;
        this.vencimientoAnterior = this.data.item?.vencimientoRecepcion || this.data.item.vencimientoTransporte;
        this.presentacionAnterior = this.data.item?.presentacionRecepcion || this.data.item.presentacionTransporte;
        break;
      default:
        break;
    }
  }

  onAceptar(){
    if(this.cantidadControl.value == null) this.cantidadControl.setValue(this.cantidadAnterior);
    if(this.vencimientoControl.value == null) this.vencimientoControl.setValue(this.vencimientoAnterior);
    if(this.presentacionControl.value == null) this.presentacionControl.setValue(this.presentacionAnterior);
    this.popoverService.close({cantidad: this.cantidadControl.value, vencimiento: this.vencimientoControl.value, presentacion: this.presentacionControl.value})
  }

  onCancel(){
    this.popoverService.close(null)
  }

}
