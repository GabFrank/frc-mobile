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
import { NotaRecepcionAgrupada, NotaRecepcionAgrupadaEstado } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { NotaRecepcionAgrupadaService } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.service';
import { forkJoin } from 'rxjs';

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
    private dialogService: DialogoService,
    private notaRecepcionAgrupadaService: NotaRecepcionAgrupadaService
  ) { }

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
        width: 100
      },
      {
        id: 'persona.nombre',
        nombre: 'Nombre',
        width: 100
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
    if (this.numeroNotaControl.value != null) {
      // Use new method that handles complex filtering logic
      (
        await this.notaRecepcionService.onGetNotasDisponiblesParaRecepcion(
          this.numeroNotaControl.value,
          this.selectedProveedor?.id,
          this.selectedSucursal?.id
        )
      ).subscribe((res) => {
        if (res?.length == 1) {
          // Single result found - set proveedor if not already selected and add the nota
          if (!this.selectedProveedor) {
            this.selectedProveedor = res[0].pedido.proveedor;
          }
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
        } else if (res?.length > 1) {
          // Multiple results found - show in GenericListDialogComponent
          this.showNotaRecepcionListDialog(res);
        } else {
          // No results found
          this.notificacionService.open(
            'No se encontraron notas con ese número',
            TipoNotificacion.DANGER,
            3
          );
          setTimeout(() => {
            this.numeroNotaInput.setFocus();
          }, 1000);
        }
      });
    }
  }

  private showNotaRecepcionListDialog(notaRecepcionList: NotaRecepcion[]) {
    let tableData: TableData[] = [
      {
        id: 'pedido.proveedor.persona.nombre',
        nombre: 'Proveedor',
        width: 12,
        orientation: 'vertical'
      },
      {
        id: 'id',
        nombre: 'Id',
        width: 6,
        orientation: 'vertical'
      },
      {
        id: 'numero',
        nombre: 'Número',
        width: 6,
        orientation: 'vertical'
      },
      {
        id: 'fecha',
        nombre: 'Fecha',
        width: 6,
        pipe: 'date',
        pipeArgs: 'shortDate',
        orientation: 'vertical'
      },
      {
        id: 'valor',
        nombre: 'Valor',
        width: 6,
        pipe: 'number',
        pipeArgs: '1.0-2',
        valueColor: '#43a047',
        orientation: 'vertical'
      }
    ];

    let data: GenericListDialogData = {
      tableData: tableData,
      titulo: 'Seleccionar Nota de Recepción',
      search: false,
      inicialData: notaRecepcionList,
      paginator: false
    };

    console.log(notaRecepcionList);

    this.modalService
      .openModal(GenericListDialogComponent, data)
      .then((res) => {
        if (res?.data != null) {
          this.selectedProveedor = res.data.pedido.proveedor;
          this.modalService
            .openModal(
              NotaRecepcionInfoDialogComponent,
              {
                notaRecepcion: res.data
              },
              ModalSize.MEDIUM
            )
            .then((dialogRes) => {
              if (dialogRes?.data?.agregar) {
                this.notaRecepcionList.push(res.data);
                this.numeroNotaControl.setValue(null);
                setTimeout(() => {
                  this.numeroNotaInput?.setFocus();
                }, 1000);
              }
            });
        }
      });
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

  async onIniciarRecepcion() {
    const dialogResult = await this.dialogService.open('Atención!!', 'Realmente desea iniciar la recepción de notas?');
    if (dialogResult.role === 'aceptar') {
      try {
        let notaRecpcionAgrupada = new NotaRecepcionAgrupada();
        notaRecpcionAgrupada.proveedor = this.selectedProveedor;
        notaRecpcionAgrupada.usuario = this.mainService.usuarioActual;
        notaRecpcionAgrupada.sucursal = this.selectedSucursal;
        notaRecpcionAgrupada.estado = NotaRecepcionAgrupadaEstado.EN_RECEPCION;

        (await this.notaRecepcionAgrupadaService.onSaveNotaRecepcionAgrupada(notaRecpcionAgrupada.toInput()))
          .subscribe(async notaRecepcionAggRes => {
            if (notaRecepcionAggRes != null) {
              const saveOperations = this.notaRecepcionList.map(async nota => {
                let notaAux = new NotaRecepcion();
                Object.assign(notaAux, nota);
                notaAux.notaRecepcionAgrupada = notaRecepcionAggRes;
                console.log('Saving nota:', notaAux);
                return (await this.notaRecepcionService.onSaveNotaRecepcion(notaAux.toInput())).subscribe();
              });

              forkJoin(saveOperations).subscribe({
                next: () => {
                  console.log('All notas saved successfully');
                  this.notificacionService.openGuardadoConExito();
                  this.router.navigate(['/operaciones/pedidos/recepcion-producto', notaRecepcionAggRes.id]);
                },
                error: (error) => {
                  console.error('Error saving notes:', error);
                  this.notificacionService.openAlgoSalioMal();
                }
              });
            }
          });
      } catch (error) {
        console.error('Error during save operation:', error);
        this.notificacionService.openAlgoSalioMal();
      }
    }
  }

  onSolicitarPago() { }

  onBack() {
    this._location.back();
  }
}
