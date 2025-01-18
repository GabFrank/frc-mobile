import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { TipoEntidad } from 'src/app/domains/enums/tipo-entidad.enum';
import { CargandoService } from 'src/app/services/cargando.service';
import { MainService } from 'src/app/services/main.service';
import {
  NotificacionService,
  TipoNotificacion
} from 'src/app/services/notificacion.service';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { FormControl } from '@angular/forms';
import { NotaRecepcion } from '../nota-recepcion/nota-recepcion.model';
import { NotaRecepcionService } from '../nota-recepcion/nota-recepcion.service';
import { GenericListDialogComponent, GenericListDialogData, TableData } from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-recepcion-notas',
  templateUrl: './recepcion-notas.component.html',
  styleUrls: ['./recepcion-notas.component.scss'],
  providers: [BarcodeScanner]
})
export class RecepcionNotasComponent implements OnInit {
  numeroNotaControl = new FormControl();
  buscarProveedorControl = new FormControl();
  selectedSucursal: Sucursal;
  notaRecepcionList: NotaRecepcion[];

  constructor(
    private _location: Location,
    private barcodeScanner: BarcodeScanner,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private mainService: MainService,
    private router: Router,
    private sucursalService: SucursalService,
    private notaRecepcionService: NotaRecepcionService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    console.log(this.mainService.isDev);

    this.onVerificarSucursal();
  }

  async onVerificarSucursal() {
    let loading = await this.cargandoService.open('Abriendo camara...');
    setTimeout(() => {
      this.cargandoService.close(loading);
    }, 1000);
    if (!this.mainService.isDev) {
      this.barcodeScanner
        .scan()
        .then(async (barcodeData) => {
          this.notificacionService.open(
            'Escaneado con éxito!',
            TipoNotificacion.SUCCESS,
            1
          );
          let codigo: string = barcodeData.text;
          let arr = codigo.split('-');
          let prefix = arr[2];
          let sucId: number = +arr[1];
          (await this.sucursalService.onGetSucursal(sucId)).subscribe(
            (sucRes) => {
              if (sucRes != null) {
                this.selectedSucursal = sucRes;
              }
            }
          );
        })
        .catch((err) => {
          this.notificacionService.openAlgoSalioMal();
          return false || this.mainService.isDev;
        });
    } else {
      (await this.sucursalService.onGetSucursal(5)).subscribe((sucRes) => {
        if (sucRes != null) {
          this.selectedSucursal = sucRes;
        }
      });
    }
  }

  onSearchProveeodr() {
    let tableData: TableData[] = [
      {
        id: 'id',
        nombre: 'Id',
        width: 100,
        nested: false
      },
      {
        id: 'persona',
        nombre: 'Nombre',
        width: 100,
        nested: true,
        nestedId: 'nombre'
      }
    ];
    let data: GenericListDialogData = {
      tableData: tableData,
      titulo: 'Lista de proveedores',
      search: this.buscarProveedorControl.value != null ? true : false,
    };

    this.modalService.openModal(GenericListDialogComponent, data).then(res => {
      console.log(res);
    });
  }

  onAddNumeroNota() {
    this.notaRecepcionService.onGetNotaRecepcion;
  }

  onSolicitarPago() {}

  onBack() {
    this._location.back();
  }
}
