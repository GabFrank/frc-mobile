import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { NotaRecepcion } from '../nota-recepcion.model';
import { NotaRecepcionService } from '../nota-recepcion.service';
import {
  GenericListDialogComponent,
  GenericListDialogData,
  TableData
} from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { ModalService, ModalSize } from 'src/app/services/modal.service';
import { ProveedoresSearchByPersonaGQL } from 'src/app/pages/personas/proveedor/graphql/proveedorSearchByPersona';
import { ProveedoresSearchByPersonaPageGQL } from 'src/app/pages/personas/proveedor/graphql/proveedorSearchByPersonaPage';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { DialogoService } from 'src/app/services/dialogo.service';
import { NotaRecepcionInfoDialogComponent } from '../nota-recepcion-info-dialog/nota-recepcion-info-dialog.component';
import { IonInput } from '@ionic/angular';

@Component({
  selector: 'app-recepcion-notas',
  templateUrl: './recepcion-notas.component.html',
  styleUrls: ['./recepcion-notas.component.scss'],
  providers: [BarcodeScanner]
})
export class RecepcionNotasComponent implements OnInit {
  @ViewChild('numeroNotaInput', { static: false, read: IonInput })
  numeroNotaInput: IonInput;

  numeroNotaControl = new FormControl();
  buscarProveedorControl = new FormControl();
  selectedSucursal: Sucursal;
  notaRecepcionList: NotaRecepcion[] = [];
  selectedProveedor: Proveedor;
  constructor(
    private _location: Location,
    private barcodeScanner: BarcodeScanner,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private mainService: MainService,
    private router: Router,
    private sucursalService: SucursalService,
    private notaRecepcionService: NotaRecepcionService,
    private modalService: ModalService,
    public proveedorSearchPage: ProveedoresSearchByPersonaPageGQL,
    private dialogService: DialogoService
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
      search: true,
      texto: this.buscarProveedorControl.value?.toUpperCase(),
      query: this.proveedorSearchPage,
      paginator: true
    };

    this.modalService
      .openModal(GenericListDialogComponent, data)
      .then((res) => {
        if (res?.data != null) {
          this.selectedProveedor = res.data;
          this.buscarProveedorControl.setValue(null);
        }
      });
  }

  async onAddNumeroNota() {
    if (
      this.selectedProveedor != null &&
      this.numeroNotaControl.value != null
    ) {
      (
        await this.notaRecepcionService.onGetNotaRecepcionPorProveedorAndNumero(
          this.selectedProveedor.id,
          this.numeroNotaControl.value
        )
      ).subscribe((res) => {
        if (res?.length == 1) {
          this.modalService
            .openModal(
              NotaRecepcionInfoDialogComponent,
              {
                notaRecepcion: res[0]
              },
              ModalSize.MEDIUM
            )
            .then((dialogRes) => {
              if (dialogRes?.data?.agregar) {
                this.notaRecepcionList.push(res[0]);
                this.numeroNotaControl.setValue(null);
                setTimeout(() => {
                  this.numeroNotaInput?.setFocus();
                }, 1000);
              }
            });
        } else if (res?.length == 0) {
          setTimeout(() => {
            this.numeroNotaInput.setFocus();
          }, 1000);
        }
      });
    }
  }

  delelteNotaFromList(nota, i) {
    this.dialogService
      .open('Atención!!', 'Realmente desea eliminar este item de la lista?')
      .then((res) => {
        if (res.role == 'aceptar') {
          this.notaRecepcionList.splice(i, 1);
          setTimeout(() => {
            this.numeroNotaInput?.setFocus();
          }, 1000);
        }
      });
  }

  onNotaRecepcionClick(notaRecepcion: NotaRecepcion, index?) {
    this.modalService
      .openModal(
        NotaRecepcionInfoDialogComponent,
        {
          notaRecepcion: notaRecepcion,
          index
        },
        ModalSize.MEDIUM
      )
      .then((dialogRes) => {
        if (dialogRes?.data?.eliminar) {
          this.notaRecepcionList.splice(index, 1);
          setTimeout(() => {
            this.numeroNotaInput?.setFocus();
          }, 1000);
        }
      });
  }

  onBorrarProveedor() {
    this.dialogService
      .open(
        'Atención!!',
        'Realmente desea cambiar de proveedor?. Las notas agregadas serán eliminadas.'
      )
      .then((res) => {
        if (res.role == 'aceptar') {
          this.selectedProveedor = null;
          this.notaRecepcionList = [];
        }
      });
  }

  onIniciarRecepcion() {}

  onSolicitarPago() {}

  onBack() {
    this._location.back();
  }
}
