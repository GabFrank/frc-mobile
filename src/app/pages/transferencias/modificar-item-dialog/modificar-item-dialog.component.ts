import { PopOverService } from './../../../services/pop-over.service';
import { FormControl, Validators } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';

export interface ModificarItemData {
  isCantidad;
  isVencimiento
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
  vencimientoControl;

  @Input() data: ModificarItemData;

  isCantidad = false;
  isVencimiento = false;

  constructor(private popoverService: PopOverService) { }

  ngOnInit() {
    this.cantidadControl = new FormControl(null, [Validators.required, Validators.min(1)])
    this.vencimientoControl = new FormControl(null, [Validators.required])
    if(this.data.isCantidad){
      this.isCantidad = true;
    } else if(this.data.isVencimiento){
      this.isVencimiento = true;
    }
  }

  onAceptar(){
    this.popoverService.close({cantidad: this.cantidadControl.value, vencimiento: this.vencimientoControl.value})
  }

  onCancel(){
    this.popoverService.close(null)
  }

}
