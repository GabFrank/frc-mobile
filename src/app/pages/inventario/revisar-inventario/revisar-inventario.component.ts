import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { ProductoService } from '../../producto/producto.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ModalController } from '@ionic/angular';
import { ModalService } from 'src/app/services/modal.service';
import { TransferenciaService } from '../../transferencias/transferencia.service';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';
import { Location } from '@angular/common';
@Component({
  selector: 'app-revisar-inventario',
  templateUrl: './revisar-inventario.component.html',
  styleUrls: ['./revisar-inventario.component.scss'],
})
export class RevisarInventarioComponent implements OnInit {

  constructor(
    private _location: Location
  ) {}

  ngOnInit() {
   
  }

  onBack(){
    this._location.back();
  }
}
